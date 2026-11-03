import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Signierte Upload-URL fuer eigene Produktbilder (neue Produkte, die noch nicht im Shop sind)
export async function POST(req: NextRequest) {
  const t = req.headers.get('authorization')?.replace('Bearer ', '')
  const { data: { user } } = t ? await db.auth.getUser(t) : { data: { user: null } }
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { filename } = await req.json().catch(() => ({}))
  const ext = (String(filename || 'jpg').split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`
  const { data, error } = await db.storage.from('produkte').createSignedUploadUrl(path)
  if (error || !data) return NextResponse.json({ error: error?.message || 'Upload-URL fehlgeschlagen' }, { status: 500 })
  const { data: pub } = db.storage.from('produkte').getPublicUrl(path)
  return NextResponse.json({ path, token: data.token, signedUrl: data.signedUrl, publicUrl: pub.publicUrl })
}
