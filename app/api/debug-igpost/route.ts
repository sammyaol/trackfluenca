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
    return NextResponse.json({ url, status, keys: json ? Object.keys(json) : null, sample: json ? JSON.stringify(json).slice(0, 2500) : text.slice(0, 500) })
  } catch (e: any) {
    return NextResponse.json({ url, error: e.message })
  }
}
