import { NextResponse } from 'next/server'
const H = { 'x-rapidapi-key': process.env.RAPIDAPI_KEY!, 'x-rapidapi-host': 'flashapi1.p.rapidapi.com', 'Content-Type': 'application/json' }
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams
  const path = p.get('path') || 'ig/reels_posts_username'
  const user = p.get('user') || 'cristiano'
  const url = `https://flashapi1.p.rapidapi.com/${path}/?user=${encodeURIComponent(user)}&nocors=false`
  const r = await fetch(url, { headers: H })
  const raw = await r.text()
  return NextResponse.json({ status: r.status, url, preview: raw.slice(0, 600) })
}
