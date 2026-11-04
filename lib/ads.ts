// Meta Ad Library: Datenmodell + Sync-Logik (Server).
// Quelle: Graph API /ads_archive (alle EU-Ads, ad_type=ALL). Braucht ein User-Token eines Meta-Accounts mit bestaetigter Identitaet.
import { createClient } from '@supabase/supabase-js'

export const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
export const GRAPH = 'https://graph.facebook.com/v21.0'
export const AD_FIELDS = [
  'id', 'page_id', 'page_name', 'ad_creation_time', 'ad_delivery_start_time', 'ad_delivery_stop_time', 'ad_snapshot_url',
  'ad_creative_bodies', 'ad_creative_link_titles', 'ad_creative_link_captions', 'ad_creative_link_descriptions',
  'publisher_platforms', 'languages', 'eu_total_reach', 'target_ages', 'target_gender', 'target_locations',
].join(',')

export type Brand = { id: string; name: string; search_term?: string | null; page_ids: string[]; active: boolean; last_sync?: string | null; last_error?: string | null; ad_count: number }
export type Ad = {
  id: string; brand_id: string; ad_id: string; page_id?: string | null; page_name?: string | null; snapshot_url?: string | null
  body?: string | null; title?: string | null; caption?: string | null; description?: string | null; link_url?: string | null; cta?: string | null
  platforms: string[]; languages: string[]; start_date?: string | null; end_date?: string | null
  media_type?: string | null; media_url?: string | null; media_poster?: string | null; media_status: string; eu_reach?: number | null
  first_seen: string; last_seen: string
}

export async function getUser(req: Request) {
  const t = req.headers.get('authorization')?.replace('Bearer ', ''); if (!t) return null
  const { data: { user } } = await db.auth.getUser(t); return user
}

export async function getToken(userId: string) {
  const { data } = await db.from('ads_settings').select('meta_token, countries').eq('user_id', userId).maybeSingle()
  return { token: data?.meta_token || process.env.META_ADS_TOKEN || '', countries: data?.countries?.length ? data.countries : ['DE'] }
}

type RawAd = Record<string, any>
const firstOf = (a?: string[] | null) => (Array.isArray(a) && a.length ? String(a[0]) : null)

// Eine Marke aus der Ad Library ziehen (per Page-IDs wenn gesetzt, sonst per Suchbegriff). Max. `maxPages` Seiten a 100 Ads pro Lauf.
export async function syncBrand(userId: string, brand: Brand, token: string, countries: string[], maxPages = 6) {
  let url = `${GRAPH}/ads_archive?ad_type=ALL&ad_active_status=ALL&limit=100&fields=${AD_FIELDS}&ad_reached_countries=${encodeURIComponent(JSON.stringify(countries))}&access_token=${encodeURIComponent(token)}`
  if (brand.page_ids?.length) url += `&search_page_ids=${encodeURIComponent(JSON.stringify(brand.page_ids))}`
  else url += `&search_terms=${encodeURIComponent(brand.search_term || brand.name)}&search_type=KEYWORD_EXACT_PHRASE`
  let seen = 0, inserted = 0, pages = 0
  const now = new Date().toISOString()
  while (url && pages < maxPages) {
    const r = await fetch(url, { cache: 'no-store' })
    const j = await r.json().catch(() => ({}))
    if (!r.ok || j.error) throw new Error(j.error?.message || `Meta ${r.status}`)
    const rows = (j.data as RawAd[] || []).map(a => ({
      user_id: userId, brand_id: brand.id, ad_id: String(a.id), page_id: a.page_id ? String(a.page_id) : null, page_name: a.page_name || null,
      snapshot_url: a.ad_snapshot_url || null,
      body: firstOf(a.ad_creative_bodies), title: firstOf(a.ad_creative_link_titles), caption: firstOf(a.ad_creative_link_captions), description: firstOf(a.ad_creative_link_descriptions),
      platforms: Array.isArray(a.publisher_platforms) ? a.publisher_platforms : [], languages: Array.isArray(a.languages) ? a.languages : [],
      start_date: (a.ad_delivery_start_time || a.ad_creation_time || '').slice(0, 10) || null,
      end_date: a.ad_delivery_stop_time ? String(a.ad_delivery_stop_time).slice(0, 10) : null,
      eu_reach: typeof a.eu_total_reach === 'number' ? a.eu_total_reach : null,
      raw: { target_ages: a.target_ages, target_gender: a.target_gender, target_locations: a.target_locations, ad_creation_time: a.ad_creation_time },
      last_seen: now,
    }))
    if (rows.length) {
      // Upsert: bestehende Ads behalten ihre Medien/first_seen, nur Laufzeit/Texte/last_seen werden aktualisiert
      const { data: existing } = await db.from('ads_library').select('ad_id').eq('user_id', userId).in('ad_id', rows.map(r => r.ad_id))
      const ex = new Set((existing || []).map(e => e.ad_id))
      const neu = rows.filter(r => !ex.has(r.ad_id))
      const alt = rows.filter(r => ex.has(r.ad_id))
      if (neu.length) { const { error } = await db.from('ads_library').insert(neu); if (error) throw new Error(error.message); inserted += neu.length }
      for (const a of alt) {
        await db.from('ads_library').update({ end_date: a.end_date, start_date: a.start_date, eu_reach: a.eu_reach, last_seen: now, body: a.body, title: a.title, snapshot_url: a.snapshot_url }).eq('user_id', userId).eq('ad_id', a.ad_id)
      }
      seen += rows.length
    }
    url = j.paging?.next || ''
    pages++
  }
  const { count } = await db.from('ads_library').select('id', { count: 'exact', head: true }).eq('brand_id', brand.id)
  await db.from('ads_brands').update({ last_sync: now, last_error: null, ad_count: count || 0 }).eq('id', brand.id)
  return { seen, inserted, more: !!url }
}

