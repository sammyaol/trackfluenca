import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cacheAvatarUrl } from '@/lib/avatarCache'

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
  body.type = ['celeb', 'stylist'].includes(body.type) ? body.type : 'creator'

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
  } else if (user && body.type === 'stylist') {
    const nameNorm = norm(body.name)
    const igNorm = norm(body.ig)
    if (nameNorm || igNorm) {
      const { data: existing } = await supabase
        .from('creators')
        .select('id, name, ig')
        .eq('user_id', user.id)
        .eq('type', 'stylist')
      const dup = (existing || []).find((c: any) => (nameNorm && norm(c.name) === nameNorm) || (igNorm && norm(c.ig) === igNorm))
      if (dup) return NextResponse.json({ error: 'Diese Person ist bereits bei Stylisten in der Liste.' }, { status: 409 })
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

  if (data?.id) {
    try {
      const updates: any = {}
      const newIg = await cacheAvatarUrl(supabase, data.id, body.ig_image, 'ig')
      const newTt = await cacheAvatarUrl(supabase, data.id, body.tt_image, 'tt')
      if (newIg && newIg !== body.ig_image) updates.ig_image = newIg
      if (newTt && newTt !== body.tt_image) updates.tt_image = newTt
      if (Object.keys(updates).length) {
        await supabase.from('creators').update(updates).eq('id', data.id)
        Object.assign(data, updates)
      }
    } catch {}
  }

  return NextResponse.json(data)
}
