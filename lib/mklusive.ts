import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
export const AGENCY = 'mklusive'
export const LINK_BASE = (process.env.LINK_BASE_URL || 'https://kolure.trackfluenca.com/r/')
export const SHOP_URL = 'https://kolure.de'

// Nur freigeschaltete Mitglieder (Tabelle agency_members) duerfen das Portal nutzen.
export async function getMember(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data: { user } } = await db.auth.getUser(token)
  if (!user) return null
  const { data: m } = await db.from('agency_members').select('role, agency, email').eq('user_id', user.id).maybeSingle()
  if (!m) return { user, role: null as null, agency: AGENCY, email: user.email || '' }
  return { user, role: m.role as 'admin' | 'agency', agency: m.agency as string, email: (m.email || user.email || '') as string }
}

const CHARSET = 'abcdefghijkmnpqrstuvwxyz23456789'
export const genCode = (len = 7) => Array.from({ length: len }, () => CHARSET[Math.floor(Math.random() * CHARSET.length)]).join('')
export const slugify = (name: string) =>
  (name || 'creator').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'creator'

export const cleanHandle = (h: unknown) => {
  const s = String(h ?? '').trim().replace(/^https?:\/\/(www\.)?(instagram|tiktok)\.com\//i, '').replace(/\/$/, '')
  if (!s) return null
  return s.startsWith('@') ? s : '@' + s
}
export const cleanCode = (c: unknown) => { const s = String(c ?? '').trim().replace(/\s+/g, ''); return s ? s.slice(0, 40) : null }
const num = (v: unknown) => (v === '' || v == null ? 0 : Math.max(0, Number(v) || 0))
export const cleanNum = num

export function postFields(b: any) {
  const o: Record<string, unknown> = {}
  if ('plattform' in b) o.plattform = String(b.plattform || 'Instagram').slice(0, 40)
  if ('format' in b) o.format = String(b.format || 'Reel').slice(0, 40)
  if ('datum' in b) o.datum = b.datum || null
  if ('post_link' in b) o.post_link = String(b.post_link || '').trim().slice(0, 500) || null
  if ('fee' in b) o.fee = num(b.fee)
  if ('produkt' in b) o.produkt = num(b.produkt)
  if ('views' in b) o.views = b.views === '' || b.views == null ? null : Math.max(0, Math.round(Number(b.views) || 0))
  if ('notizen' in b) o.notizen = String(b.notizen || '').slice(0, 2000) || null
  return o
}

