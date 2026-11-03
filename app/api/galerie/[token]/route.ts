import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const preferredRegion = ['fra1']
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
type Ctx = { params: Promise<{ token: string }> }
const validToken = (t: string) => /^[A-Za-z0-9]{12,40}$/.test(t)

// Oeffentlich: Galerie fuer Creator (kein Login)
export async function GET(_req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params
  if (!validToken(token)) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  const { data } = await db.from('produkt_galerien').select('titel, label, sprache, beschreibung, max_auswahl, items, status').eq('token', token).maybeSingle()
  if (!data) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  data.items = (data.items as any[]).filter(i => !i.hidden)
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
}

// Oeffentlich: Wunschliste absenden
export async function POST(req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params
  if (!validToken(token)) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  const { data: g } = await db.from('produkt_galerien').select('id, status, items, max_auswahl').eq('token', token).maybeSingle()
  if (!g) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  if (g.status !== 'aktiv') return NextResponse.json({ error: 'Diese Auswahl ist bereits geschlossen.' }, { status: 410 })
  const b = await req.json().catch(() => ({}))
  const name = String(b.creator_name || '').trim().slice(0, 120)
  if (name.length < 2) return NextResponse.json({ error: 'Bitte deinen Namen eingeben.' }, { status: 400 })
  const valid = new Set((g.items as any[]).map(i => String(i.id)))
  const auswahl = Array.from(new Set((Array.isArray(b.auswahl) ? b.auswahl : []).map((x: unknown) => String(x)).filter((x: string) => valid.has(x))))
  if (!auswahl.length) return NextResponse.json({ error: 'Bitte mindestens ein Produkt auswählen.' }, { status: 400 })
  if (g.max_auswahl && auswahl.length > g.max_auswahl) return NextResponse.json({ error: `Maximal ${g.max_auswahl} Produkte.` }, { status: 400 })
  const { error } = await db.from('produkt_wuensche').insert({
    galerie_id: g.id, creator_name: name,
    kontakt: b.kontakt ? String(b.kontakt).trim().slice(0, 200) : null,
    nachricht: b.nachricht ? String(b.nachricht).trim().slice(0, 1000) : null,
    auswahl,
  })
  if (error) return NextResponse.json({ error: 'Speichern fehlgeschlagen, bitte nochmal versuchen.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
