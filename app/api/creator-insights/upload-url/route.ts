import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { filename, creatorId } = await req.json()
  if (!filename || !creatorId) return NextResponse.json({ error: 'filename/creatorId fehlt' }, { status: 400 })

  // Prüfen ob der Creator dem User gehört
  const { data: creator } = await supabase.from('creators').select('id').eq('id', creatorId).eq('user_id', user.id).maybeSingle()
  if (!creator) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const ext = (filename.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${user.id}/${creatorId}/${crypto.randomUUID()}.${ext}`

  const { data, error } = await supabase.storage.from('creator-insights').createSignedUploadUrl(path)
  if (error || !data) return NextResponse.json({ error: error?.message || 'Fehler beim Erstellen der Upload-URL' }, { status: 500 })

  return NextResponse.json({ path, token: data.token, signedUrl: data.signedUrl })
}
