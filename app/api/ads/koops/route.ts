import { NextRequest, NextResponse } from 'next/server'
import { db, getUser } from '@/lib/ads'

export const maxDuration = 60
const CORS = { 'Access-Control-Allow-Origin': 'https://www.facebook.com', 'Access-Control-Allow-Headers': 'authorization, content-type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' }
export async function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS }) }

// Kooperationen: Creator x Marke x Datum. Quellen: Partnership-Ads aus der Ad Library ('ad'), Branded-Content-Library ('branded'), Instagram-Tags ('ig_tag'), TikTok ('tiktok').
export async function GET(req: NextRequest) {
  const user = await getUser(req); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const p = req.nextUrl.searchParams
  let q = db.from('ads_koops').select('id, brand_id, creator, creator_handle, creator_url, source, ref, url, start_date, end_date, media_url, text, platform').eq('user_id', user.id).order('start_date', { ascending: false, nullsFirst: false }).limit(5000)
  const brands = (p.get('brand') || '').split(',').filter(Boolean)
  if (brands.length) q = q.in('brand_id', brands)
  if (p.get('creator')) q = q.ilike('creator', p.get('creator')!)
  if (p.get('from')) q = q.gte('start_date', p.get('from')!)
  if (p.get('to')) q = q.lte('start_date', p.get('to')!)
  if (p.get('source')) q = q.eq('source', p.get('source')!)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ koops: data })
}

// Import aus dem Browser (Bridge) oder App: Kooperationen anlegen/aktualisieren
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const auth = req.headers.get('authorization')?.replace('Bearer ', '') || ''
  let userId = ''
  if (process.env.ADS_CRON_KEY && auth === process.env.ADS_CRON_KEY) userId = String(b.user_id || '')
  else { const u = await getUser(req); if (u) userId = u.id }
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS })
  if (b.rebuild) { const { data } = await db.rpc('ads_koops_from_ads'); return NextResponse.json({ ok: true, rebuilt: data }, { headers: CORS }) }
  const { data: brand } = await db.from('ads_brands').select('id').eq('id', String(b.brand_id || '')).eq('user_id', userId).maybeSingle()
  if (!brand) return NextResponse.json({ error: 'Marke nicht gefunden' }, { status: 400, headers: CORS })
  const list: any[] = Array.isArray(b.koops) ? b.koops : []
  const clean = (v: unknown, n: number) => v == null ? null : String(v).replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]|\u0000/g, '').slice(0, n)
  const d = (s: unknown) => { const m = String(s || '').match(/^(\d{4}-\d{2}-\d{2})/); return m ? m[1] : null }
  const rows = list.filter(k => k.creator && k.ref).map(k => ({
    user_id: userId, brand_id: brand.id, creator: clean(k.creator, 120)!.trim(), creator_handle: k.handle ? clean(String(k.handle).replace(/^@/, ''), 120) : null,
    creator_url: k.creator_url ? String(k.creator_url).slice(0, 500) : null, source: String(k.source || 'branded').slice(0, 20), ref: String(k.ref).slice(0, 200), url: k.url ? String(k.url).slice(0, 1000) : null,
    start_date: d(k.date), end_date: null, media_url: k.media ? clean(k.media, 2000) : null, text: k.text ? clean(k.text, 500) : null, platform: k.platform ? String(k.platform).slice(0, 20) : 'instagram',
  }))
  if (!rows.length) return NextResponse.json({ ok: true, inserted: 0 }, { headers: CORS })
  const { error, data } = await db.from('ads_koops').upsert(rows, { onConflict: 'user_id,source,ref', ignoreDuplicates: false }).select('id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS })
  await db.from('ads_brands').update({ koop_sync: new Date().toISOString() }).eq('id', brand.id)
  return NextResponse.json({ ok: true, inserted: data?.length || 0 }, { headers: CORS })
}
