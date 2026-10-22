import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { pickEditable } from '@/lib/postingplan'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
type Context = { params: Promise<{ id: string }> }

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data: { user } } = await supabase.auth.getUser(token)
  return user
}

export async function PATCH(req: NextRequest, ctx: Context) {
  const { id } = await ctx.params
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const fields = pickEditable(await req.json())
  if (fields.creator_id) {
    const { data: c } = await supabase.from('creators').select('id, name').eq('id', fields.creator_id as string).eq('user_id', user.id).maybeSingle()
    if (!c) return NextResponse.json({ error: 'Creator nicht gefunden' }, { status: 404 })
    fields.creator_name = c.name
  }
  const { data, error } = await supabase.from('postingplan_posts').update(fields).eq('id', id).eq('user_id', user.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, ctx: Context) {
  const { id } = await ctx.params
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { error } = await supabase.from('postingplan_posts').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
