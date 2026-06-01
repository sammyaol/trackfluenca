import { NextRequest, NextResponse } from 'next/server'
const API_KEY = process.env.RAPIDAPI_KEY!
const IG_HOST = 'flashapi1.p.rapidapi.com'
const IG_H = { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': IG_HOST }
export async function GET(req: NextRequest) {
  const user = new URL(req.url).searchParams.get('user') || 'zara'
  const r = await fetch(`https://${IG_HOST}/ig/user_reels_by_username/?user=${encodeURIComponent(user)}`, { headers: IG_H })
  const data = await r.json()
  const items = data?.items || data?.data?.items || []
  const first = items[0] || null
  return NextResponse.json({
    status: r.status,
    topKeys: data && typeof data === 'object' ? Object.keys(data) : [],
    itemCount: items.length,
    itemKeys: first ? Object.keys(first) : [],
    hasMedia: !!first?.media,
    mediaKeys: first?.media ? Object.keys(first.media) : [],
    probe: first?.media || first || {},
  })
}
