import { NextRequest, NextResponse } from 'next/server'
import { db, getMember, postFields } from '@/lib/mklusive'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const m = await getMember(req)
  if (!m?.role) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
  const b = await req.json().catch(() => ({}))
  const { data, error } = await db.from('agency_posts').update(postFields(b)).eq('id', id).eq('agency', m.agency).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const m = await getMember(req)
  if (!m?.role) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
  const { error } = await db.from('agency_posts').delete().eq('id', id).eq('agency', m.agency)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
