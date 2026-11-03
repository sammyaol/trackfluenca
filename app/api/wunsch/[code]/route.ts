import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const preferredRegion = ['fra1']
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
type Ctx = { params: Promise<{ code: string }> }

// Oeffentlich: eine abgeschickte Auswahl per Link anschauen (Link wird von der Creatorin an Kolure geschickt)
export async function GET(_req: NextRequest, ctx: Ctx) {
  const { code } = await ctx.params
  if (!/^[A-Z0-9]{6,12}$/.test(code)) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  const { data: w } = await db.from('produkt_wuensche').select('id, code, creator_name, kontakt, nachricht, auswahl, created_at, galerie_id').eq('code', code).maybeSingle()
  if (!w) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  const { data: g } = await db.from('produkt_galerien').select('titel, label, sprache, items').eq('id', w.galerie_id).maybeSingle()
  const items = ((g?.items as any[]) || []).filter(i => (w.auswahl as string[]).includes(i.id))
  return NextResponse.json({ code: w.code, creator_name: w.creator_name, kontakt: w.kontakt, nachricht: w.nachricht, created_at: w.created_at, sprache: g?.sprache || 'de', galerie: g?.titel || g?.label || '', items }, { headers: { 'Cache-Control': 'no-store' } })
}
