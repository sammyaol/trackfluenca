import { NextRequest, NextResponse } from 'next/server'
import { db, getMember, postFields } from '@/lib/mklusive'

export async function POST(req: NextRequest) {
  const m = await getMember(req)
  if (!m?.role) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
  const b = await req.json().catch(() => ({}))
  const { data: c } = await db.from('agency_creators').select('id').eq('id', b.creator_id).eq('agency', m.agency).maybeSingle()
  if (!c) return NextResponse.json({ error: 'Creator nicht gefunden' }, { status: 404 })
  const { data, error } = await db.from('agency_posts').insert({ ...postFields(b), agency: m.agency, creator_id: c.id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
