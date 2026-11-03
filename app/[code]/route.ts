import { NextRequest, NextResponse, after } from 'next/server'

// Schnell-Link ohne Datenbank: link.kolure.de/<RABATTCODE>
// Der Code im Pfad bestimmt Ziel, Kampagne und Rabatt direkt, ohne Datenbank-Abfrage vor der
// Weiterleitung. Der Klick wird danach im Hintergrund gezaehlt. Laeuft nur auf der link.-Domain.
export const runtime = 'edge'
export const preferredRegion = ['fra1']
export const dynamic = 'force-dynamic'

const SHOP = 'https://kolure.de'
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const H = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }

type Context = { params: Promise<{ code: string }> }

export async function GET(req: NextRequest, ctx: Context) {
  const host = req.headers.get('host') || ''
  if (!host.startsWith('link.')) return new NextResponse('Not found', { status: 404 })
  const { code } = await ctx.params
  if (!/^[a-z0-9_.-]{2,40}$/i.test(code)) return NextResponse.redirect(SHOP, 302)

  const lower = code.toLowerCase()
  const target = new URL(SHOP + '/')
  target.searchParams.set('utm_source', 'mklusive')
  target.searchParams.set('utm_medium', 'influencer')
  target.searchParams.set('utm_campaign', 'mk-' + lower)
  target.searchParams.set('discount', lower)
  const finalUrl = `${SHOP}/discount/${encodeURIComponent(lower)}?redirect=${encodeURIComponent(target.pathname + target.search)}`

  const ua = req.headers.get('user-agent') || ''
  const referrer = req.headers.get('referer') || ''
  const device = /mobile|android|iphone/i.test(ua) ? 'mobile' : 'desktop'
  const isBot = /bot|crawler|spider|preview|facebookexternalhit|whatsapp|telegram|slack|discord|curl|python|headless/i.test(ua)
  if (!isBot) {
    after(async () => {
      try {
        const r = await fetch(`${SB_URL}/rest/v1/outreach_links?select=id&rabatt_code=ilike.${encodeURIComponent(lower)}&limit=1`, { headers: H, cache: 'no-store' })
        const rows = r.ok ? ((await r.json()) as { id: string }[]) : []
        const id = rows[0]?.id
        if (!id) return
        await Promise.all([
          fetch(`${SB_URL}/rest/v1/outreach_link_klicks`, { method: 'POST', headers: { ...H, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ link_id: id, referrer, user_agent: ua.slice(0, 400), device }) }),
          fetch(`${SB_URL}/rest/v1/rpc/increment_link_klick`, { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_link_id: id }) }),
        ])
      } catch {}
    })
  }
  return NextResponse.redirect(finalUrl, { status: 302, headers: { 'Cache-Control': 'no-store, private' } })
}
