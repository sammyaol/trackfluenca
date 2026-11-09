import { NextRequest, NextResponse } from 'next/server'
import { db, getUser } from '@/lib/ads'
import { guessGender } from '@/lib/gender'

export const maxDuration = 60

// Creator-Stammdaten zu den Kooperationen: Geschlecht (aus Vorname), Sprache (aus Captions), spaeter Bio/Follower aus Profilabruf.
// Land aus Bio/Sprache schaetzen
const CITY: Record<string, string> = { berlin: 'DE', hamburg: 'DE', münchen: 'DE', munich: 'DE', köln: 'DE', cologne: 'DE', frankfurt: 'DE', stuttgart: 'DE', düsseldorf: 'DE', leipzig: 'DE', hannover: 'DE', nürnberg: 'DE', dresden: 'DE', bremen: 'DE', essen: 'DE', dortmund: 'DE', germany: 'DE', deutschland: 'DE', wien: 'AT', vienna: 'AT', graz: 'AT', salzburg: 'AT', linz: 'AT', austria: 'AT', österreich: 'AT', zürich: 'CH', zurich: 'CH', bern: 'CH', basel: 'CH', genf: 'CH', geneva: 'CH', lausanne: 'CH', schweiz: 'CH', switzerland: 'CH', paris: 'FR', lyon: 'FR', marseille: 'FR', bordeaux: 'FR', nice: 'FR', lille: 'FR', france: 'FR', london: 'GB', manchester: 'GB', birmingham: 'GB', uk: 'GB', england: 'GB', milano: 'IT', milan: 'IT', roma: 'IT', rome: 'IT', napoli: 'IT', torino: 'IT', italia: 'IT', italy: 'IT', madrid: 'ES', barcelona: 'ES', valencia: 'ES', sevilla: 'ES', españa: 'ES', spain: 'ES', amsterdam: 'NL', rotterdam: 'NL', netherlands: 'NL', nederland: 'NL', brussels: 'BE', bruxelles: 'BE', antwerp: 'BE', belgium: 'BE', lisboa: 'PT', lisbon: 'PT', porto: 'PT', portugal: 'PT', istanbul: 'TR', ankara: 'TR', türkiye: 'TR', turkey: 'TR', warszawa: 'PL', warsaw: 'PL', kraków: 'PL', poland: 'PL', polska: 'PL', 'new york': 'US', nyc: 'US', 'los angeles': 'US', la: 'US', miami: 'US', chicago: 'US', usa: 'US', dubai: 'AE', copenhagen: 'DK', københavn: 'DK', stockholm: 'SE', oslo: 'NO', prague: 'CZ', praha: 'CZ', budapest: 'HU', athens: 'GR', monaco: 'MC', luxembourg: 'LU' }
const LANG_LAND: Record<string, string> = { de: 'DE', fr: 'FR', it: 'IT', es: 'ES', pt: 'PT', nl: 'NL', tr: 'TR', pl: 'PL' }
export function guessLand(bio?: string | null, lang?: string | null) {
  const b = (bio || '').toLowerCase()
  const m = b.match(/(?:📍|📌|based in|from|aus|in)\s*([a-zäöüéèáàíóúç\s]{3,20})/)
  const cands = [m?.[1]?.trim() || '', ...Object.keys(CITY).filter(c => new RegExp('(^|[^a-z])' + c + '([^a-z]|$)').test(b))]
  for (const c of cands) { if (!c) continue; for (const [k, v] of Object.entries(CITY)) if (c.startsWith(k)) return v }
  const fl = (bio || '').match(/[\u{1F1E6}-\u{1F1FF}]{2}/u); if (fl) return String.fromCharCode(...[...fl[0]].map(ch => ch.codePointAt(0)! - 0x1f1e6 + 65))
  return lang ? LANG_LAND[lang] || null : null
}

export async function GET(req: NextRequest) {
  const user = await getUser(req); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const p = req.nextUrl.searchParams
  if (p.get('missing')) {
    // Creator ohne Profilabruf, sortiert nach Anzahl Kooperationen (optional nur fuer eine Marke)
    const { data, error } = await db.rpc('ads_creators_missing', { p_user: user.id, p_brand: p.get('brand') || null, p_limit: Math.min(1000, Number(p.get('limit')) || 300) })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ handles: (data || []).map((r: any) => r.handle) })
  }
  const all: any[] = []
  for (let off = 0; off < 40000; off += 1000) {
    const { data, error } = await db.from('ads_creators').select('handle, name, gender, lang, follower, land, avatar, bio, fetched_at, tier, categories').eq('user_id', user.id).order('handle').range(off, off + 999)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    all.push(...(data || [])); if (!data || data.length < 1000) break
  }
  return NextResponse.json({ creators: all })
}

