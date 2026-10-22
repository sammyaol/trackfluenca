// Gemeinsame Typen/Helfer fuer den Postingplan (Seite + API).

export type PlanProdukt = { id: number | string; title: string; image?: string | null; price?: string | null; url?: string | null }

export type PlanPost = {
  id?: string
  created_at?: string
  creator_id?: string | null
  creator_name?: string | null
  kampagne: string
  geplant_am?: string | null
  plattform: string
  format: string
  beschreibung?: string | null
  produkte: PlanProdukt[]
  gage?: number | null
  deal_status: string
  post_status: string
  beispiel_links: string[]
  notizen?: string | null
}

export const EDITABLE = ['creator_id', 'creator_name', 'kampagne', 'geplant_am', 'plattform', 'format', 'beschreibung', 'produkte', 'gage', 'deal_status', 'post_status', 'beispiel_links', 'notizen'] as const

export const KAMPAGNEN: string[] = ['Allgemein', 'Black Week', 'Weihnachten', 'Frauen-Launch', 'Frauen-Black Week', 'Frauen-Weihnachten', 'Couple-Black Week', 'Couple-Weihnachten']
export const zeitraumFor = (k?: string | null) => { const n = (k || '').toLowerCase(); return n.includes('black week') ? 'Black Week' : n.includes('weihnacht') ? 'Weihnachten' : null }
export const PLATTFORMEN = ['Instagram', 'TikTok', 'Instagram & TikTok'] as const
export const FORMATE = ['Reel', 'TikTok-Video', 'Story', 'Foto-Post', 'Karussell'] as const
export const DEAL_STATUS = ['offen', 'angefragt', 'zugesagt', 'deal', 'abgesagt'] as const
export const POST_STATUS = ['geplant', 'briefing_raus', 'produziert', 'gepostet'] as const

export const DEAL_LABEL: Record<string, string> = { offen: 'Offen', angefragt: 'Angefragt', zugesagt: 'Zugesagt', deal: 'Deal fix', abgesagt: 'Abgesagt' }
export const POST_LABEL: Record<string, string> = { geplant: 'Geplant', briefing_raus: 'Briefing raus', produziert: 'Produziert', gepostet: 'Gepostet' }

// Aktionszeitraeume 2026 (Black Friday = 27.11., Cyber Monday = 30.11.)
export const ZEITRAEUME: Record<string, { von: string; bis: string; label: string }> = {
  'Black Week': { von: '2026-11-23', bis: '2026-11-30', label: '23.–30.11.' },
  'Weihnachten': { von: '2026-12-01', bis: '2026-12-24', label: '01.–24.12.' },
}

export function pickEditable(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  for (const k of EDITABLE) {
    if (k in body) {
      const v = body[k]
      out[k] = v === '' ? null : v
    }
  }
  if (out.gage != null) out.gage = Number(out.gage) || 0
  return out
}

export const fmtDatum = (d?: string | null) => d ? new Date(d + 'T12:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'ohne Datum'
export const fmtKurz = (d?: string | null) => d ? new Date(d + 'T12:00:00').toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' }) : 'ohne Datum'
export const fmtEur = (n?: number | null) => (Number(n) || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

export function briefingText(p: PlanPost, link?: string | null) {
  const vorname = (p.creator_name || '').trim().split(' ')[0] || 'du'
  const zeilen = [
    `Hey ${vorname}! 💛 Hier dein Briefing${p.kampagne && p.kampagne !== 'Allgemein' ? ' für ' + p.kampagne : ''}:`,
    '',
    `📅 Post: ${fmtKurz(p.geplant_am)} · ${p.format} auf ${p.plattform}`,
  ]
  if (p.beschreibung) zeilen.push('', `🎬 Was wir uns vorstellen:\n${p.beschreibung}`)
  if (p.produkte?.length) zeilen.push('', `💍 Produkte:\n${p.produkte.map(x => '• ' + x.title + (x.url ? ' – ' + x.url : '')).join('\n')}`)
  if (p.beispiel_links?.length) zeilen.push('', `✨ Inspiration:\n${p.beispiel_links.map(l => '• ' + l).join('\n')}`)
  if (link) zeilen.push('', `🔗 Dein Link:\n${link}`)
  zeilen.push('', 'Sag Bescheid, wenn du Fragen hast!')
  return zeilen.join('\n')
}
