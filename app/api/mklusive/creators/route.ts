import { NextRequest, NextResponse } from 'next/server'
import { db, getMember, genCode, slugify, cleanHandle, cleanCode, SHOP_URL } from '@/lib/mklusive'

export async function POST(req: NextRequest) {
  const m = await getMember(req)
  if (!m?.role) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
  const b = await req.json().catch(() => ({}))
  const name = String(b.name || '').trim().slice(0, 120)
  if (!name) return NextResponse.json({ error: 'Name fehlt' }, { status: 400 })
  const code = cleanCode(b.rabatt_code)

  const { data: c, error } = await db.from('agency_creators').insert({
    agency: m.agency, created_by: m.user.id, name,
    ig_handle: cleanHandle(b.ig_handle), tt_handle: cleanHandle(b.tt_handle),
    geschlecht: b.geschlecht || null, rabatt_code: code, notizen: String(b.notizen || '').slice(0, 2000) || null,
  }).select().single()
  if (error || !c) return NextResponse.json({ error: error?.message || 'Fehler' }, { status: 500 })

  // Tracking-Link anlegen (nutzt die bestehende /r/<code>-Weiterleitung inkl. Klickzaehlung)
  let short = genCode()
  for (let i = 0; i < 5; i++) {
    const { data: ex } = await db.from('outreach_links').select('id').eq('short_code', short).maybeSingle()
    if (!ex) break
    short = genCode()
  }
  const { error: le } = await db.from('outreach_links').insert({
    user_id: null, creator_id: null, agency: m.agency, agency_creator_id: c.id,
    ziel_url: String(b.ziel_url || '').trim() || SHOP_URL,
    utm_source: 'mklusive', utm_medium: 'influencer', utm_campaign: `mk-${slugify(name)}-${short.slice(0, 3)}`,
    rabatt_code: code, short_code: short,
  })
  if (le) return NextResponse.json({ error: le.message }, { status: 500 })
  return NextResponse.json(c)
}
