import { NextRequest, NextResponse } from 'next/server'
import { db, getMember } from '@/lib/mklusive'
import { genToken, pickEditable } from '@/lib/vertrag'

export const preferredRegion = ['fra1']

// Vertraege der Agentur (Mklusive) mit Creatorn. Sichtbar fuer alle freigeschalteten Mitglieder der Agentur.
const LIST_COLS = 'id, created_at, token, sprache, bereich, agency_creator_id, creator_name, creator_handle, plattform, anzahl_videos, posting_bis, online_tage, verguetung_art, produkte, produktwert, fee, provision, rabatt_code, exklusiv_wochen, nutzungsrechte_ads, freigabe, agentur_name, agentur_adresse, marke_name, marke_adresse, inhalte, zusatz, zahlung_tage, versand_bis, status, angesehen_am, unterschrieben_am, unterschrift_name, unterschrift_adresse'

export async function GET(req: NextRequest) {
  const m = await getMember(req)
  if (!m || !m.role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await db.from('vertraege').select(LIST_COLS).eq('agency', m.agency).eq('bereich', 'mklusive').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const m = await getMember(req)
  if (!m || !m.role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const fields = pickEditable(body)
  delete fields.creator_id
  if (!fields.creator_name || typeof fields.creator_name !== 'string') return NextResponse.json({ error: 'Name des Creators fehlt' }, { status: 400 })
  if (fields.agency_creator_id) {
    const { data: c } = await db.from('agency_creators').select('id').eq('id', fields.agency_creator_id as string).eq('agency', m.agency).maybeSingle()
    if (!c) fields.agency_creator_id = null
  }
  let token = genToken()
  for (let i = 0; i < 5; i++) { const { data: ex } = await db.from('vertraege').select('id').eq('token', token).maybeSingle(); if (!ex) break; token = genToken() }
  const { data, error } = await db.from('vertraege').insert({ ...fields, user_id: m.user.id, agency: m.agency, bereich: 'mklusive', token, firma_name: fields.marke_name || 'Koluré' }).select(LIST_COLS).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH: Felder aendern (nur solange nicht unterschrieben) oder Status setzen; DELETE: loeschen
export async function PATCH(req: NextRequest) {
  const m = await getMember(req)
  if (!m || !m.role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const id = String(body.id || '')
  if (!id) return NextResponse.json({ error: 'id fehlt' }, { status: 400 })
  const { data: v } = await db.from('vertraege').select('id, status').eq('id', id).eq('agency', m.agency).eq('bereich', 'mklusive').maybeSingle()
  if (!v) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  const upd: Record<string, unknown> = {}
  if (body.status === 'storniert' || body.status === 'offen') upd.status = body.status
  if (v.status !== 'unterschrieben') { const f = pickEditable(body); delete f.creator_id; Object.assign(upd, f) }
  if (!Object.keys(upd).length) return NextResponse.json({ error: 'Nach der Unterschrift können Inhalte nicht mehr geändert werden' }, { status: 400 })
  const { data, error } = await db.from('vertraege').update(upd).eq('id', id).select(LIST_COLS).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const m = await getMember(req)
  if (!m || !m.role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const id = String(body.id || '')
  const { error } = await db.from('vertraege').delete().eq('id', id).eq('agency', m.agency).eq('bereich', 'mklusive')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
