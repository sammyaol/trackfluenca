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
  const allowed: Record<string, any> = {}
  if ('title' in body) allowed.title = body.title
  if ('category' in body) allowed.category = body.category
  if ('creatorIds' in body) allowed.creator_ids = Array.isArray(body.creatorIds) ? body.creatorIds : []
  if ('videoType' in body) allowed.video_type = body.videoType === 'kooperation' ? 'kooperation' : 'beispiel'
  const { data, error } = await supabase.from('reels').update(allowed).eq('id', id).eq('user_id', user.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, ctx: Context) {
  const { id } = await ctx.params
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const { data: { user } } = token ? await supabase.auth.getUser(token) : { data: { user: null } }
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: reel } = await supabase.from('reels').select('video_path, user_id').eq('id', id).maybeSingle()
  if (!reel || reel.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await supabase.storage.from('reels').remove([reel.video_path])
  const { error } = await supabase.from('reels').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
