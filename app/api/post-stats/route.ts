import { NextRequest, NextResponse } from 'next/server'
const KEY = process.env.RAPIDAPI_KEY!
const TT_HOST = 'tiktok-api23.p.rapidapi.com'
const TT_H = { 'x-rapidapi-key': KEY, 'x-rapidapi-host': TT_HOST }

// Extrahiert die TikTok-Video-ID aus verschiedenen Link-Formaten
function ttVideoId(link: string): string | null {
  const m = link.match(/\/video\/(\d+)/)
  if (m) return m[1]
  // nackte ID?
  if (/^\d{6,}$/.test(link.trim())) return link.trim()
  return null
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const link = (searchParams.get('link') || '').trim()
  if (!link) return NextResponse.json({ error: 'kein Link' }, { status: 400 })

  // Plattform erkennen
  const isTT = /tiktok\.com/i.test(link) || /^\d{6,}$/.test(link)
  if (!isTT) return NextResponse.json({ error: 'Nur TikTok-Links werden aktuell unterstützt' }, { status: 400 })

  const id = ttVideoId(link)
  if (!id) return NextResponse.json({ error: 'Video-ID nicht erkannt. Format: tiktok.com/@user/video/123...' }, { status: 400 })

  try {
    const r = await fetch(`https://${TT_HOST}/api/post/detail?videoId=${encodeURIComponent(id)}`, { headers: TT_H })
    if (!r.ok) return NextResponse.json({ error: `TikTok API Fehler ${r.status}` }, { status: 502 })
    const j = await r.json()
    const item = j?.itemInfo?.itemStruct
    if (!item) return NextResponse.json({ error: 'Keine Daten zum Video gefunden' }, { status: 404 })
    const s = item.stats || {}
    const ts = Number(item.createTime || 0)
    const datum = ts > 0 ? new Date(ts * 1000).toISOString().slice(0, 10) : ''
    return NextResponse.json({
      platform: 'tiktok',
      views: Number(s.playCount || 0),
      likes: Number(s.diggCount || 0),
      comments: Number(s.commentCount || 0),
      shares: Number(s.shareCount || 0),
      caption: item.desc || '',
      post_datum: datum,
      author: item.author?.uniqueId || ''
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
