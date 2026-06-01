import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.RAPIDAPI_KEY!
const IG_HOST = 'flashapi1.p.rapidapi.com'
const TT_HOST = 'tiktok-api23.p.rapidapi.com'
const IG_H: Record<string,string> = { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': IG_HOST, 'Content-Type': 'application/json' }
const TT_H: Record<string,string> = { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': TT_HOST }

function getTier(f: number) { return f >= 1000000 ? 'Top-Tier' : f >= 500000 ? 'Macro' : f >= 50000 ? 'Mid-Tier' : f >= 10000 ? 'Micro' : 'Nano' }
function getAffPct(f: number) { return f >= 1000000 ? '8%' : f >= 500000 ? '10%' : f >= 50000 ? '12%' : '15%' }
function calcWert(f: number) { return f < 10000 ? Math.round(f * 0.01) : f < 50000 ? Math.round(f * 0.015) : f < 500000 ? Math.round(f * 0.01) : f < 1000000 ? Math.round(f * 0.007) : Math.round(f * 0.005) }
function tkp(views: number, price: number) { return views > 0 ? Math.round((price / views) * 1000 * 100) / 100 : 0 }
async function apiFetch(url: string, headers: Record<string,string>) { try { const r = await fetch(url, { headers }); return r.json() } catch { return null } }
async function apiFetchRetry(url: string, headers: Record<string,string>, tries = 3) { for (let i = 0; i < tries; i++) { try { const r = await fetch(url, { headers }); if (r.ok) { const t = await r.text(); if (t) return JSON.parse(t) } } catch {} await new Promise(res => setTimeout(res, 400)) } return null }
function avg(arr: number[]) { return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0 }
function num(v: any) { const n = parseInt(String(v ?? 0), 10); return Number.isFinite(n) ? n : 0 }
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
    const profile = await apiFetch(`https://${IG_HOST}/ig/info_username/?user=${encodeURIComponent(ig)}&nocors=false`, IG_H)
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
          ? Math.round(((avg(lks) + avg(cmts)) / result.igFollower) * 100 * 100) / 100
          : 0
      }
    }
  }

  if (tt) {
    const info = await apiFetch(`https://${TT_HOST}/api/user/info?uniqueId=${encodeURIComponent(tt)}`, TT_H)
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
      const posts = await apiFetch(`https://${TT_HOST}/api/user/posts?secUid=${encodeURIComponent(secUid)}&count=30&cursor=0`, TT_H)
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
          if (result.ttFollower && result.ttAvgVideoViews) {
            result.ttEr = Math.round(((result.ttAvgVideoLikes + result.ttAvgVideoComments) / result.ttAvgVideoViews) * 100 * 10) / 10
          }
        }
      }
    }
  }

  const maxFollower = Math.max(result.igFollower || 0, result.ttFollower || 0)
  result.overallTier = getTier(maxFollower)
  result.gesamtReichweite = (result.igFollower || 0) + (result.ttFollower || 0)
  const reelWert = calcWert(result.igFollower || 0)
  const ttWert = calcWert(result.ttFollower || 0)
  const storyWert = result.igFollower ? Math.round(result.igFollower * 0.0001 * 10) * 100 : 0
  result.reelWert = reelWert
  result.ttWert = ttWert
  result.storyWert = storyWert
  result.affiliatePct = getAffPct(maxFollower)
  result.tkpReel = tkp(result.igAvgReelViews || 0, reelWert)
  result.tkpStory = tkp(result.igAvgReelViews ? result.igFollower * 0.05 : 0, storyWert)
  result.tkpTT = tkp(result.ttAvgVideoViews || 0, ttWert)

  return NextResponse.json(result)
}
