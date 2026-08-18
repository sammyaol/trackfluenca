import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const { data: { user } } = token ? await supabase.auth.getUser(token) : { data: { user: null } }
  if (!user) return NextResponse.json([], { status: 200 })
  const { data } = await supabase.from('reels').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const { data: { user } } = token ? await supabase.auth.getUser(token) : { data: { user: null } }
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { path, title, category, creatorIds, videoType, sourceLink } = body
  if (!path) return NextResponse.json({ error: 'path fehlt' }, { status: 400 })

  const { data: urlData } = supabase.storage.from('reels').getPublicUrl(path)

  const { data, error } = await supabase.from('reels').insert([{
    user_id: user.id,
    title: title || null,
    category: category || null,
    video_type: videoType === 'kooperation' ? 'kooperation' : 'beispiel',
    video_path: path,
    video_url: urlData.publicUrl,
    creator_ids: Array.isArray(creatorIds) ? creatorIds : [],
    source_link: sourceLink || null,
  }]).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
