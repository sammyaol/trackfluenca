import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const t = req.headers.get('authorization')?.replace('Bearer ', '')
  const { data: { user } } = t ? await db.auth.getUser(t) : { data: { user: null } }
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: g } = await db.from('produkt_galerien').select('id').eq('id', id).eq('user_id', user.id).maybeSingle()
  if (!g) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  const { data, error } = await db.from('produkt_wuensche').select('*').eq('galerie_id', id).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const t = req.headers.get('authorization')?.replace('Bearer ', '')
  const { data: { user } } = t ? await db.auth.getUser(t) : { data: { user: null } }
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { wunsch_id } = await req.json().catch(() => ({}))
  const { data: g } = await db.from('produkt_galerien').select('id').eq('id', id).eq('user_id', user.id).maybeSingle()
  if (!g || !wunsch_id) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  await db.from('produkt_wuensche').delete().eq('id', wunsch_id).eq('galerie_id', id)
  return NextResponse.json({ ok: true })
}
