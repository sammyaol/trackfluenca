import { NextRequest, NextResponse } from 'next/server'
import { db, getUser } from '@/lib/ads'

export const maxDuration = 60
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' }
export async function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS }) }

// Kooperationen: Creator x Marke x Datum. Quellen: Partnership-Ads aus der Ad Library ('ad'), Branded-Content-Library ('branded'), Instagram-Tags ('ig_tag'), TikTok ('tiktok').
export async function GET(req: NextRequest) {
  const user = await getUser(req); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const p = req.nextUrl.searchParams
  // Seitenweise laden (PostgREST liefert max. 1000 Zeilen pro Request), bis zu 30.000 Kooperationen
  if (p.get('summary')) { const { data, error } = await db.rpc('ads_brand_stats', { p_user: user.id }); if (error) return NextResponse.json({ error: error.message }, { status: 500 }); return NextResponse.json({ stats: data || [] }) }
  const brands = (p.get('brand') || '').split(',').filter(Boolean)
  const all: unknown[] = []
  for (let off = 0; off < 80000; off += 1000) {
    let q = db.from('ads_koops').select('id, brand_id, creator, creator_handle, creator_url, source, url, start_date, end_date, media_url, text, platform, likes, views, flags, typ').eq('user_id', user.id).order('start_date', { ascending: false, nullsFirst: false }).order('id').range(off, off + 999)
    if (brands.length) q = q.in('brand_id', brands)
    if (p.get('creator')) q = q.ilike('creator', p.get('creator')!)
    if (p.get('handle')) q = q.ilike('creator_handle', p.get('handle')!)
    if (p.get('from')) q = q.gte('start_date', p.get('from')!)
    if (p.get('to')) q = q.lte('start_date', p.get('to')!)
    if (p.get('source')) q = q.eq('source', p.get('source')!)
    const { data, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    for (const k of data || []) all.push({ ...k, text: k.text ? String(k.text).slice(0, k.source === 'linkster' ? 60 : 220) : null })
    if (!data || data.length < 1000) break
  }
  return NextResponse.json({ koops: all })
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
    likes: Number.isFinite(Number(k.likes)) ? Math.round(Number(k.likes)) : (Number((String(k.text || '').match(/(\d+) Likes/) || [])[1]) || null),
    views: Number.isFinite(Number(k.views)) && k.views != null ? Math.round(Number(k.views)) : (Number((String(k.text || '').match(/(\d+)k Views/) || [])[1]) * 1000 || null),
    flags: Array.isArray(k.flags) ? k.flags.map((f: unknown) => String(f).slice(0, 30)).slice(0, 6) : ((String(k.text || '').match(/\[([^\]]+)\]/) || [])[1] || '').split(', ').filter(Boolean),
    typ: k.typ ? String(k.typ).slice(0, 20) : (k.source === 'tiktok' ? 'video' : k.source === 'ad' ? 'ad' : 'post'),
  }))
  if (!rows.length) return NextResponse.json({ ok: true, inserted: 0 }, { headers: CORS })
  // Doppelte Refs innerhalb einer Lieferung entfernen (sonst scheitert der Upsert)
  const seen = new Map<string, typeof rows[number]>(); for (const r of rows) seen.set(r.source + '|' + r.ref, r); const uniq = [...seen.values()]
  const { error, data } = await db.from('ads_koops').upsert(uniq, { onConflict: 'user_id,source,ref', ignoreDuplicates: false }).select('id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS })
  await db.from('ads_brands').update({ koop_sync: new Date().toISOString() }).eq('id', brand.id)
  return NextResponse.json({ ok: true, inserted: data?.length || 0 }, { headers: CORS })
}
