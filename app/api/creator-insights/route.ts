import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const { data: { user } } = token ? await supabase.auth.getUser(token) : { data: { user: null } }
  if (!user) return NextResponse.json([], { status: 200 })

  const creatorId = req.nextUrl.searchParams.get('creator_id')
  if (!creatorId) return NextResponse.json([], { status: 200 })

  const { data } = await supabase
    .from('creator_insights')
    .select('*')
    .eq('user_id', user.id)
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false })

  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const { data: { user } } = token ? await supabase.auth.getUser(token) : { data: { user: null } }
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { path, creatorId } = body
  if (!path || !creatorId) return NextResponse.json({ error: 'path/creatorId fehlt' }, { status: 400 })

  // Prüfen ob der Creator dem User gehört
  const { data: creator } = await supabase.from('creators').select('id').eq('id', creatorId).eq('user_id', user.id).maybeSingle()
  if (!creator) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: urlData } = supabase.storage.from('creator-insights').getPublicUrl(path)

  const { data, error } = await supabase.from('creator_insights').insert([{
    user_id: user.id,
    creator_id: creatorId,
    image_path: path,
    image_url: urlData.publicUrl,
  }]).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
