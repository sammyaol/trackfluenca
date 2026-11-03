import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cleanItems, cleanWhatsapp } from '@/lib/produkte'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
type Ctx = { params: Promise<{ id: string }> }
async function getUser(req: NextRequest) {
  const t = req.headers.get('authorization')?.replace('Bearer ', ''); if (!t) return null
  const { data: { user } } = await db.auth.getUser(t); return user
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const user = await getUser(req); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = await req.json().catch(() => ({}))
  const upd: Record<string, unknown> = {}
  if ('titel' in b) upd.titel = String(b.titel || '').slice(0, 120)
  if ('label' in b) upd.label = b.label ? String(b.label).slice(0, 120) : null
  if ('sprache' in b) upd.sprache = b.sprache === 'en' ? 'en' : 'de'
  if ('beschreibung' in b) upd.beschreibung = b.beschreibung ? String(b.beschreibung).slice(0, 1000) : null
  if ('max_auswahl' in b) upd.max_auswahl = b.max_auswahl ? Math.max(1, Math.min(50, Number(b.max_auswahl) || 0)) || null : null
  if ('whatsapp' in b) upd.whatsapp = cleanWhatsapp(b.whatsapp)
  if ('items' in b) upd.items = cleanItems(b.items)
  if ('status' in b && ['aktiv', 'geschlossen'].includes(b.status)) upd.status = b.status
  const { data, error } = await db.from('produkt_galerien').update(upd).eq('id', id).eq('user_id', user.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const user = await getUser(req); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { error } = await db.from('produkt_galerien').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
