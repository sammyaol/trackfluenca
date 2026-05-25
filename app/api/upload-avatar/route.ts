import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { imageUrl, creatorId } = await req.json()
  if (!imageUrl || !creatorId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  // Prüfen ob der Creator dem User gehört
  const { data: creator } = await supabase.from('creators').select('id').eq('id', creatorId).eq('user_id', user.id).maybeSingle()
  if (!creator) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const res = await fetch(imageUrl)
    if (!res.ok) throw new Error('Failed to fetch image')
    const buffer = await res.arrayBuffer()
    const ext = 'jpg'
    const path = `${creatorId}.${ext}`

    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (error) throw error

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return NextResponse.json({ url: data.publicUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
