import { NextRequest, NextResponse } from 'next/server'
const API_KEY = process.env.RAPIDAPI_KEY!
const IG_HOST = 'flashapi1.p.rapidapi.com'
const IG_H = { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': IG_HOST }
export async function GET(req: NextRequest) {
  const user = new URL(req.url).searchParams.get('user') || 'zara'
  const path = new URL(req.url).searchParams.get('path') || 'ig/user_reels_by_username'
  const url = `https://${IG_HOST}/${path}/?user=${encodeURIComponent(user)}`
  const r = await fetch(url, { headers: IG_H })
  const data = await r.json()
  return NextResponse.json({ status: r.status, calledUrl: url, data })
}
