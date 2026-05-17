import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data, error } = await supabase
    .from('creators')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Upload avatar to Supabase Storage
  const imageUrl = body.ig_image || body.tt_image
  if (imageUrl && data?.id) {
    try {
      const imgRes = await fetch(imageUrl)
      if (imgRes.ok) {
        const buffer = await imgRes.arrayBuffer()
        await supabase.storage.from('avatars').upload(`${data.id}.jpg`, buffer, {
          contentType: 'image/jpeg', upsert: true
        })
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(`${data.id}.jpg`)
        await supabase.from('creators').update({ ig_image: urlData.publicUrl }).eq('id', data.id)
        data.ig_image = urlData.publicUrl
      }
    } catch {}
  }

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, error } = await supabase
    .from('creators')
    .insert([body])
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Upload avatar to Supabase Storage
  const imageUrl = body.ig_image || body.tt_image
  if (imageUrl && data?.id) {
    try {
      const imgRes = await fetch(imageUrl)
      if (imgRes.ok) {
        const buffer = await imgRes.arrayBuffer()
        await supabase.storage.from('avatars').upload(`${data.id}.jpg`, buffer, {
          contentType: 'image/jpeg', upsert: true
        })
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(`${data.id}.jpg`)
        await supabase.from('creators').update({ ig_image: urlData.publicUrl }).eq('id', data.id)
        data.ig_image = urlData.publicUrl
      }
    } catch {}
  }

  return NextResponse.json(data)
}
