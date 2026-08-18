import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cacheAvatarUrl } from '@/lib/avatarCache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Context = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, ctx: Context) {
  const { id } = await ctx.params
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const { data: { user } } = token ? await supabase.auth.getUser(token) : { data: { user: null } }
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  try {
    if ('ig_image' in body) body.ig_image = await cacheAvatarUrl(supabase, id, body.ig_image, 'ig')
    if ('tt_image' in body) body.tt_image = await cacheAvatarUrl(supabase, id, body.tt_image, 'tt')
  } catch {}
  const { data, error } = await supabase
    .from('creators')
    .update(body)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, ctx: Context) {
  const { id } = await ctx.params
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const { data: { user } } = token ? await supabase.auth.getUser(token) : { data: { user: null } }
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { error } = await supabase
    .from('creators')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
