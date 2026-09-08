import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.RAPIDAPI_KEY!
const IG_HOST = 'flashapi1.p.rapidapi.com'
const TT_HOST = 'tiktok-api23.p.rapidapi.com'
const IG_H: Record<string,string> = { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': IG_HOST, 'Content-Type': 'application/json' }
const TT_H: Record<string,string> = { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': TT_HOST }

function getTier(f: number) { return f >= 1000000 ? 'Top-Tier' : f >= 500000 ? 'Macro' : f >= 50000 ? 'Mid-Tier' : f >= 10000 ? 'Micro' : 'Nano' }
function getAffPct(f: number) { return f >= 1000000 ? '8%' : f >= 500000 ? '10%' : f >= 50000 ? '12%' : '15%' }
// Ziel-TKP (EUR pro 1000 Views) je Groessenklasse. Kalibriert an echten
// bezahlten Kooperationen (Cozmo, 628K TikTok-Follower/Macro-Tier, ca. 342K
// Avg. Views/Video, real bezahlt 600 EUR/Post -> TKP ca. 1,75 EUR). Groessere
// Reichweite = niedrigerer TKP (Mengenrabatt), kleinere Creator bekommen
// einen hoeheren TKP, da die Fixkosten pro Kooperation kaum sinken.
function getTkpTarget(tier: string) {
  return tier === 'Top-Tier' ? 1.0 : tier === 'Macro' ? 1.75 : tier === 'Mid-Tier' ? 2.2 : tier === 'Micro' ? 3.0 : 4.5
}
// Mindestpreis pro Post, falls (fast) keine Views-Daten vorliegen, damit
// kein unrealistisch niedriger Wert nahe 0 herauskommt.
function getMinWert(tier: string) {
  return tier === 'Top-Tier' ? 500 : tier === 'Macro' ? 300 : tier === 'Mid-Tier' ? 120 : tier === 'Micro' ? 60 : 30
}
// View-basierter Post-Wert: Ø Views * Ziel-TKP, mit Mindestpreis-Untergrenze.
// Ersetzt die alte rein follower-basierte Berechnung, die bei Creatorn mit
// hohen Follower- aber niedrigeren View-Zahlen stark ueberhoehte Preise
// auswarf (siehe #52). Ohne Views-Daten (z.B. privates Profil) faellt die
// Funktion auf eine stark abgeschwaechte Follower-Schaetzung zurueck.
function calcWertFromViews(avgViews: number, follower: number, tier: string) {
  const min = getMinWert(tier)
  if (avgViews > 0) return Math.max(min, Math.round((avgViews / 1000) * getTkpTarget(tier)))
  return Math.max(min, Math.round(follower * 0.0015))
}
function tkp(views: number, price: number) { return views > 0 ? Math.round((price / views) * 1000 * 100) / 100 : 0 }
async function apiFetch(url: string, headers: Record<string,string>) { try { const r = await fetch(url, { headers }); return r.json() } catch { return null } }
async function apiFetchRetry(url: string, headers: Record<string,string>, tries = 3) { for (let i = 0; i < tries; i++) { const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 9000); try { const r = await fetch(url, { headers, signal: ctrl.signal }); clearTimeout(to); if (r.ok) { const t = await r.text(); if (t) return JSON.parse(t) } } catch {} finally { clearTimeout(to) } await new Promise(res => setTimeout(res, 400)) } return null }
function avg(arr: number[]) { return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0 }
function rawAvg(arr: number[]) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0 }
function num(v: any) { const n = parseInt(String(v ?? 0), 10); return Number.isFinite(n) ? n : 0 }

