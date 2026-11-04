import { NextRequest, NextResponse } from 'next/server'
import { db, getUser } from '@/lib/ads'

type Ctx = { params: Promise<{ id: string }> }
const cleanIds = (v: unknown) => Array.from(new Set(String(Array.isArray(v) ? v.join(',') : v || '').split(/[\s,]+/).map(s => s.replace(/\D/g, '')).filter(s => s.length >= 5)))

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = await getUser(req); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const b = await req.json().catch(() => ({}))
  const upd: Record<string, unknown> = {}
  if ('name' in b) upd.name = String(b.name || '').trim().slice(0, 80)
  if ('search_term' in b) upd.search_term = String(b.search_term || '').trim().slice(0, 120) || null
  if ('page_ids' in b) upd.page_ids = cleanIds(b.page_ids)
  if ('active' in b) upd.active = !!b.active
  const { data, error } = await db.from('ads_brands').update(upd).eq('id', id).eq('user_id', user.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const user = await getUser(req); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const { error } = await db.from('ads_brands').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
