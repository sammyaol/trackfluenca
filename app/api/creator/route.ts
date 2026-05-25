import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.RAPIDAPI_KEY!
const IG_HOST = 'instagram-best-experience.p.rapidapi.com'
const TT_HOST = 'tiktok-scraper7.p.rapidapi.com'
const IG_H: Record<string,string> = { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': IG_HOST }
const TT_H: Record<string,string> = { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': TT_HOST }

function getTier(f: number) { return f >= 1000000 ? 'Top-Tier' : f >= 500000 ? 'Macro' : f >= 50000 ? 'Mid-Tier' : f >= 10000 ? 'Micro' : 'Nano' }
function getAffPct(f: number) { return f >= 1000000 ? '8%' : f >= 500000 ? '10%' : f >= 50000 ? '12%' : '15%' }
function calcWert(f: number) { return f < 10000 ? Math.round(f * 0.01) : f < 50000 ? Math.round(f * 0.015) : f < 500000 ? Math.round(f * 0.01) : f < 1000000 ? Math.round(f * 0.007) : Math.round(f * 0.005) }
function tkp(views: number, price: number) { return views > 0 ? Math.round((price / views) * 1000 * 100) / 100 : 0 }
async function apiFetch(url: string, headers: Record<string,string>) { try { const r = await fetch(url, { headers }); return r.json() } catch { return null } }
function avg(arr: number[]) { return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0 }
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
    const profile = await apiFetch(`https://${IG_HOST}/profile?username=${encodeURIComponent(ig)}`, IG_H)

    if (profile?.follower_count) {
      result.igFollower = profile.follower_count || 0
      result.igTier = getTier(result.igFollower)
      result.fullName = profile.full_name || ''
      result.bio = profile.biography || ''
      result.igImage = profile.hd_profile_pic_url_info?.url || profile.profile_pic_url || ''
      result.igVerified = profile.is_verified || false
      result.igPostCount = profile.media_count || 0

      const userId = profile.pk
      if (userId) {
        const feed = await apiFetch(`https://${IG_HOST}/feed?user_id=${userId}&count=12`, IG_H)
        const posts = feed?.items || []
        if (posts.length) {
          const lks = posts.map((p: any) => p.like_count || 0)
          const cmts = posts.map((p: any) => p.comment_count || 0)
          const views = posts.map((p: any) => p.play_count || p.view_count || 0).filter((v: number) => v > 0)
          result.igAvgLikes = avg(lks)
          result.igAvgComments = avg(cmts)
          result.igAvgReelViews = views.length ? avg(views) : 0
          result.igEr = result.igFollower > 0
            ? Math.round(((avg(lks) + avg(cmts)) / result.igFollower) * 100 * 100) / 100
            : 0
        }
      }
    }
  }

  if (tt) {
    const [userInfo, posts] = await Promise.all([
      apiFetch(`https://${TT_HOST}/user/info?unique_id=${encodeURIComponent(tt)}`, TT_H),
      apiFetch(`https://${TT_HOST}/user/posts?unique_id=${encodeURIComponent(tt)}&count=30&cursor=0`, TT_H),
    ])

    if (userInfo?.code === 0 && userInfo?.data) {
      const u = userInfo.data.user || {}
      const s = userInfo.data.stats || {}
      result.ttFollower = s.followerCount || 0
      result.ttTier = getTier(result.ttFollower)
      result.ttAvgLikes = s.heartCount || 0
      result.ttVideoCount = s.videoCount || 0
      result.ttImage = u.avatarThumb || ''
      result.ttVerified = u.verified || false
      if (!result.fullName) result.fullName = u.nickname || ''
    }

    if (posts?.code === 0 && posts?.data?.videos?.length) {
      const videos = posts.data.videos
      function getViews(v: any) { return v.stats?.playCount || v.stats?.play_count || v.play_count || 0 }
      function getLikes(v: any) { return v.stats?.diggCount || v.stats?.like_count || v.digg_count || 0 }
      function getComments(v: any) { return v.stats?.commentCount || v.stats?.comment_count || v.comment_count || 0 }

      const notPinned = videos.filter((v: any) => !v.is_top && !v.isPinned && !v.pinned)
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
  // TKP wird erst nach Fee-Eintrag berechnet (fee / views * 1000)
  // Vorschau-TKP basiert auf kalkuliertem Wert
  result.tkpReel = tkp(result.igAvgReelViews || 0, reelWert)
  result.tkpStory = tkp(result.igAvgReelViews ? result.igFollower * 0.05 : 0, storyWert)
  result.tkpTT = tkp(result.ttAvgVideoViews || 0, ttWert)

  return NextResponse.json(result)
}
