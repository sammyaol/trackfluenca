import { NextRequest, NextResponse } from 'next/server'
import { db, getMember, LINK_BASE, SHOP_URL } from '@/lib/mklusive'

export const preferredRegion = ['fra1']

export async function GET(req: NextRequest) {
  const m = await getMember(req)
  if (!m) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!m.role) return NextResponse.json({ me: { role: null, email: m.email }, creators: [], posts: [], orders: [], members: [] })

  const [{ data: creators }, { data: posts }, { data: links }] = await Promise.all([
    db.from('agency_creators').select('*').eq('agency', m.agency).order('created_at', { ascending: false }),
    db.from('agency_posts').select('*').eq('agency', m.agency).order('datum', { ascending: false, nullsFirst: false }),
    db.from('outreach_links').select('id, agency_creator_id, short_code, rabatt_code, utm_campaign, klicks, letzter_klick_am').eq('agency', m.agency),
  ])
  const codes = Array.from(new Set((links || []).map(l => l.rabatt_code).filter(Boolean))) as string[]
  const camps = Array.from(new Set((links || []).map(l => l.utm_campaign).filter(Boolean))) as string[]
  const [stats, orders, camp, linkOrders] = await Promise.all([
    codes.length ? db.from('shopify_discount_code_stats').select('*').in('code', codes) : Promise.resolve({ data: [] as any[] }),
    codes.length ? db.from('shopify_discount_code_orders').select('code, order_id, order_name, order_date, amount, cancelled').in('code', codes).order('order_date', { ascending: false }) : Promise.resolve({ data: [] as any[] }),
    camps.length ? db.from('shopify_campaign_stats').select('*').in('utm_campaign', camps) : Promise.resolve({ data: [] as any[] }),
    camps.length ? db.from('shopify_campaign_orders').select('utm_campaign, order_id, order_name, revenue, order_date').in('utm_campaign', camps).order('order_date', { ascending: false }) : Promise.resolve({ data: [] as any[] }),
  ])
  const linkBy: Record<string, any> = {}
  for (const l of links || []) linkBy[l.agency_creator_id as string] = l
  const statBy: Record<string, any> = {}
  for (const s of stats.data || []) statBy[s.code] = s
  const campBy: Record<string, any> = {}
  for (const c of camp.data || []) campBy[c.utm_campaign] = c

  const out = (creators || []).map(c => {
    const l = linkBy[c.id]
    const st = l?.rabatt_code ? statBy[l.rabatt_code] : null
    const cp = l?.utm_campaign ? campBy[l.utm_campaign] : null
    const mine = (posts || []).filter(p => p.creator_id === c.id)
    const kosten = mine.reduce((s, p) => s + (Number(p.fee) || 0) + (Number(p.produkt) || 0), 0)
    // Verkaeufe getrennt nach Quelle: Rabattcode (Shopify) und Tracking-Link (Last Click, Triple Whale).
    // Gesamt = beide zusammen, Bestellungen die ueber Link UND Code kamen nur einmal.
    const codeOrders = (orders.data || []).filter(o => l?.rabatt_code && o.code === l.rabatt_code && !o.cancelled)
    const lnkOrders = (linkOrders.data || []).filter(o => l?.utm_campaign && o.utm_campaign === l.utm_campaign)
    const code = { bestellungen: Number(st?.orders_count) || codeOrders.length, umsatz: Number(st?.revenue) || codeOrders.reduce((s, o) => s + (Number(o.amount) || 0), 0) }
    const viaLink = { bestellungen: Number(cp?.orders_last_click) || lnkOrders.length, umsatz: Number(cp?.sales_last_click) || lnkOrders.reduce((s, o) => s + (Number(o.revenue) || 0), 0) }
    const codeIds = new Set(codeOrders.map(o => String(o.order_id || '')).filter(Boolean))
    const nurLink = lnkOrders.filter(o => !codeIds.has(String(o.order_id)))
    const beide = lnkOrders.length - nurLink.length
    const gesamt = { bestellungen: code.bestellungen + nurLink.length, umsatz: code.umsatz + nurLink.reduce((s, o) => s + (Number(o.revenue) || 0), 0), beide }
    const umsatz = gesamt.umsatz
    const bestellungen = gesamt.bestellungen
    return {
      ...c,
      link: l ? { short_code: l.short_code, url: LINK_BASE + l.short_code, direct: `${SHOP_URL}/?utm_source=mklusive&utm_medium=influencer&utm_campaign=${encodeURIComponent(l.utm_campaign || '')}${l.rabatt_code ? '&discount=' + encodeURIComponent(l.rabatt_code) : ''}`, letzter_klick_am: l.letzter_klick_am } : null,
      link_campaign: l?.utm_campaign || null,
      klicks: Number(l?.klicks) || 0,
      sessions: Number(cp?.sessions) || 0,
      warenkorb: cp?.sessions_with_cart_additions != null ? Number(cp.sessions_with_cart_additions) : null,
      checkout: cp?.sessions_that_reached_checkout != null ? Number(cp.sessions_that_reached_checkout) : null,
      bestellungen, umsatz, code, via_link: viaLink, gesamt,
      code_synced_at: st?.synced_at || null,
      code_status: st ? (st.status || null) : null,
      posts: mine.length, kosten,
      roas: kosten > 0 ? umsatz / kosten : null,
      cpa: bestellungen > 0 && kosten > 0 ? kosten / bestellungen : null,
    }
  })

  let members: any[] = []
  if (m.role === 'admin') {
    const { data } = await db.from('agency_members').select('user_id, email, role, created_at').eq('agency', m.agency).order('created_at')
    members = data || []
  }
  return NextResponse.json({ me: { role: m.role, email: m.email }, creators: out, posts: posts || [], orders: (orders.data || []).filter(o => !o.cancelled), linkOrders: linkOrders.data || [], members })
}
