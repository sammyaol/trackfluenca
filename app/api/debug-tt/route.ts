import { NextRequest, NextResponse } from 'next/server'
const KEY = process.env.RAPIDAPI_KEY!
const HOST = 'tiktok-api23.p.rapidapi.com'
const H = { 'x-rapidapi-key': KEY, 'x-rapidapi-host': HOST }
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const videoId = searchParams.get('videoId') || ''
  const path = searchParams.get('path') || '/api/post/detail'
  const param = searchParams.get('param') || 'videoId'
  const url = `https://${HOST}${path}?${param}=${encodeURIComponent(videoId)}`
  try {
    const r = await fetch(url, { headers: H })
    const status = r.status
    const text = await r.text()
    let json: any = null
    try { json = JSON.parse(text) } catch {}
    return NextResponse.json({ url, status, keys: json ? Object.keys(json) : null, sample: json ? JSON.stringify(json).slice(0, 2000) : text.slice(0, 500) })
  } catch (e: any) {
    return NextResponse.json({ url, error: e.message })
  }
}
