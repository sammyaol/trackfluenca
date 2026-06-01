import { NextRequest, NextResponse } from 'next/server'
const API_KEY = process.env.RAPIDAPI_KEY!
const IG_HOST = 'flashapi1.p.rapidapi.com'
const IG_H = { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': IG_HOST }
export async function GET(req: NextRequest) {
  try {
    const user = new URL(req.url).searchParams.get('user') || 'zara'
    const path = new URL(req.url).searchParams.get('path') || 'ig/reels_posts_username'
    const url = `https://${IG_HOST}/${path}/?user=${encodeURIComponent(user)}`
    const r = await fetch(url, { headers: IG_H })
    const raw = await r.text()
    let data: any = null
    try { data = JSON.parse(raw) } catch { data = null }
    const items = data?.items || data?.data?.items || []
    const first = items[0] || null
    return NextResponse.json({
      status: r.status,
      calledUrl: url,
      isJson: data !== null,
      rawPreview: raw.slice(0, 400),
      topKeys: data && typeof data === 'object' ? Object.keys(data) : [],
      itemCount: Array.isArray(items) ? items.length : 'not-array',
      itemKeys: first ? Object.keys(first) : [],
      hasMedia: !!first?.media,
      mediaKeys: first?.media ? Object.keys(first.media) : [],
    })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) })
  }
}
