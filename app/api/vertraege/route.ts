import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { genToken, pickEditable } from '@/lib/vertrag'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data: { user } } = await supabase.auth.getUser(token)
  return user
}

// Liste aller Vertraege des eingeloggten Users. Das Signaturbild wird hier
// weggelassen (gross), es kommt nur ueber die Detailansicht.
export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const creatorId = searchParams.get('creator_id')
  let q = supabase
    .from('vertraege')
    .select('id, created_at, token, sprache, creator_id, creator_name, creator_handle, plattform, anzahl_videos, posting_bis, verguetung_art, produkte, produktwert, fee, versand_bis, status, angesehen_am, unterschrieben_am, unterschrift_name')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (creatorId) q = q.eq('creator_id', creatorId)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const fields = pickEditable(body)
  if (!fields.creator_name || typeof fields.creator_name !== 'string') {
    return NextResponse.json({ error: 'Name des Creators fehlt' }, { status: 400 })
  }
  if (fields.creator_id) {
    const { data: c } = await supabase.from('creators').select('id').eq('id', fields.creator_id as string).eq('user_id', user.id).maybeSingle()
    if (!c) fields.creator_id = null
  }

  let token = genToken()
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await supabase.from('vertraege').select('id').eq('token', token).maybeSingle()
    if (!existing) break
    token = genToken()
  }

  const { data, error } = await supabase
    .from('vertraege')
    .insert({ ...fields, user_id: user.id, token })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
