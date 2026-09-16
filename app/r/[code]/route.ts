import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { after } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const FALLBACK_URL = 'https://kolure.de'

// Run this function close to the Supabase DB (eu-west-1/Dublin) and to our
// mostly-German traffic. Previously this had no explicit region, so Vercel
// picked the project default (iad1 / US East) - every click paid for a
// transatlantic round trip to the DB on top of the redirect itself.
export const preferredRegion = ['fra1']
export const runtime = 'nodejs'

type Context = { params: Promise<{ code: string }> }

export async function GET(req: NextRequest, ctx: Context) {
  const { code } = await ctx.params

  // Only query the columns we actually need for the redirect decision -
  // less data to serialize/transfer per request.
  const { data: link } = await supabase
    .from('outreach_links')
    .select('id, ziel_url, utm_source, utm_medium, utm_campaign, rabatt_code, klicks')
    .eq('short_code', code)
    .maybeSingle()

  if (!link) {
    return NextResponse.redirect(FALLBACK_URL)
  }

  let target: URL
  try {
    target = new URL(link.ziel_url)
  } catch {
    return NextResponse.redirect(FALLBACK_URL)
  }
  if (link.utm_source) target.searchParams.set('utm_source', link.utm_source)
  if (link.utm_medium) target.searchParams.set('utm_medium', link.utm_medium)
  if (link.utm_campaign) target.searchParams.set('utm_campaign', link.utm_campaign)

  let finalUrl = target.toString()
  if (link.rabatt_code) {
    const redirectPath = target.pathname + target.search
    finalUrl = `${target.origin}/discount/${encodeURIComponent(link.rabatt_code)}?redirect=${encodeURIComponent(redirectPath)}`
  }

  // Click-logging is pure bookkeeping - it must never make the visitor wait.
  // `after()` lets Vercel send the redirect immediately and run these two
  // writes in the background once the response has already gone out.
  const ua = req.headers.get('user-agent') || ''
  const referrer = req.headers.get('referer') || ''
  const device = /mobile|android|iphone/i.test(ua) ? 'mobile' : 'desktop'
  after(async () => {
    try {
      await Promise.all([
        supabase.from('outreach_link_klicks').insert({ link_id: link.id, referrer, user_agent: ua, device }),
        supabase
          .from('outreach_links')
          .update({ klicks: (link.klicks || 0) + 1, letzter_klick_am: new Date().toISOString() })
          .eq('id', link.id),
      ])
    } catch {}
  })

  return NextResponse.redirect(finalUrl)
}
