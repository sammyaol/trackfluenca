import { NextRequest, NextResponse } from 'next/server'
const KEY = process.env.RAPIDAPI_KEY!
const HOST = 'flashapi1.p.rapidapi.com'
const H = { 'x-rapidapi-key': KEY, 'x-rapidapi-host': HOST, 'Content-Type': 'application/json' }
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code') || ''
  const path = searchParams.get('path') || '/ig/post_info/'
  const param = searchParams.get('param') || 'shortcode'
  const url = `https://${HOST}${path}?${param}=${encodeURIComponent(code)}&nocors=false`
  try {
    const r = await fetch(url, { headers: H })
    const status = r.status
    const text = await r.text()
    let json: any = null
    try { json = JSON.parse(text) } catch {}
    const it = json?.items?.[0] || {}
    return NextResponse.json({ url, status,
      like_count: it.like_count ?? null,
      comment_count: it.comment_count ?? null,
      play_count: it.play_count ?? null,
      view_count: it.view_count ?? null,
      ig_play_count: it.ig_play_count ?? null,
      fb_play_count: it.fb_play_count ?? null,
      video_view_count: it.video_view_count ?? null,
      reshare_count: it.reshare_count ?? null,
      media_type: it.media_type ?? null,
      taken_at: it.taken_at ?? null,
      caption: it.caption?.text ?? null,
      itemKeys: Object.keys(it).filter(k => /count|view|play|like|comment|caption|taken/i.test(k))
    })
  } catch (e: any) {
    return NextResponse.json({ url, error: e.message })
  }
}
