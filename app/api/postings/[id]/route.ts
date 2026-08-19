import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
type Context = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, ctx: Context) {
  const { id } = await ctx.params
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const { data: { user } } = token ? await supabase.auth.getUser(token) : { data: { user: null } }
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  if (body.post_link && body.creator_id) {
    const { data: existing } = await supabase.from('postings').select('id').eq('creator_id', body.creator_id).eq('post_link', body.post_link).eq('user_id', user.id).neq('id', id).maybeSingle()
    if (existing) return NextResponse.json({ error: 'Dieser Post-Link wurde bereits hinzugefuegt.' }, { status: 409 })
  }
  const { data, error } = await supabase.from('postings').update(body).eq('id', id).eq('user_id', user.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, ctx: Context) {
  const { id } = await ctx.params
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const { data: { user } } = token ? await supabase.auth.getUser(token) : { data: { user: null } }
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await supabase.from('postings').delete().eq('id', id).eq('user_id', user.id)
  return NextResponse.json({ success: true })
}
