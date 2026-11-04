import { NextRequest, NextResponse } from 'next/server'
import { db, getUser } from '@/lib/ads'

export const maxDuration = 60

// Import aus dem Browser: Ads, die direkt von der oeffentlichen Meta Ad Library (facebook.com/ads/library) ausgelesen wurden.
// Kein API-Token noetig. Medien werden als Quell-URL gespeichert und vom Medien-Cron in unseren Storage kopiert.
const CORS = { 'Access-Control-Allow-Origin': 'https://www.facebook.com', 'Access-Control-Allow-Headers': 'authorization, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
export async function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS }) }

const d = (s: unknown) => { const m = String(s || '').match(/^(\d{4}-\d{2}-\d{2})/); return m ? m[1] : null }
const str = (s: unknown, n = 2000) => s ? String(s).slice(0, n) : null

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const auth = req.headers.get('authorization')?.replace('Bearer ', '') || ''
  let userId = ''
  if (process.env.ADS_CRON_KEY && auth === process.env.ADS_CRON_KEY) userId = String(b.user_id || '')
  else { const u = await getUser(req); if (u) userId = u.id }
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS })
  const { data: brand } = await db.from('ads_brands').select('id, name').eq('id', String(b.brand_id || '')).eq('user_id', userId).maybeSingle()
  if (!brand) return NextResponse.json({ error: 'Marke nicht gefunden' }, { status: 400, headers: CORS })
  const list: any[] = Array.isArray(b.ads) ? b.ads : []
  const now = new Date().toISOString()
  const rows = list.filter(a => /^\d{6,}$/.test(String(a.ad_id || ''))).map(a => ({
    user_id: userId, brand_id: brand.id, ad_id: String(a.ad_id), page_id: str(a.page_id, 40), page_name: str(a.page_name, 200),
    snapshot_url: `https://www.facebook.com/ads/library/?id=${a.ad_id}`,
    body: str(a.body, 5000), title: str(a.title, 500), caption: str(a.caption, 500), description: str(a.description, 1000), link_url: str(a.link_url, 1000), cta: str(a.cta, 100),
    platforms: Array.isArray(a.platforms) ? a.platforms.map(String).slice(0, 6) : [], languages: [],
    start_date: d(a.start_date), end_date: d(a.end_date),
    media_type: a.video ? 'video' : a.image ? 'image' : 'none',
    media_url: str(a.video || a.image, 2000), media_poster: str(a.poster, 2000),
    media_status: (a.video || a.image) ? 'import' : 'none',
    raw: { quelle: 'browser', versionen: a.versions || null, status: a.status || null },
    last_seen: now,
  }))
  if (!rows.length) return NextResponse.json({ ok: true, inserted: 0, updated: 0 }, { headers: CORS })
  const { data: existing } = await db.from('ads_library').select('ad_id, media_status').eq('user_id', userId).in('ad_id', rows.map(r => r.ad_id))
  const ex = new Map((existing || []).map(e => [e.ad_id, e.media_status]))
  const neu = rows.filter(r => !ex.has(r.ad_id))
  let updated = 0
  if (neu.length) { const { error } = await db.from('ads_library').insert(neu); if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS }) }
  for (const r of rows.filter(r => ex.has(r.ad_id))) {
    const upd: Record<string, unknown> = { end_date: r.end_date, start_date: r.start_date, last_seen: now, body: r.body || undefined, platforms: r.platforms.length ? r.platforms : undefined }
    const ms = ex.get(r.ad_id)
    if ((ms === 'none' || ms === 'error') && r.media_url) { upd.media_url = r.media_url; upd.media_poster = r.media_poster; upd.media_type = r.media_type; upd.media_status = 'import' }
    Object.keys(upd).forEach(k => upd[k] === undefined && delete upd[k])
    await db.from('ads_library').update(upd).eq('user_id', userId).eq('ad_id', r.ad_id); updated++
  }
  const { count } = await db.from('ads_library').select('id', { count: 'exact', head: true }).eq('brand_id', brand.id)
  await db.from('ads_brands').update({ last_sync: now, last_error: null, ad_count: count || 0 }).eq('id', brand.id)
  return NextResponse.json({ ok: true, inserted: neu.length, updated, total: count }, { headers: CORS })
}
