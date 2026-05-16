import { NextRequest, NextResponse } from 'next/server'

const API_KEY = 'f4c7d7229bmsh61008aaae694e00p16c126jsn88ccf060645e'
const HOST = 'social-media-master.p.rapidapi.com'

function getTier(f: number) {
  return f >= 1000000 ? 'Top-Tier' : f >= 500000 ? 'Macro' : f >= 50000 ? 'Mid-Tier' : f >= 10000 ? 'Micro' : 'Nano'
}
function getAffPct(f: number) {
  return f >= 1000000 ? '8%' : f >= 500000 ? '10%' : f >= 50000 ? '12%' : '15%'
}
function calcPostWert(f: number) {
  return f < 10000 ? Math.round(f * 0.01) : f < 50000 ? Math.round(f * 0.015) : f < 500000 ? Math.round(f * 0.01) : f < 1000000 ? Math.round(f * 0.007) : Math.round(f * 0.005)
}

async function fetchIG(handle: string) {
  const res = await fetch(
    `https://${HOST}/instagram-user-account?url=${encodeURIComponent(`https://www.instagram.com/${handle}`)}`,
    { headers: { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': HOST, 'Content-Type': 'application/json' } }
  )
  return res.json()
}

async function fetchTT(handle: string) {
  const res = await fetch(
    `https://${HOST}/tiktok-user-account?url=${encodeURIComponent(`https://www.tiktok.com/@${handle}`)}`,
    { headers: { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': HOST, 'Content-Type': 'application/json' } }
  )
  return res.json()
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const ig = searchParams.get('ig')?.replace('@', '').trim()
  const tt = searchParams.get('tt')?.replace('@', '').trim()

  if (!ig && !tt) return NextResponse.json({ error: 'Handle fehlt' }, { status: 400 })

  const result: any = {}

  if (ig) {
    try {
      const data = await fetchIG(ig)
      if (data?.status?.code === 200 && data?.profile && data?.stats) {
        const { profile, stats } = data
        result.igFollower = stats.followersCount || 0
        result.igTier = getTier(result.igFollower)
        result.igEr = stats.avgER ? Math.round(stats.avgER * 100 * 10) / 10 : 0
        result.igAvgLikes = stats.avgLikes || 0
        result.igAvgComments = stats.avgComments || 0
        result.igAvgViews = stats.avgViews || 0
        result.fullName = profile.name || ''
        result.bio = profile.description || ''
        result.igImage = profile.image || ''
        result.igVerified = profile.verified || false
        result.igGender = profile.gender || ''
        result.igAge = profile.age || ''
        result.igCountry = profile.country || ''
      }
    } catch (e) {
      console.error('IG fetch error:', e)
    }
  }

  if (tt) {
    try {
      const data = await fetchTT(tt)
      if (data?.status?.code === 200 && data?.profile && data?.stats) {
        const { profile, stats } = data
        result.ttFollower = stats.followersCount || 0
        result.ttTier = getTier(result.ttFollower)
        result.ttEr = stats.avgER ? Math.round(stats.avgER * 100 * 10) / 10 : 0
        result.ttAvgViews = stats.avgViews || 0
        result.ttAvgLikes = stats.avgLikes || 0
        result.ttAvgComments = stats.avgComments || 0
        result.ttImage = profile.image || ''
        result.ttVerified = profile.verified || false
        if (!result.fullName) result.fullName = profile.name || ''
      }
    } catch (e) {
      console.error('TT fetch error:', e)
    }
  }

  const maxFollower = Math.max(result.igFollower || 0, result.ttFollower || 0)
  result.overallTier = getTier(maxFollower)
  result.gesamtReichweite = (result.igFollower || 0) + (result.ttFollower || 0)
  result.storyWert = result.igFollower ? Math.round(result.igFollower * 0.0001 * 10) * 100 : 0
  result.ttWert = result.ttFollower ? calcPostWert(result.ttFollower) : 0
  result.reelWert = result.igFollower ? calcPostWert(result.igFollower) : 0
  result.affiliatePct = getAffPct(maxFollower)

  return NextResponse.json(result)
}