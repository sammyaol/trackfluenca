import { NextRequest, NextResponse } from 'next/server'
import { db, getUser, GRAPH } from '@/lib/ads'

// Meta-Token speichern + direkt testen (1 Anfrage an ads_archive)
export async function POST(req: NextRequest) {
  const user = await getUser(req); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = await req.json().catch(() => ({}))
  const token = String(b.meta_token || '').trim()
  const countries = Array.from(new Set(String(b.countries || 'DE').toUpperCase().split(/[\s,]+/).filter(c => /^[A-Z]{2}$/.test(c)))) 
  if (token) {
    const r = await fetch(`${GRAPH}/ads_archive?ad_type=ALL&ad_reached_countries=${encodeURIComponent(JSON.stringify(countries.length ? countries : ['DE']))}&search_terms=test&limit=1&fields=id&access_token=${encodeURIComponent(token)}`, { cache: 'no-store' })
    const j = await r.json().catch(() => ({}))
    if (!r.ok || j.error) return NextResponse.json({ error: 'Token abgelehnt: ' + (j.error?.message || r.status) }, { status: 400 })
  }
  const row: Record<string, unknown> = { user_id: user.id, countries: countries.length ? countries : ['DE'], updated_at: new Date().toISOString() }
  if (token) row.meta_token = token
  if (b.clear) row.meta_token = null
  const { error } = await db.from('ads_settings').upsert(row)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
