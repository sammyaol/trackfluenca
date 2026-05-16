import { NextRequest, NextResponse } from 'next/server'

const API_KEY = 'f4c7d7229bmsh61008aaae694e00p16c126jsn88ccf060645e'
const HOST = 'social-media-master.p.rapidapi.com'
const H = { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': HOST, 'Content-Type': 'application/json' }

function getTier(f: number) { return f >= 1000000 ? 'Top-Tier' : f >= 500000 ? 'Macro' : f >= 50000 ? 'Mid-Tier' : f >= 10000 ? 'Micro' : 'Nano' }
function getAffPct(f: number) { return f >= 1000000 ? '8%' : f >= 500000 ? '10%' : f >= 50000 ? '12%' : '15%' }
function calcWert(f: number) { return f < 10000 ? Math.round(f * 0.01) : f < 50000 ? Math.round(f * 0.015) : f < 500000 ? Math.round(f * 0.01) : f < 1000000 ? Math.round(f * 0.007) : Math.round(f * 0.005) }
function tkp(views: number, price: number) { return views > 0 ? Math.round((price / views) * 1000 * 100) / 100 : 0 }
async function apiFetch(url: string) { try { const r = await fetch(url, { headers: H }); return r.json() } catch { return null } }
function avg(arr: number[]) { return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0 }

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const ig = (searchParams.get('ig') ?? '').replace('@','').replace(/^https?://[^/]+//,'').replace(/.[a-z]{2,}$/,'').replace(///g,'').trim()
  const tt = (searchParams.get('tt') ?? '').replace('@','').replace(/^https?://[^/]+//,'').replace(/.[a-z]{2,}$/,'').replace(///g,'').trim()
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
      apiFetch(`https://${HOST}/instagram-user-account?url=${encodeURIComponent(igUrl)}`),
      apiFetch(`https://${HOST}/instagram-user-reels?id=${ig}&month=${month}`),
      apiFetch(`https://${HOST}/instagram-user-reels?id=${ig}&month=${prevMonth}`),
      apiFetch(`https://${HOST}/instagram-user-demographic?url=${encodeURIComponent(igUrl)}`),
      apiFetch(`https://${HOST}/instagram-account-daily-stats?id=${ig}&days=7`),
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
    const ttUrl = `https://www.tiktok.com/@${tt}`
    const [profile, videos, videosPrev, daily] = await Promise.all([
      apiFetch(`https://${HOST}/tiktok-user-account?url=${encodeURIComponent(ttUrl)}`),
      apiFetch(`https://${HOST}/tiktok-user-videos?id=${tt}&month=${month}`),
      apiFetch(`https://${HOST}/tiktok-user-videos?id=${tt}&month=${prevMonth}`),
      apiFetch(`https://${HOST}/tiktok-account-daily-stats?id=${tt}&days=7`),
    ])

    if (profile?.status?.code === 200) {
      const p = profile.profile
      const s = profile.stats
      result.ttFollower = s.followersCount || 0
      result.ttTier = getTier(result.ttFollower)
      result.ttEr = s.avgER ? Math.round(s.avgER * 100 * 100) / 100 : 0
      result.ttAvgLikes = s.avgLikes || 0
      result.ttAvgComments = s.avgComments || 0
      result.ttAvgViews = s.avgViews || 0
      result.ttImage = p.image || ''
      result.ttVerified = p.verified || false
      if (!result.fullName) result.fullName = p.name || ''
    }

    const videosData = (videos?.posts?.length ? videos : videosPrev)
    if (videosData?.status?.code === 200 && videosData?.posts?.length) {
      const posts = videosData.posts
      const views = posts.map((p: any) => p.postDetails?.videoViews || p.postDetails?.views || 0).filter((v: number) => v > 0)
      const lks = posts.map((p: any) => p.postDetails?.likes || 0)
      const cmts = posts.map((p: any) => p.postDetails?.comments || 0)
      const reposts = posts.map((p: any) => p.postDetails?.rePosts || 0)
      const ers = posts.map((p: any) => p.postStats?.viewsER || 0).filter((v: number) => v > 0)
      result.ttAvgVideoViews = avg(views)
      result.ttAvgVideoLikes = avg(lks)
      result.ttAvgVideoComments = avg(cmts)
      result.ttAvgReposts = avg(reposts)
      result.ttAvgVideoEr = ers.length ? Math.round(avg(ers.map((e: number) => e * 100)) * 10) / 10 : 0
      result.ttVideoCount = posts.length
    }

    if (daily?.meta?.code === 200 && daily?.dailyStats?.length) {
      const stats = daily.dailyStats
      result.ttFollowerWachstum7d = stats.reduce((s: number, d: any) => s + (d.deltaFollowers || 0), 0)
      result.ttAvgDailyViews = avg(stats.map((d: any) => d.deltaViews || 0))
      result.ttQualityScore = daily.summaryStats?.qualityScore || 0
      result.ttPostsPerWeek = Math.round((daily.summaryStats?.avgPostsPerWeek || 0) * 10) / 10
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
  result.tkpTT = tkp(result.ttAvgVideoViews || result.ttAvgViews || 0, ttWert)

  return NextResponse.json(result)
}
