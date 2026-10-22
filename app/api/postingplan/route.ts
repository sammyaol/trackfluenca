import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { pickEditable } from '@/lib/postingplan'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data: { user } } = await supabase.auth.getUser(token)
  return user
}

export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabase.from('postingplan_posts').select('*').eq('user_id', user.id).order('geplant_am', { ascending: true, nullsFirst: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const fields = pickEditable(await req.json())
  if (fields.creator_id) {
    const { data: c } = await supabase.from('creators').select('id, name').eq('id', fields.creator_id as string).eq('user_id', user.id).maybeSingle()
    if (!c) return NextResponse.json({ error: 'Creator nicht gefunden' }, { status: 404 })
    fields.creator_name = c.name
  }
  if (!fields.creator_name) return NextResponse.json({ error: 'Bitte einen Creator waehlen' }, { status: 400 })
  const { data, error } = await supabase.from('postingplan_posts').insert({ ...fields, user_id: user.id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
