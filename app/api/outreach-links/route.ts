import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CHARSET = 'abcdefghijkmnpqrstuvwxyz23456789'
function genCode(len = 7) {
  let s = ''
  for (let i = 0; i < len; i++) s += CHARSET[Math.floor(Math.random() * CHARSET.length)]
  return s
}
function slugify(name: string) {
  return (
    (name || 'creator')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'creator'
  )
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const { data: { user } } = token ? await supabase.auth.getUser(token) : { data: { user: null } }
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const creatorId = searchParams.get('creator_id')
  let q = supabase.from('outreach_links').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
  if (creatorId) q = q.eq('creator_id', creatorId)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const { data: { user } } = token ? await supabase.auth.getUser(token) : { data: { user: null } }
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { creator_id, ziel_url, rabatt_code } = body
  if (!creator_id || !ziel_url) {
    return NextResponse.json({ error: 'creator_id und ziel_url erforderlich' }, { status: 400 })
  }

  const { data: creator } = await supabase
    .from('creators')
    .select('name')
    .eq('id', creator_id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!creator) return NextResponse.json({ error: 'Creator nicht gefunden' }, { status: 404 })

  const slug = slugify(creator.name)
  const datum = new Date().toISOString().slice(0, 10)
  const utm_campaign = `${slug}-${datum}`

  let short_code = genCode()
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await supabase.from('outreach_links').select('id').eq('short_code', short_code).maybeSingle()
    if (!existing) break
    short_code = genCode()
  }

  const { data, error } = await supabase
    .from('outreach_links')
    .insert({
      user_id: user.id,
      creator_id,
      ziel_url,
      utm_source: 'trackfluenca',
      utm_medium: 'influencer',
      utm_campaign,
      rabatt_code: rabatt_code || null,
      short_code,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
