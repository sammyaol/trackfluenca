import { NextRequest, NextResponse } from 'next/server'
import { db, getUser } from '@/lib/ads'

// Ad Library abfragen: Filter nach Marke, Zeitraum, Status, Plattform, Medientyp, Text. Seitenweise (60 pro Seite).
export async function GET(req: NextRequest) {
  const user = await getUser(req); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const p = req.nextUrl.searchParams
  const page = Math.max(0, Number(p.get('page') || 0)), size = 60
  let q = db.from('ads_library').select('id, brand_id, ad_id, page_name, snapshot_url, body, title, caption, link_url, cta, platforms, languages, start_date, end_date, media_type, media_url, media_poster, media_status, eu_reach, first_seen, anlass', { count: 'exact' }).eq('user_id', user.id)
  const brands = (p.get('brand') || '').split(',').filter(Boolean)
  if (brands.length) q = q.in('brand_id', brands)
  if (p.get('from')) q = q.gte('start_date', p.get('from')!)
  if (p.get('to')) q = q.lte('start_date', p.get('to')!)
  if (p.get('status') === 'active') q = q.is('end_date', null)
  if (p.get('status') === 'ended') q = q.not('end_date', 'is', null)
  if (p.get('platform')) q = q.contains('platforms', [p.get('platform')!])
  if (p.get('type')) q = q.eq('media_type', p.get('type')!)
  if (p.get('anlass')) q = q.contains('anlass', [p.get('anlass')!])
  if (p.get('q')) { const s = p.get('q')!.replace(/[%,]/g, ' ').trim(); if (s) q = q.or(`body.ilike.%${s}%,title.ilike.%${s}%,page_name.ilike.%${s}%`) }
  const sort = p.get('sort') === 'reach' ? 'eu_reach' : p.get('sort') === 'oldest' ? 'start_date' : 'start_date'
  q = q.order(sort, { ascending: p.get('sort') === 'oldest', nullsFirst: false }).order('ad_id', { ascending: false }).range(page * size, page * size + size - 1)
  const { data, error, count } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ads: data, total: count || 0, page, size })
}
