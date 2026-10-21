import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { pickEditable } from '@/lib/vertrag'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Context = { params: Promise<{ id: string }> }

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data: { user } } = await supabase.auth.getUser(token)
  return user
}

export async function GET(req: NextRequest, ctx: Context) {
  const { id } = await ctx.params
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabase.from('vertraege').select('*').eq('id', id).eq('user_id', user.id).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Vertrag nicht gefunden' }, { status: 404 })
  return NextResponse.json(data)
}

// Bearbeiten nur solange nicht unterschrieben - der Creator hat sonst etwas
// anderes unterschrieben als danach in der DB steht. Stornieren geht immer.
export async function PATCH(req: NextRequest, ctx: Context) {
  const { id } = await ctx.params
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: existing } = await supabase.from('vertraege').select('id, status').eq('id', id).eq('user_id', user.id).maybeSingle()
  if (!existing) return NextResponse.json({ error: 'Vertrag nicht gefunden' }, { status: 404 })

  const body = await req.json()
  let update: Record<string, unknown>
  if (body.status === 'storniert') {
    update = { status: 'storniert' }
  } else if (body.status === 'reaktivieren' && existing.status === 'storniert') {
    update = { status: 'offen' }
  } else {
    if (existing.status === 'unterschrieben') {
      return NextResponse.json({ error: 'Unterschriebene Verträge können nicht mehr geändert werden. Bitte einen neuen Vertrag anlegen.' }, { status: 409 })
    }
    update = pickEditable(body)
  }

  const { data, error } = await supabase.from('vertraege').update(update).eq('id', id).eq('user_id', user.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, ctx: Context) {
  const { id } = await ctx.params
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { error } = await supabase.from('vertraege').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
