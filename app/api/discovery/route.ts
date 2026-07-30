import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const API_KEY = process.env.RAPIDAPI_KEY!
const IG_HOST = 'flashapi1.p.rapidapi.com'
const IG_H: Record<string,string> = { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': IG_HOST }

async function apiFetch(url: string, headers: Record<string,string>) {
  try { const r = await fetch(url, { headers }); return r.json() } catch { return null }
}

async function apiFetchRetry(url: string, headers: Record<string,string>, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url, { headers }); if (r.ok) { const t = await r.text(); if (t) return JSON.parse(t) } } catch {}
    await new Promise(res => setTimeout(res, 400))
  }
  return null
}

function sanitize(raw: string | null): string {
  const s = (raw || '').trim().replace(/^@/, '')
  try {
    const u = s.includes('://') ? s : 'https://' + s
    const parts = new URL(u).pathname.split('/').filter(Boolean)
    return parts[0] || s
  } catch { return s }
}

function pickImg(u: any): string {
  return u?.hd_profile_pic_url_info?.url || u?.hd_profile_pic_versions?.[0]?.url || u?.profile_pic_url || ''
}

function cleanText(v: any): string {
  const s = String(v || '')
  if (!s) return ''
  if (s.toLowerCase().includes('access delayed')) return ''
  if (s.toLowerCase().includes('only the owner')) return ''
  return s
}

function liteFromUser(u: any, fallbackHandle?: string) {
  if (!u) return null
  const username = u.username || fallbackHandle || ''
  if (!username) return null
  return {
    username,
    full_name: cleanText(u.full_name || u.fullName || ''),
    profile_pic_url: pickImg(u),
    category: cleanText(u.category_name || u.category || u.pageName || ''),
    is_verified: !!(u.is_verified || u.isVerified),
    follower_count: u.follower_count ?? u.followerCount ?? 0,
  }
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const handle = sanitize(searchParams.get('handle'))
  if (!handle) return NextResponse.json({ error: 'Handle fehlt' }, { status: 400 })

  const profile = await apiFetchRetry(`https://${IG_HOST}/ig/info_username/?nocors=false&user=${encodeURIComponent(handle)}`, IG_H)
  const u = profile?.user || profile?.data?.user || profile?.data || null
  if (!u) return NextResponse.json({ error: 'Account nicht gefunden' }, { status: 404 })

  const origin = liteFromUser(u, handle)
  const uid = u.pk || u.id || u.pk_id || u.user_id || u.fbid_v2 || ''

  let similar: any[] = []
  if (uid) {
    const simResp = await apiFetch(`https://${IG_HOST}/ig/similar_accounts/?id_user=${encodeURIComponent(String(uid))}`, IG_H)
    const rawList = simResp?.users || simResp?.data?.users || simResp?.similar_accounts
      || simResp?.suggestions || (Array.isArray(simResp) ? simResp : null)
      || (Array.isArray(simResp?.data) ? simResp.data : null) || []
    similar = (rawList as any[])
      .map((item: any) => liteFromUser(item.user || item, item?.username))
      .filter((x: any) => x && x.username && x.username.toLowerCase() !== handle.toLowerCase())
      .slice(0, 24)
  }

  return NextResponse.json({ origin, similar })
}
