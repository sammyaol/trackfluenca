import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const { data: { user } } = token ? await supabase.auth.getUser(token) : { data: { user: null } }
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: insight } = await supabase.from('creator_insights').select('*').eq('id', id).eq('user_id', user.id).maybeSingle()
  if (!insight) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await supabase.storage.from('creator-insights').remove([insight.image_path])
  await supabase.from('creator_insights').delete().eq('id', id).eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}