// Medien aus der Snapshot-Seite ziehen (Bild / Video-Vorschau) und in den Storage-Bucket `ads` kopieren, damit sie dauerhaft bleiben.
const pick = (html: string, key: string) => { const m = html.match(new RegExp('"' + key + '":"((?:\\\\.|[^"\\\\])*)"')); return m ? JSON.parse('"' + m[1] + '"') : null }
export async function fetchMedia(snapshotUrl: string, token: string) {
  const u = snapshotUrl.includes('access_token=') ? snapshotUrl : snapshotUrl + (snapshotUrl.includes('?') ? '&' : '?') + 'access_token=' + encodeURIComponent(token)
  const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', 'Accept-Language': 'de-DE,de;q=0.9' }, cache: 'no-store' })
  const html = await r.text()
  const video = pick(html, 'video_hd_url') || pick(html, 'video_sd_url')
  const poster = pick(html, 'video_preview_image_url')
  const image = pick(html, 'original_image_url') || pick(html, 'resized_image_url') || pick(html, 'image_url')
  const link = pick(html, 'link_url')
  const cta = pick(html, 'cta_text')
  if (video) return { type: 'video', url: video, poster, link, cta }
  if (image) return { type: 'image', url: image, poster: null, link, cta }
  return { type: 'none', url: null, poster: null, link, cta }
}

export async function storeMedia(adId: string, src: string, kind: 'img' | 'poster' | 'video', maxBytes = 25_000_000) {
  const r = await fetch(src, { cache: 'no-store' })
  if (!r.ok) throw new Error('media ' + r.status)
  const ct = r.headers.get('content-type') || (kind === 'video' ? 'video/mp4' : 'image/jpeg')
  const buf = Buffer.from(await r.arrayBuffer())
  if (buf.length > maxBytes) throw new Error('zu gross')
  const ext = ct.includes('png') ? 'png' : ct.includes('webp') ? 'webp' : ct.includes('mp4') ? 'mp4' : 'jpg'
  const path = `${adId}/${kind}.${ext}`
  const { error } = await db.storage.from('ads').upload(path, buf, { contentType: ct, upsert: true })
  if (error) throw new Error(error.message)
  return db.storage.from('ads').getPublicUrl(path).data.publicUrl
}

// Naechste Ads ohne Medien verarbeiten (wird vom Cron alle paar Minuten aufgerufen)
export async function processMedia(userId: string, token: string, n = 12) {
  const { data: ads } = await db.from('ads_library').select('id, ad_id, snapshot_url, media_status').eq('user_id', userId).eq('media_status', 'pending').not('snapshot_url', 'is', null).order('first_seen', { ascending: false }).limit(n)
  let ok = 0, fail = 0
  for (const a of ads || []) {
    try {
      const m = await fetchMedia(a.snapshot_url!, token)
      const upd: Record<string, unknown> = { media_type: m.type, link_url: m.link || undefined, cta: m.cta || undefined }
      if (m.type === 'image' && m.url) upd.media_url = await storeMedia(a.ad_id, m.url, 'img')
      else if (m.type === 'video' && m.url) {
        if (m.poster) upd.media_poster = await storeMedia(a.ad_id, m.poster, 'poster').catch(() => m.poster)
        upd.media_url = await storeMedia(a.ad_id, m.url, 'video', 40_000_000).catch(() => m.url)
      }
      upd.media_status = m.type === 'none' ? 'none' : 'done'
      Object.keys(upd).forEach(k => upd[k] === undefined && delete upd[k])
      await db.from('ads_library').update(upd).eq('id', a.id); ok++
    } catch (e) {
      await db.from('ads_library').update({ media_status: 'error' }).eq('id', a.id); fail++
    }
  }
  return { ok, fail, remaining: (ads || []).length === n }
}
