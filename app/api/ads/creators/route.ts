import { NextRequest, NextResponse } from 'next/server'
import { db, getUser } from '@/lib/ads'
import { guessGender } from '@/lib/gender'

export const maxDuration = 60

// Creator-Stammdaten zu den Kooperationen: Geschlecht (aus Vorname), Sprache (aus Captions), spaeter Bio/Follower aus Profilabruf.
export async function GET(req: NextRequest) {
  const user = await getUser(req); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const all: any[] = []
  for (let off = 0; off < 40000; off += 1000) {
    const { data, error } = await db.from('ads_creators').select('handle, name, gender, lang, follower, land, avatar, bio, fetched_at').eq('user_id', user.id).order('handle').range(off, off + 999)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    all.push(...(data || [])); if (!data || data.length < 1000) break
  }
  return NextResponse.json({ creators: all })
}

// POST {mode:'recompute'}: fehlende Creator anlegen, Sprache + Geschlecht berechnen. POST {handle, gender}: manuell setzen.
export async function POST(req: NextRequest) {
  const user = await getUser(req); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = await req.json().catch(() => ({}))
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
