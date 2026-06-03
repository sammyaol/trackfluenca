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
    const item = json?.itemInfo?.itemStruct || {}
    return NextResponse.json({ url, status,
      stats: item.stats || null,
      statsV2: item.statsV2 || null,
      desc: item.desc ?? null,
      createTime: item.createTime ?? null,
      author: item.author?.uniqueId ?? null,
      itemKeys: Object.keys(item)
    })
  } catch (e: any) {
    return NextResponse.json({ url, error: e.message })
  }
}
