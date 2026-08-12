import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return NextResponse.json([], { status: 200 })
  
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return NextResponse.json([], { status: 200 })

  const typeParam = req.nextUrl.searchParams.get('type') || 'creator'
  let query = supabase
    .from('creators')
    .select('*')
    .eq('user_id', user.id)
  if (typeParam !== 'all') query = query.eq('type', typeParam)
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  const { data: { user } } = token ? await supabase.auth.getUser(token) : { data: { user: null } }
  if (user) body.user_id = user.id
  body.type = body.type === 'celeb' ? 'celeb' : 'creator'

  const norm = (s: any) => (s || '').toString().trim().replace('@', '').toLowerCase()

  if (user && body.type === 'celeb') {
    const nameNorm = norm(body.name)
    const igNorm = norm(body.ig)
    if (nameNorm || igNorm) {
      const { data: existing } = await supabase
        .from('creators')
        .select('id, name, ig')
        .eq('user_id', user.id)
        .eq('type', 'celeb')
      const dup = (existing || []).find((c: any) => (nameNorm && norm(c.name) === nameNorm) || (igNorm && norm(c.ig) === igNorm))
      if (dup) return NextResponse.json({ error: 'Diese Person ist bereits bei Celebs in der Liste.' }, { status: 409 })
    }
  } else if (user) {
    const igNorm = norm(body.ig)
    const ttNorm = norm(body.tt)
    if (igNorm || ttNorm) {
      const { data: existing } = await supabase
        .from('creators')
        .select('id, ig, tt')
        .eq('user_id', user.id)
        .eq('type', 'creator')
      const dup = (existing || []).find((c: any) => (igNorm && norm(c.ig) === igNorm) || (ttNorm && norm(c.tt) === ttNorm))
      if (dup) return NextResponse.json({ error: 'Dieser Creator ist bereits in der Liste.' }, { status: 409 })
    }
  }

  const { data, error } = await supabase
    .from('creators')
    .insert([body])
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

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
