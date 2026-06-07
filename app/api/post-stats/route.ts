import { NextRequest, NextResponse } from 'next/server'
const KEY = process.env.RAPIDAPI_KEY!
const TT_HOST = 'tiktok-api23.p.rapidapi.com'
const TT_H = { 'x-rapidapi-key': KEY, 'x-rapidapi-host': TT_HOST }
const IG_HOST = 'flashapi1.p.rapidapi.com'
const IG_H = { 'x-rapidapi-key': KEY, 'x-rapidapi-host': IG_HOST, 'Content-Type': 'application/json' }

// TikTok-Video-ID aus Link
function ttVideoId(link: string): string | null {
  const m = link.match(/\/video\/(\d+)/)
  if (m) return m[1]
  if (/^\d{6,}$/.test(link.trim())) return link.trim()
  return null
}

// Instagram-Shortcode aus Link (/p/CODE/, /reel/CODE/, /tv/CODE/)
function igShortcode(link: string): string | null {
  const m = link.match(/\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/)
  if (m) return m[1]
  return null
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const link = (searchParams.get('link') || '').trim()
  if (!link) return NextResponse.json({ error: 'kein Link' }, { status: 400 })

  const isIG = /instagram\.com/i.test(link)
  const isTT = /tiktok\.com/i.test(link) || /^\d{6,}$/.test(link)

  // ---- Instagram ----
  if (isIG) {
    const code = igShortcode(link)
    if (!code) return NextResponse.json({ error: 'IG-Shortcode nicht erkannt. Format: instagram.com/p/... oder /reel/...' }, { status: 400 })
    try {
      const r = await fetch(`https://${IG_HOST}/ig/post_info/?shortcode=${encodeURIComponent(code)}&nocors=false`, { headers: IG_H })
      if (!r.ok) return NextResponse.json({ error: `Instagram API Fehler ${r.status}` }, { status: 502 })
      const j = await r.json()
      const it = j?.items?.[0]
      if (!it) return NextResponse.json({ error: 'Keine Daten zum Post gefunden' }, { status: 404 })
      const ts = Number(it.taken_at || 0)
      const datum = ts > 0 ? new Date(ts * 1000).toISOString().slice(0, 10) : ''
      const views = Number(it.play_count || it.ig_play_count || it.view_count || it.video_view_count || it.fb_play_count || 0)
      return NextResponse.json({
        platform: 'instagram',
        views,
        likes: Number(it.like_count || 0),
        comments: Number(it.comment_count || 0),
        shares: Number(it.reshare_count || 0),
        caption: it.caption?.text || '',
        post_datum: datum,
        author: it.user?.username || ''
      })
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
  }

  // ---- TikTok ----
  if (isTT) {
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

  return NextResponse.json({ error: 'Link nicht erkannt. Unterstützt: TikTok und Instagram.' }, { status: 400 })
}
