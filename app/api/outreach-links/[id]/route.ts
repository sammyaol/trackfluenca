import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Context = { params: Promise<{ id: string }> }

// Deletes a single outreach link. Scoped to the caller's own user_id so one
// user can't delete another's link by guessing an id. outreach_link_klicks
// rows cascade-delete automatically (FK ON DELETE CASCADE) - the raw click
// log for a removed link has no use once the link itself is gone.
export async function DELETE(req: NextRequest, ctx: Context) {
  const { id } = await ctx.params
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const { data: { user } } = token ? await supabase.auth.getUser(token) : { data: { user: null } }
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: existing } = await supabase
    .from('outreach_links')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!existing) return NextResponse.json({ error: 'Link nicht gefunden' }, { status: 404 })

  const { error } = await supabase.from('outreach_links').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
