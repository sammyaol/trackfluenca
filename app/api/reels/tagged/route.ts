import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const preferredRegion = ['fra1']
export const maxDuration = 60

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const KEY = process.env.RAPIDAPI_KEY!
const TT_HOST = 'tiktok-api23.p.rapidapi.com'
const IG_HOST = 'flashapi1.p.rapidapi.com'
const BRAND_IG = 'kolure.de'
const BRAND_TT = 'kolure.de'
const TAGS = ['kolure', 'kolurede']

type Cand = { link: string; platform: 'instagram' | 'tiktok'; handle?: string; via: string }

async function call(host: string, path: string) {
  try {
    const r = await fetch(`https://${host}${path}`, { headers: { 'x-rapidapi-key': KEY, 'x-rapidapi-host': host }, cache: 'no-store' })
    if (!r.ok) return { status: r.status, json: null as any }
    return { status: r.status, json: await r.json().catch(() => null) as any }
  } catch { return { status: 0, json: null as any } }
}

// Sammelt alle Objekte mit "code" (Instagram-Shortcode) aus beliebig verschachtelten Antworten.
function igItems(node: any, out: any[] = [], depth = 0): any[] {
  if (!node || depth > 8) return out
  if (Array.isArray(node)) { node.forEach(n => igItems(n, out, depth + 1)); return out }
  if (typeof node === 'object') {
    if (typeof node.code === 'string' && node.code.length >= 6 && node.code.length <= 14 && ('taken_at' in node || 'media_type' in node || 'user' in node || 'pk' in node)) out.push(node)
    else Object.values(node).forEach(v => igItems(v, out, depth + 1))
  }
  return out
}
// TikTok-Items mit id + author
function ttItems(node: any, out: any[] = [], depth = 0): any[] {
  if (!node || depth > 8) return out
  if (Array.isArray(node)) { node.forEach(n => ttItems(n, out, depth + 1)); return out }
  if (typeof node === 'object') {
    const it = node.itemInfo?.itemStruct || node.item || node
    if (it && typeof it === 'object' && it.id && it.author && (it.author.uniqueId || typeof it.author === 'string') && (it.video || it.desc !== undefined)) out.push(it)
    else Object.values(node).forEach(v => ttItems(v, out, depth + 1))
  }
  return out
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const { data: { user } } = token ? await supabase.auth.getUser(token) : { data: { user: null } }
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cands = new Map<string, Cand>()
  const diag: string[] = []
  const add = (c: Cand) => { if (!cands.has(c.link)) cands.set(c.link, c) }

  // ---------- TikTok ----------
  for (const tag of TAGS) {
    const info = await call(TT_HOST, `/api/challenge/info?challengeName=${encodeURIComponent(tag)}`)
    const cid = info.json?.challengeInfo?.challenge?.id
    diag.push(`TT #${tag}: info ${info.status}${cid ? '' : ' (kein Hashtag gefunden)'}`)
    if (!cid) continue
    let cursor = 0, n = 0
    for (let page = 0; page < 5; page++) {
      const r = await call(TT_HOST, `/api/challenge/posts?challengeId=${cid}&count=30&cursor=${cursor}`)
      if (!r.json) { diag.push(`TT #${tag}: posts ${r.status}`); break }
      const items = ttItems(r.json.itemList || r.json)
      items.forEach(it => { const h = it.author?.uniqueId || it.author; add({ link: `https://www.tiktok.com/@${h}/video/${it.id}`, platform: 'tiktok', handle: h, via: '#' + tag }); n++ })
      if (!r.json.hasMore || !items.length) break
      cursor = Number(r.json.cursor) || cursor + 30
    }
    diag.push(`TT #${tag}: ${n} Videos`)
  }
  // Erwaehnungen (@kolure.de) ueber die Videosuche; nur Treffer, in denen die Marke wirklich in Beschreibung/Mentions steht
  for (const kw of [`@${BRAND_TT}`, 'kolure']) {
    let n = 0
    const r = await call(TT_HOST, `/api/search/video?keyword=${encodeURIComponent(kw)}&cursor=0&search_id=0`)
    diag.push(`TT Suche "${kw}": ${r.status}`)
    if (r.json) ttItems(r.json).forEach(it => {
      const desc = String(it.desc || '').toLowerCase()
      const mentions = JSON.stringify(it.textExtra || []).toLowerCase()
      if (desc.includes('kolure') || desc.includes('koluré') || mentions.includes('kolure')) {
        const h = it.author?.uniqueId || it.author
        add({ link: `https://www.tiktok.com/@${h}/video/${it.id}`, platform: 'tiktok', handle: h, via: 'Suche ' + kw }); n++
      }
    })
    diag.push(`TT Suche "${kw}": ${n} Treffer`)
  }

  // ---------- Instagram ----------
  const hdr = (path: string) => call(IG_HOST, path)
  const igAdd = (json: any, via: string) => {
    let n = 0
    igItems(json).forEach(it => {
      const isVideo = it.media_type === 2 || it.video_versions || it.product_type === 'clips' || it.is_video
      if (it.media_type !== undefined && !isVideo) return
      add({ link: `https://www.instagram.com/reel/${it.code}/`, platform: 'instagram', handle: it.user?.username || it.owner?.username, via }); n++
    })
    return n
  }
  const prof = await hdr(`/ig/info_username/?user=${encodeURIComponent(BRAND_IG)}&nocors=false`)
  const u = prof.json?.user || prof.json?.data?.user || prof.json
  const uid = u?.pk || u?.id || u?.pk_id
  diag.push(`IG Profil ${BRAND_IG}: ${prof.status}${uid ? '' : ' (keine ID)'}`)
  if (uid) {
    for (const path of [`/ig/tagged_posts/?id_user=${uid}&nocors=false`, `/ig/tagged/?id_user=${uid}&nocors=false`, `/ig/usertags/?id_user=${uid}&nocors=false`]) {
      const r = await hdr(path)
      if (r.json) { const n = igAdd(r.json, '@' + BRAND_IG); diag.push(`IG getaggt ${path.split('?')[0]}: ${r.status}, ${n} Videos`); if (n) break }
      else diag.push(`IG getaggt ${path.split('?')[0]}: ${r.status}`)
    }
  }
  for (const tag of TAGS) {
    for (const path of [`/ig/hashtag_posts/?hashtag=${tag}&nocors=false`, `/ig/hashtag/?hashtag=${tag}&nocors=false`, `/ig/tag_posts/?tag=${tag}&nocors=false`, `/ig/hashtag_media/?hashtag=${tag}&nocors=false`]) {
      const r = await hdr(path)
      if (r.json) { const n = igAdd(r.json, '#' + tag); diag.push(`IG #${tag} ${path.split('?')[0]}: ${r.status}, ${n} Videos`); if (n) break }
      else diag.push(`IG #${tag} ${path.split('?')[0]}: ${r.status}`)
    }
  }

  // Schon importierte aussortieren
  const links = Array.from(cands.keys())
  const have = new Set<string>()
  for (let i = 0; i < links.length; i += 100) {
    const { data } = await supabase.from('reels').select('source_link').in('source_link', links.slice(i, i + 100))
    ;(data || []).forEach((r: any) => have.add(r.source_link))
  }
  const neu = links.filter(l => !have.has(l)).map(l => cands.get(l)!)
  return NextResponse.json({ gefunden: links.length, schonDa: have.size, neu, diag })
}