async function guessCountry(bio: string, name: string, ig: string, tt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || (!bio && !name)) return ''
  try {
    const ctrl = new AbortController()
    const to = setTimeout(function () { ctrl.abort() }, 8000)
    const info = 'Name: ' + (name || '-') + '\n' + 'Instagram: ' + (ig || '-') + '\n' + 'TikTok: ' + (tt || '-') + '\n' + 'Bio: ' + (bio || '-')
    const promptText = 'Bestimme das wahrscheinlichste Herkunftsland (auf Deutsch, z.B. Deutschland, Oesterreich, Tuerkei, USA) dieser Person anhand von Name, Handles, Bio-Text und Sprache. Antworte NUR mit dem Laendernamen auf Deutsch, ohne weitere Erklaerung. Falls unklar, antworte mit Unbekannt.\n\n' + info
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-5', max_tokens: 20, messages: [{ role: 'user', content: promptText }] }),
      signal: ctrl.signal
    })
    clearTimeout(to)
    if (!r.ok) return ''
    const j = await r.json()
    const text = ((j && j.content && j.content[0] && j.content[0].text) || '').trim()
    if (!text || text.toLowerCase().indexOf('unbekannt') !== -1) return ''
    return text.split('\n')[0].slice(0, 40)
  } catch (e) { return '' }
}
function sanitize(raw: string | null): string { const s = (raw ?? '').trim().replace(/^@/, ''); try { const u = new URL(s.includes('://') ? s : 'https://' + s); const parts = u.pathname.split('/').filter(Boolean); return parts[parts.length-1] || u.hostname.replace('www.','') } catch { return s } }

