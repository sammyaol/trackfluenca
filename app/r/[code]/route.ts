import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const FALLBACK_URL = 'https://kolure.de'

type Context = { params: Promise<{ code: string }> }

export async function GET(req: NextRequest, ctx: Context) {
  const { code } = await ctx.params
  const { data: link } = await supabase.from('outreach_links').select('*').eq('short_code', code).maybeSingle()

  if (!link) {
    return NextResponse.redirect(FALLBACK_URL)
  }

  try {
    const ua = req.headers.get('user-agent') || ''
    const referrer = req.headers.get('referer') || ''
    const device = /mobile|android|iphone/i.test(ua) ? 'mobile' : 'desktop'
    await supabase.from('outreach_link_klicks').insert({ link_id: link.id, referrer, user_agent: ua, device })
    await supabase
      .from('outreach_links')
      .update({ klicks: (link.klicks || 0) + 1, letzter_klick_am: new Date().toISOString() })
      .eq('id', link.id)
  } catch {}

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

  return NextResponse.redirect(finalUrl)
}
