import { NextRequest, NextResponse } from 'next/server'
import { db, getUser } from '@/lib/ads'

const cleanIds = (v: unknown) => Array.from(new Set(String(Array.isArray(v) ? v.join(',') : v || '').split(/[\s,]+/).map(s => s.replace(/\D/g, '')).filter(s => s.length >= 5)))

export async function GET(req: NextRequest) {
  const user = await getUser(req); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await db.from('ads_brands').select('*').eq('user_id', user.id).order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const { data: s } = await db.from('ads_settings').select('meta_token, countries, updated_at').eq('user_id', user.id).maybeSingle()
  const tok = s?.meta_token || process.env.META_ADS_TOKEN || ''
  return NextResponse.json({ brands: data, settings: { hasToken: !!tok, tokenHint: tok ? tok.slice(0, 6) + '…' + tok.slice(-4) : '', countries: s?.countries || ['DE'], updated_at: s?.updated_at || null } })
}

export async function POST(req: NextRequest) {
  const user = await getUser(req); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = await req.json().catch(() => ({}))
  const name = String(b.name || '').trim().slice(0, 80)
  if (!name) return NextResponse.json({ error: 'Name fehlt' }, { status: 400 })
  const domain = String(b.domain || '').trim().replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '').toLowerCase() || null
  const { data, error } = await db.from('ads_brands').insert({ user_id: user.id, name, search_term: String(b.search_term || name).trim().slice(0, 120), page_ids: cleanIds(b.page_ids), ig_handle: b.ig_handle ? String(b.ig_handle).replace(/^@/, '').trim().slice(0, 80) : null, domain, logo_url: domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