// POST {mode:'recompute'}: fehlende Creator anlegen, Sprache + Geschlecht berechnen. POST {handle, gender}: manuell setzen.
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  // Import aus dem Browser (Bridge): Profil-Daten aus Instagram/TikTok
  const auth = req.headers.get('authorization')?.replace('Bearer ', '') || ''
  if (process.env.ADS_CRON_KEY && auth === process.env.ADS_CRON_KEY && Array.isArray(b.creators)) {
    const userId = String(b.user_id || ''); if (!userId) return NextResponse.json({ error: 'user_id fehlt' }, { status: 400 })
    const now = new Date().toISOString()
    const rows = b.creators.filter((c: any) => c && c.handle).map((c: any) => {
      const bio = c.bio ? String(c.bio).slice(0, 1000) : null
      const g = /\b(she|her|sie|ihr|elle|ella|lei|mama|mutter|mom|wife|frau)\b/i.test(bio || '') ? 'w' : /\b(he|him|er|ihm|il|lui|papa|vater|dad|husband|mann)\b/i.test(bio || '') ? 'm' : null
      const gIn = c.gender === 'female' || c.gender === 'w' ? 'w' : c.gender === 'male' || c.gender === 'm' ? 'm' : null
      const tier = c.tier || c.size ? String(c.tier || c.size).toUpperCase().slice(0, 10) : null
      return { user_id: userId, handle: String(c.handle).replace(/^@/, '').toLowerCase(), name: c.name ? String(c.name).slice(0, 200) : undefined, bio, follower: Number.isFinite(Number(c.follower)) && c.follower != null ? Math.round(Number(c.follower)) : null, avatar: c.avatar ? String(c.avatar).slice(0, 2000) : null, land: c.land ? String(c.land).slice(0, 2).toUpperCase() : guessLand(bio, c.lang || null), lang: c.lang ? String(c.lang).slice(0, 5).toLowerCase() : undefined, tier, categories: Array.isArray(c.categories) ? c.categories.slice(0, 5) : undefined, fetched_at: c.source === 'linkster' ? undefined : now, updated_at: now, ...(gIn ? { gender: gIn, gender_src: c.source || 'import' } : g ? { gender: g, gender_src: 'bio' } : {}) }
    })
    let saved = 0
    for (let i = 0; i < rows.length; i += 100) {
      // vorhandene Werte (Sprache, manuelles Geschlecht) nicht ueberschreiben
      const { data: ex } = await db.from('ads_creators').select('handle, gender, gender_src, lang, name').eq('user_id', userId).in('handle', rows.slice(i, i + 100).map((r: any) => r.handle))
      const exm = new Map((ex || []).map(e => [e.handle, e]))
      const batch = rows.slice(i, i + 100).map((r: any) => { const e = exm.get(r.handle); const out: any = { ...r }; for (const k of Object.keys(out)) if (out[k] === undefined) delete out[k]; if (!out.name) out.name = e?.name || r.handle; if (e?.gender_src === 'manual') { delete out.gender; delete out.gender_src } else if (!out.gender && e?.gender) { out.gender = e.gender; out.gender_src = e.gender_src } if (!out.lang && e?.lang) out.lang = e.lang; if (!out.land && (out.lang || e?.lang)) out.land = guessLand(out.bio, out.lang || e?.lang); return out })
      const { error } = await db.from('ads_creators').upsert(batch, { onConflict: 'user_id,handle' })
      if (!error) saved += batch.length
    }
    return NextResponse.json({ ok: true, saved })
  }
  const user = await getUser(req); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (b.handle && (b.gender === 'w' || b.gender === 'm' || b.gender === null)) {
    const { error } = await db.from('ads_creators').upsert({ user_id: user.id, handle: String(b.handle).toLowerCase(), gender: b.gender, gender_src: 'manual', updated_at: new Date().toISOString() }, { onConflict: 'user_id,handle' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }
  if (b.mode === 'recompute') {
    // 1) fehlende Creator + Sprache per SQL-Funktion
    await db.rpc('ads_creators_refresh', { p_user: user.id }).then(() => null, () => null)
    // 2) Geschlecht aus Namen fuer alle ohne manuelle Angabe
    let updated = 0
    for (let off = 0; off < 40000; off += 1000) {
      const { data } = await db.from('ads_creators').select('handle, name, gender, gender_src').eq('user_id', user.id).order('handle').range(off, off + 999)
      if (!data?.length) break
      const rows = data.filter(c => c.gender_src !== 'manual').map(c => ({ user_id: user.id, handle: c.handle, name: c.name, gender: guessGender(c.name, c.handle), gender_src: 'name', updated_at: new Date().toISOString() })).filter(x => x.gender && x.gender !== data.find(d => d.handle === x.handle)?.gender)
      for (let i = 0; i < rows.length; i += 500) { const { error } = await db.from('ads_creators').upsert(rows.slice(i, i + 500), { onConflict: 'user_id,handle' }); if (!error) updated += Math.min(500, rows.length - i) }
      if (data.length < 1000) break
    }
    return NextResponse.json({ ok: true, updated })
  }
  return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })
}
