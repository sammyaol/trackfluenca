import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { klauseln } from '@/lib/vertrag'

// Oeffentliche Route fuer Creator (kein Login). Zugriff nur ueber den
// zufaelligen Token im Link. Interne Felder (user_id, creator_id, IP etc.)
// werden nie ausgeliefert.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const preferredRegion = ['fra1']

type Context = { params: Promise<{ token: string }> }

const PUBLIC_COLS =
  'created_at, sprache, klauseln_custom, firma_name, firma_adresse, creator_name, creator_handle, inhalte, plattform, anzahl_videos, posting_bis, online_tage, verguetung_art, produkte, produktwert, fee, versand_bis, zahlung_tage, nutzungsrechte_ads, zusatz, status, unterschrieben_am, unterschrift_name, unterschrift_adresse, unterschrift_bild'

const validToken = (t: string) => /^[A-Za-z0-9]{16,40}$/.test(t)

export async function GET(_req: NextRequest, ctx: Context) {
  const { token } = await ctx.params
  if (!validToken(token)) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const { data } = await supabase.from('vertraege').select('id, ' + PUBLIC_COLS).eq('token', token).maybeSingle()
  if (!data) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  const row = data as unknown as Record<string, unknown>

  // Erstes Oeffnen merken, damit intern "angesehen" angezeigt wird.
  if (row.status === 'offen') {
    await supabase.from('vertraege').update({ status: 'angesehen', angesehen_am: new Date().toISOString() }).eq('id', row.id as string).eq('status', 'offen')
    row.status = 'angesehen'
  }
  delete row.id
  return NextResponse.json(row, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(req: NextRequest, ctx: Context) {
  const { token } = await ctx.params
  if (!validToken(token)) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const name = String(body.name || '').trim().slice(0, 120)
  const adresse = String(body.adresse || '').trim().slice(0, 300)
  const bild = String(body.unterschrift || '')
  const zustimmung = body.zustimmung === true

  if (name.length < 3) return NextResponse.json({ error: 'Bitte vollständigen Namen eingeben.' }, { status: 400 })
  if (!zustimmung) return NextResponse.json({ error: 'Bitte bestätige, dass du die Vereinbarung gelesen hast.' }, { status: 400 })
  if (!bild.startsWith('data:image/png;base64,') || bild.length < 1500 || bild.length > 600_000) {
    return NextResponse.json({ error: 'Bitte unterschreibe im Feld.' }, { status: 400 })
  }

  const { data: v } = await supabase.from('vertraege').select('*').eq('token', token).maybeSingle()
  if (!v) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  if (v.status === 'unterschrieben') return NextResponse.json({ error: 'Diese Vereinbarung wurde bereits unterschrieben.' }, { status: 409 })
  if (v.status === 'storniert') return NextResponse.json({ error: 'Diese Vereinbarung ist nicht mehr gültig.' }, { status: 410 })

  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || ''
  const ua = (req.headers.get('user-agent') || '').slice(0, 400)

  const { data, error } = await supabase
    .from('vertraege')
    .update({
      status: 'unterschrieben',
      // Text zum Zeitpunkt der Unterschrift einfrieren, damit spaetere Aenderungen am Standardtext ihn nicht veraendern
      klauseln_custom: Array.isArray(v.klauseln_custom) && v.klauseln_custom.length ? v.klauseln_custom : klauseln(v as any),
      unterschrieben_am: new Date().toISOString(),
      unterschrift_name: name,
      unterschrift_adresse: adresse || null,
      unterschrift_bild: bild,
      unterschrift_ip: ip,
      unterschrift_ua: ua,
    })
    .eq('id', v.id)
    .neq('status', 'unterschrieben')
    .select(PUBLIC_COLS)
    .single()
  if (error) return NextResponse.json({ error: 'Speichern fehlgeschlagen, bitte nochmal versuchen.' }, { status: 500 })
  return NextResponse.json(data)
}
