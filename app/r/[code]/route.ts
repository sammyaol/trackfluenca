import { NextRequest, NextResponse, after } from 'next/server'

// Tracking-Weiterleitung. Laeuft als Edge-Funktion: kein Kaltstart, wird am
// naechsten Standort zum Besucher ausgefuehrt. Die Weiterleitung wird sofort
// gesendet; Klick-Zaehlung passiert danach im Hintergrund (after()).
export const runtime = 'edge'
export const preferredRegion = ['fra1', 'dub1', 'cdg1']
export const dynamic = 'force-dynamic'

const FALLBACK_URL = 'https://kolure.de'
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const H = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }

type Link = { id: string; ziel_url: string; utm_source: string | null; utm_medium: string | null; utm_campaign: string | null; rabatt_code: string | null }

// Kurzer In-Memory-Cache pro Edge-Instanz: wiederholte Klicks auf denselben
// Link (z. B. aus einer Story) brauchen dann gar keine DB-Abfrage mehr.
const cache = new Map<string, { at: number; link: Link | null }>()
const TTL = 60_000

async function lookup(code: string): Promise<Link | null> {
  const hit = cache.get(code)
  if (hit && Date.now() - hit.at < TTL) return hit.link
  let link: Link | null = null
  let ok = false
  for (let i = 0; i < 2 && !ok; i++) {
    try {
      const r = await fetch(`${SB_URL}/rest/v1/outreach_links?select=id,ziel_url,utm_source,utm_medium,utm_campaign,rabatt_code&short_code=eq.${encodeURIComponent(code)}&limit=1`, { headers: H, cache: 'no-store', signal: AbortSignal.timeout(2500) })
      if (r.ok) { const rows = (await r.json()) as Link[]; link = rows[0] || null; ok = true }
    } catch {}
  }
  // Nur erfolgreiche Antworten cachen; bei DB-Problemen beim naechsten Klick erneut versuchen
  if (ok) cache.set(code, { at: Date.now(), link })
  return link
}

type Context = { params: Promise<{ code: string }> }

export async function GET(req: NextRequest, ctx: Context) {
  const { code } = await ctx.params
  if (!/^[a-z0-9]{4,20}$/i.test(code)) return NextResponse.redirect(FALLBACK_URL, 302)

  const link = await lookup(code)
  if (!link) return NextResponse.redirect(FALLBACK_URL, 302)

  let target: URL
  try { target = new URL(link.ziel_url) } catch { return NextResponse.redirect(FALLBACK_URL, 302) }
  if (link.utm_source) target.searchParams.set('utm_source', link.utm_source)
  if (link.utm_medium) target.searchParams.set('utm_medium', link.utm_medium)
  if (link.utm_campaign) target.searchParams.set('utm_campaign', link.utm_campaign)

  let finalUrl = target.toString()
  if (link.rabatt_code) {
    // Shopify-Discount-Link: wendet den Code an und leitet zur Zielseite weiter
    finalUrl = `${target.origin}/discount/${encodeURIComponent(link.rabatt_code)}?redirect=${encodeURIComponent(target.pathname + target.search)}`
  }

  const ua = req.headers.get('user-agent') || ''
  const referrer = req.headers.get('referer') || ''
  const device = /mobile|android|iphone/i.test(ua) ? 'mobile' : 'desktop'
  const isBot = /bot|crawler|spider|preview|facebookexternalhit|whatsapp|telegram|slack|discord|curl|python|headless/i.test(ua)
  if (!isBot) {
    after(async () => {
      try {
        await Promise.all([
          fetch(`${SB_URL}/rest/v1/outreach_link_klicks`, { method: 'POST', headers: { ...H, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ link_id: link.id, referrer, user_agent: ua.slice(0, 400), device }) }),
          fetch(`${SB_URL}/rest/v1/rpc/increment_link_klick`, { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_link_id: link.id }) }),
        ])
      } catch {}
    })
  }

  return NextResponse.redirect(finalUrl, { status: 302, headers: { 'Cache-Control': 'no-store, private', 'Referrer-Policy': 'no-referrer-when-downgrade' } })
}
