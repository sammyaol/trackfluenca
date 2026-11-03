import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cleanItems, genToken } from '@/lib/produkte'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
async function getUser(req: NextRequest) {
  const t = req.headers.get('authorization')?.replace('Bearer ', ''); if (!t) return null
  const { data: { user } } = await db.auth.getUser(t); return user
}

export async function GET(req: NextRequest) {
  const user = await getUser(req); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await db.from('produkt_galerien').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const ids = (data || []).map(g => g.id)
  const counts: Record<string, number> = {}
  if (ids.length) {
    const { data: w } = await db.from('produkt_wuensche').select('galerie_id').in('galerie_id', ids)
    for (const x of w || []) counts[x.galerie_id] = (counts[x.galerie_id] || 0) + 1
  }
  return NextResponse.json((data || []).map(g => ({ ...g, wuensche: counts[g.id] || 0 })))
}

export async function POST(req: NextRequest) {
  const user = await getUser(req); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = await req.json().catch(() => ({}))
  const row = {
    user_id: user.id, token: genToken(),
    titel: String(b.titel || 'Neue Kollektion').slice(0, 120),
    beschreibung: b.beschreibung ? String(b.beschreibung).slice(0, 1000) : null,
    max_auswahl: b.max_auswahl ? Math.max(1, Math.min(50, Number(b.max_auswahl) || 0)) || null : null,
    items: cleanItems(b.items),
  }
  const { data, error } = await db.from('produkt_galerien').insert(row).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
