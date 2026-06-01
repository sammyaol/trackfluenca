import { NextResponse } from 'next/server'
const H = { 'x-rapidapi-key': process.env.RAPIDAPI_KEY!, 'x-rapidapi-host': 'flashapi1.p.rapidapi.com', 'Content-Type': 'application/json' }
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams
  const path = p.get('path') || 'ig/reels_posts_username'
  const user = p.get('user') || 'cristiano'
  const url = `https://flashapi1.p.rapidapi.com/${path}/?user=${encodeURIComponent(user)}&nocors=false`
  const r = await fetch(url, { headers: H })
  const raw = await r.text()
  const j = JSON.parse(raw); const m = j.items[0].media; return NextResponse.json({ status: r.status, mediaKeys: Object.keys(m), vals: { play_count: m.play_count, ig_play_count: m.ig_play_count, view_count: m.view_count, fb_play_count: m.fb_play_count, play_count_clips: m.clips_metadata?.play_count, like_count: m.like_count, comment_count: m.comment_count } })
}
