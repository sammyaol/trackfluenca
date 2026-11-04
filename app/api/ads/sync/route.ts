import { NextRequest, NextResponse } from 'next/server'
import { db, getUser, getToken, syncBrand, processMedia, type Brand } from '@/lib/ads'

export const maxDuration = 60

// Sync: alle aktiven Marken (oder eine per ?brand=) aus der Ad Library ziehen, danach Medien nachladen.
// Aufruf per App (Bearer User-Token) oder per Cron (Bearer ADS_CRON_KEY, dann fuer alle Nutzer mit Token).
async function run(userId: string, brandId: string | null, mode: string, budgetMs: number) {
  const t0 = Date.now()
  const { token, countries } = await getToken(userId)
  if (!token) return { error: 'Kein Meta-Token hinterlegt.' }
  const out: Record<string, unknown> = {}
  if (mode !== 'media') {
    let q = db.from('ads_brands').select('*').eq('user_id', userId).eq('active', true).order('last_sync', { ascending: true, nullsFirst: true })
    if (brandId) q = q.eq('id', brandId)
    const { data: brands } = await q
    const res: Record<string, unknown> = {}
    for (const b of (brands || []) as Brand[]) {
      if (Date.now() - t0 > budgetMs) { res[b.name] = 'übersprungen (Zeit)'; continue }
      try { res[b.name] = await syncBrand(userId, b, token, countries, brandId ? 10 : 4) }
      catch (e: any) { res[b.name] = 'Fehler: ' + e.message; await db.from('ads_brands').update({ last_error: e.message, last_sync: new Date().toISOString() }).eq('id', b.id) }
    }
    out.sync = res
  }
  if (mode !== 'ads' && Date.now() - t0 < budgetMs) out.media = await processMedia(userId, token, mode === 'media' ? 15 : 8)
  return out
}

export async function POST(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('mode') || 'all'
  const auth = req.headers.get('authorization')?.replace('Bearer ', '') || ''
  if (process.env.ADS_CRON_KEY && auth === process.env.ADS_CRON_KEY) {
    const { data: users } = await db.from('ads_settings').select('user_id').not('meta_token', 'is', null)
    const out: Record<string, unknown> = {}
    for (const u of users || []) out[u.user_id] = await run(u.user_id, null, mode, 40_000)
    return NextResponse.json(out)
  }
  const user = await getUser(req); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const r = await run(user.id, req.nextUrl.searchParams.get('brand'), mode, 45_000)
  return NextResponse.json(r, { status: 'error' in r ? 400 : 200 })
}