import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const ig = sanitize(searchParams.get('ig'))
  const tt = sanitize(searchParams.get('tt'))
  if (!ig && !tt) return NextResponse.json({ error: 'Handle fehlt' }, { status: 400 })

  const result: any = {}

  if (ig) {
    const profile = await apiFetchRetry(`https://${IG_HOST}/ig/info_username/?user=${encodeURIComponent(ig)}&nocors=false`, IG_H)
    const u = profile?.user || profile?.data?.user || profile || {}

    if (u && u.follower_count != null) {
      result.igFollower = num(u.follower_count)
      result.igTier = getTier(result.igFollower)
      let igName = u.full_name || ''
      if (!igName || String(igName).includes('Access delayed')) igName = u.page_name || ''
      result.fullName = igName
      result.bio = u.biography || ''
      result.igImage = u.hd_profile_pic_url_info?.url || u.profile_pic_url || ''
      result.igVerified = u.is_verified || false
      result.igPostCount = num(u.media_count)

      const reelsResp = await apiFetchRetry(`https://${IG_HOST}/ig/reels_posts_username/?user=${encodeURIComponent(ig)}&nocors=false`, IG_H)
      const items = reelsResp?.items || reelsResp?.data?.items || []

      if (items.length) {
        function getViews(it: any) { const m = it.media || it; return num(m.play_count ?? m.ig_play_count ?? m.view_count ?? m.fb_play_count ?? 0) }
        function getLikes(it: any) { const m = it.media || it; return num(m.like_count ?? 0) }
        function getComments(it: any) { const m = it.media || it; return num(m.comment_count ?? 0) }

        const lks = items.map(getLikes)
        const cmts = items.map(getComments)
        const views = items.map(getViews).filter((v: number) => v > 0)
        result.igAvgLikes = avg(lks)
        result.igAvgComments = avg(cmts)
        result.igAvgReelViews = views.length ? avg(views) : 0
        result.igEr = result.igFollower > 0
          ? Math.round(((rawAvg(lks) + rawAvg(cmts)) / result.igFollower) * 100 * 100) / 100
          : 0
      }
    }
  }

  if (tt) {
    const info = await apiFetchRetry(`https://${TT_HOST}/api/user/info?uniqueId=${encodeURIComponent(tt)}`, TT_H)
    const ui = info?.userInfo
    let secUid = ''

    if (ui?.user) {
      const u = ui.user || {}
      const s = ui.statsV2 || ui.stats || {}
      result.ttFollower = num(s.followerCount)
      result.ttTier = getTier(result.ttFollower)
      result.ttAvgLikes = num(s.heartCount ?? s.heart)
      result.ttVideoCount = num(s.videoCount)
      result.ttImage = u.avatarThumb || u.avatarMedium || ''
      result.ttVerified = u.verified || false
      if (!result.fullName) result.fullName = u.nickname || ''
      secUid = u.secUid || ''
    }

    if (secUid) {
      const posts = await apiFetchRetry(`https://${TT_HOST}/api/user/posts?secUid=${encodeURIComponent(secUid)}&count=30&cursor=0`, TT_H)
      const videos = posts?.data?.itemList || posts?.itemList || []

      if (videos.length) {
        function getViews(v: any) { return v.stats?.playCount || v.statsV2?.playCount || v.play_count || 0 }
        function getLikes(v: any) { return v.stats?.diggCount || v.statsV2?.diggCount || v.digg_count || 0 }
        function getComments(v: any) { return v.stats?.commentCount || v.statsV2?.commentCount || v.comment_count || 0 }

        const notPinned = videos.filter((v: any) => !v.isPinnedItem && !v.is_top && !v.isPinned && !v.pinned)
        const pool = notPinned.length >= 5 ? notPinned : videos
        const allViews = pool.map((v: any) => getViews(v)).filter((v: number) => v > 0)

        if (allViews.length) {
          const sorted = [...allViews].sort((a, b) => a - b)
          const median = sorted[Math.floor(sorted.length / 2)]
          const filtered = pool.filter((v: any) => { const vv = getViews(v); return vv >= median * 0.05 && vv <= median * 5 })
          const toUse = (filtered.length >= 3 ? filtered : pool).slice(0, 10)
          const views = toUse.map((v: any) => getViews(v)).filter((v: number) => v > 0)
          const lks = toUse.map((v: any) => getLikes(v))
          const cmts = toUse.map((v: any) => getComments(v))
          result.ttAvgVideoViews = avg(views)
          result.ttAvgVideoLikes = avg(lks)
          result.ttAvgVideoComments = avg(cmts)
          const ttRawAvgViews = rawAvg(views)
          if (result.ttFollower && ttRawAvgViews) {
            result.ttEr = Math.round(((rawAvg(lks) + rawAvg(cmts)) / ttRawAvgViews) * 100 * 10) / 10
          }
        }
      }
    }
  }

  const maxFollower = Math.max(result.igFollower || 0, result.ttFollower || 0)
  result.overallTier = getTier(maxFollower)
  result.gesamtReichweite = (result.igFollower || 0) + (result.ttFollower || 0)

  const igTier = getTier(result.igFollower || 0)
  const ttTier = getTier(result.ttFollower || 0)
  // Reel-/TikTok-Wert: view-basiert (Ø Views * Ziel-TKP der Groessenklasse),
  // nicht mehr rein follower-basiert - siehe getTkpTarget()-Kommentar oben.
  const reelWert = result.igFollower ? calcWertFromViews(result.igAvgReelViews || 0, result.igFollower, igTier) : 0
  const ttWert = result.ttFollower ? calcWertFromViews(result.ttAvgVideoViews || 0, result.ttFollower, ttTier) : 0
  // Story-Wert: TikTok/IG-Stories liefern keine oeffentlichen View-Zahlen,
  // daher als Anteil (25%) vom view-basierten Reel-Wert abgeleitet statt
  // direkt aus Followern - Stories erreichen erfahrungsgemaess deutlich
  // weniger als ein Feed-/Reel-Post.
  const storyWert = reelWert ? Math.round(reelWert * 0.25) : 0
  result.reelWert = reelWert
  result.ttWert = ttWert
  result.storyWert = storyWert
  result.affiliatePct = getAffPct(maxFollower)
  result.tkpReel = tkp(result.igAvgReelViews || 0, reelWert)
  result.tkpStory = tkp(result.igAvgReelViews ? result.igFollower * 0.05 : 0, storyWert)
  result.tkpTT = tkp(result.ttAvgVideoViews || 0, ttWert)

  result.land = await guessCountry(result.bio || '', result.fullName || '', ig || '', tt || '')

  return NextResponse.json(result)
}
