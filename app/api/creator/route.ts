import { NextRequest, NextResponse } from 'next/server'

const API_KEY = '1c8f95c798msh3d63fd4092ead12p160391jsnc1b84ff843e7'
const IG_HOST = 'social-media-master.p.rapidapi.com'
const TT_HOST = 'tiktok-scraper7.p.rapidapi.com'
const IG_H: Record<string,string> = { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': IG_HOST, 'Content-Type': 'application/json' }
const TT_H: Record<string,string> = { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': TT_HOST }

function getTier(f: number) { return f >= 1000000 ? 'Top-Tier' : f >= 500000 ? 'Macro' : f >= 50000 ? 'Mid-Tier' : f >= 10000 ? 'Micro' : 'Nano' }
function getAffPct(f: number) { return f >= 1000000 ? '8%' : f >= 500000 ? '10%' : f >= 50000 ? '12%' : '15%' }
function calcWert(f: number) { return f < 10000 ? Math.round(f * 0.01) : f < 50000 ? Math.round(f * 0.015) : f < 500000 ? Math.round(f * 0.01) : f < 1000000 ? Math.round(f * 0.007) : Math.round(f * 0.005) }
function tkp(views: number, price: number) { return views > 0 ? Math.round((price / views) * 1000 * 100) / 100 : 0 }
async function apiFetch(url: string, headers: Record<string,string>) { try { const r = await fetch(url, { headers }); return r.json() } catch { return null } }
function avg(arr: number[]) { return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0 }
function sanitize(raw: string | null): string { return (raw ?? '').replace('@', '').split('/').pop()!.split('?')[0].replace(/\.[a-z]{2,}$/, '').trim() }

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const ig = sanitize(searchParams.get('ig'))
  const tt = sanitize(searchParams.get('tt'))
  if (!ig && !tt) return NextResponse.json({ error: 'Handle fehlt' }, { status: 400 })

  const result: any = {}
  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const prevMonth = now.getMonth() === 0
    ? `${now.getFullYear() - 1}-12-01`
    : `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}-01`

  if (ig) {
    const igUrl = `https://www.instagram.com/${ig}`
    const [profile, reels, reelsPrev, demog, daily] = await Promise.all([
      apiFetch(`https://${IG_HOST}/instagram-user-account?url=${encodeURIComponent(igUrl)}`, IG_H),
      apiFetch(`https://${IG_HOST}/instagram-user-reels?id=${ig}&month=${month}`, IG_H),
      apiFetch(`https://${IG_HOST}/instagram-user-reels?id=${ig}&month=${prevMonth}`, IG_H),
      apiFetch(`https://${IG_HOST}/instagram-user-demographic?url=${encodeURIComponent(igUrl)}`, IG_H),
      apiFetch(`https://${IG_HOST}/instagram-account-daily-stats?id=${ig}&days=7`, IG_H),
    ])

    if (profile?.status?.code === 200) {
      const p = profile.profile
      const s = profile.stats
      result.igFollower = s.followersCount || 0
      result.igTier = getTier(result.igFollower)
      result.igEr = s.avgER ? Math.round(s.avgER * 100 * 100) / 100 : 0
      result.igAvgLikes = s.avgLikes || 0
      result.igAvgComments = s.avgComments || 0
      result.fullName = p.name || ''
      result.bio = p.description || ''
      result.igImage = p.image || ''
      result.igVerified = p.verified || false
      result.igGender = p.gender || ''
      result.igAge = p.age || ''
      result.igCountry = p.country || ''
      result.igQualityScore = s.qualityScore || 0
    }

    const reelsData = (reels?.posts?.length ? reels : reelsPrev)
    if (reelsData?.status?.code === 200 && reelsData?.posts?.length) {
      const posts = reelsData.posts
      const vViews = posts.map((p: any) => p.postDetails?.videoViews || 0).filter((v: number) => v > 0)
      const lks = posts.map((p: any) => p.postDetails?.likes || 0)
      const cmts = posts.map((p: any) => p.postDetails?.comments || 0)
      const ers = posts.map((p: any) => p.postStats?.videoViewsER || 0).filter((v: number) => v > 0)
      result.igAvgReelViews = avg(vViews)
      result.igAvgReelLikes = avg(lks)
      result.igAvgReelComments = avg(cmts)
      result.igAvgReelEr = ers.length ? Math.round(avg(ers.map((e: number) => e * 100)) * 10) / 10 : 0
      result.igReelCount = posts.length
    }

    if (demog?.status?.code === 200 && demog?.demographic) {
      const d = demog.demographic
      result.igTopCountries = d.followersCountries?.slice(0, 5).map((c: any) => ({ name: c.name, pct: Math.round(c.value * 1000) / 10 })) || []
      result.igTopCities = d.followersCities?.slice(0, 3).map((c: any) => ({ name: c.name, pct: Math.round(c.value * 1000) / 10 })) || []
      result.igGenderMale = Math.round((d.genders?.find((g: any) => g.name === 'm')?.percent || 0) * 100)
      result.igGenderFemale = Math.round((d.genders?.find((g: any) => g.name === 'f')?.percent || 0) * 100)
      result.igTopAge = d.ages?.[0]?.name || ''
      result.igAgeDistribution = d.ages?.map((a: any) => ({ age: a.name, pct: Math.round(a.percent * 1000) / 10 })) || []
      result.igRealFollowers = Math.round((d.followersTypes?.find((t: any) => t.name === 'real')?.percent || 0) * 100)
      result.igFakeFollowers = Math.round((d.extra?.connections?.pctFakeFollowers || 0) * 100)
      result.igCategories = d.extra?.categories || []
    }

    if (daily?.meta?.code === 200 && daily?.dailyStats?.length) {
      const stats = daily.dailyStats
      result.igFollowerWachstum7d = stats.reduce((s: number, d: any) => s + (d.deltaFollowers || 0), 0)
      result.igQualityScore = daily.summaryStats?.qualityScore || result.igQualityScore || 0
      result.igPostsPerWeek = Math.round((daily.summaryStats?.avgPostsPerWeek || 0) * 10) / 10
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

    if (userInfo?.data?.user) {
      const u = userInfo.data.user
      result.ttImage = u.avatarThumb || result.ttImage || ''
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
        const filtered = pool.filter((v: any) => {
          const vv = getViews(v)
          return vv >= median * 0.05 && vv <= median * 5
        })
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
  result.tkpReel = tkp(result.igAvgReelViews || 0, reelWert)
  result.tkpStory = tkp(result.igFollower ? result.igFollower * 0.05 : 0, storyWert)
  result.tkpTT = tkp(result.ttAvgVideoViews || 0, ttWert)

  return NextResponse.json(result)
}
