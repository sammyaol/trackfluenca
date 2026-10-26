import { NextRequest, NextResponse } from 'next/server'
import { db, getMember, cleanHandle, cleanCode } from '@/lib/mklusive'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const m = await getMember(req)
  if (!m?.role) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
  const b = await req.json().catch(() => ({}))
  const upd: Record<string, unknown> = {}
  if ('name' in b) { const n = String(b.name || '').trim().slice(0, 120); if (!n) return NextResponse.json({ error: 'Name fehlt' }, { status: 400 }); upd.name = n }
  if ('ig_handle' in b) upd.ig_handle = cleanHandle(b.ig_handle)
  if ('tt_handle' in b) upd.tt_handle = cleanHandle(b.tt_handle)
  if ('geschlecht' in b) upd.geschlecht = b.geschlecht || null
  if ('notizen' in b) upd.notizen = String(b.notizen || '').slice(0, 2000) || null
  if ('rabatt_code' in b) upd.rabatt_code = cleanCode(b.rabatt_code)
  const { data, error } = await db.from('agency_creators').update(upd).eq('id', id).eq('agency', m.agency).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // Rabattcode am Tracking-Link mitziehen, damit der Shopify-Sync ihn aufnimmt
  const linkUpd: Record<string, unknown> = {}
  if ('rabatt_code' in upd) linkUpd.rabatt_code = upd.rabatt_code
  if ('ziel_url' in b && String(b.ziel_url || '').trim()) linkUpd.ziel_url = String(b.ziel_url).trim()
  if (Object.keys(linkUpd).length) await db.from('outreach_links').update(linkUpd).eq('agency_creator_id', id).eq('agency', m.agency)
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const m = await getMember(req)
  if (!m?.role) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
  const { error } = await db.from('agency_creators').delete().eq('id', id).eq('agency', m.agency)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
