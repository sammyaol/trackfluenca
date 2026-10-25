// Gemeinsame Vertragslogik fuer die interne Seite (/vertraege) und die
// oeffentliche Unterschriftsseite (/v/[token]). Beide rendern die Klauseln
// aus denselben Feldern, damit der Creator exakt das sieht, was intern
// angelegt wurde. Nach der Unterschrift sind die Felder gesperrt (API).

export type Vertrag = {
  id?: string
  created_at?: string
  token?: string
  creator_id?: string | null
  firma_name?: string | null
  firma_adresse?: string | null
  creator_name: string
  creator_handle?: string | null
  inhalte?: string | null
  plattform?: string | null
  anzahl_videos?: number | null
  posting_bis?: string | null
  online_tage?: number | null
  verguetung_art: 'produkt' | 'fee' | 'beides'
  produkte?: string | null
  produktwert?: number | null
  fee?: number | null
  versand_bis?: string | null
  zahlung_tage?: number | null
  nutzungsrechte_ads?: boolean | null
  zusatz?: string | null
  status?: 'offen' | 'angesehen' | 'unterschrieben' | 'storniert'
  angesehen_am?: string | null
  unterschrieben_am?: string | null
  unterschrift_name?: string | null
  unterschrift_adresse?: string | null
  unterschrift_bild?: string | null
}

// Felder, die intern bearbeitet werden duerfen (Whitelist fuer POST/PATCH).
export const EDITABLE_FIELDS = [
  'creator_id', 'firma_name', 'firma_adresse', 'creator_name', 'creator_handle',
  'inhalte', 'plattform', 'anzahl_videos', 'posting_bis', 'online_tage',
  'verguetung_art', 'produkte', 'produktwert', 'fee', 'versand_bis',
  'zahlung_tage', 'nutzungsrechte_ads', 'zusatz',
] as const

export function pickEditable(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  for (const k of EDITABLE_FIELDS) {
    if (k in body) {
      const v = body[k]
      out[k] = v === '' ? null : v
    }
  }
  return out
}

const TOKEN_CHARS = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function genToken(len = 22) {
  const bytes = new Uint8Array(len)
  crypto.getRandomValues(bytes)
  let s = ''
  for (const b of bytes) s += TOKEN_CHARS[b % TOKEN_CHARS.length]
  return s
}

export const fmtDatum = (d?: string | null) =>
  d ? new Date(d + (d.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

export const fmtEur = (n?: number | null) =>
  n == null || isNaN(Number(n)) ? '—' : Number(n).toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 })

export const fmtZeit = (d?: string | null) =>
  d ? new Date(d).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' Uhr' : '—'

export type Klausel = { titel: string; absaetze: string[] }

export function klauseln(v: Vertrag): Klausel[] {
  const firma = v.firma_name || 'Koluré'
  const plattform = v.plattform || 'Instagram'
  const anzahl = v.anzahl_videos || 1
  const handle = v.creator_handle ? ` (${v.creator_handle})` : ''
  const mitProdukt = v.verguetung_art === 'produkt' || v.verguetung_art === 'beides'
  const mitFee = v.verguetung_art === 'fee' || v.verguetung_art === 'beides'
  const zahlTage = v.zahlung_tage ?? 14
  const onlineTage = v.online_tage ?? 30

  const list: Klausel[] = []

  list.push({
    titel: 'Vertragsparteien',
    absaetze: [
      `Diese Vereinbarung wird geschlossen zwischen ${firma}${v.firma_adresse ? ', ' + v.firma_adresse : ''} (nachfolgend „${firma}") und ${v.creator_name}${handle} (nachfolgend „Creator").`,
    ],
  })

  const inhalt = [
    `Der Creator erstellt ${anzahl === 1 ? 'ein Video' : anzahl + ' Videos'} bzw. Inhalte für ${plattform}. Art, Umfang und Ausgestaltung der Inhalte richten sich nach der Absprache, die die Parteien im Instagram-Chat getroffen haben. Diese Absprache ist Bestandteil dieser Vereinbarung.`,
  ]
  if (v.inhalte) inhalt.push(`Zusammenfassung der Absprache: ${v.inhalte}`)
  list.push({ titel: 'Inhalte', absaetze: inhalt })

  const creator = [
    `Der Creator verpflichtet sich, die vereinbarten Inhalte zu erstellen und ${v.posting_bis ? `spätestens bis zum ${fmtDatum(v.posting_bis)}` : 'innerhalb des im Instagram-Chat vereinbarten Zeitraums'} auf ${plattform} zu veröffentlichen.`,
    `Die veröffentlichten Inhalte bleiben mindestens ${onlineTage} Tage online und werden in diesem Zeitraum nicht gelöscht oder archiviert.`,
  ]
  list.push({ titel: 'Pflichten des Creators', absaetze: creator })

  const firmaPfl: string[] = []
  if (mitProdukt) {
    firmaPfl.push(
      `${firma} sendet dem Creator ${v.produkte ? 'folgende Produkte: ' + v.produkte : 'die im Instagram-Chat vereinbarten Produkte'}${v.versand_bis ? `, Versand spätestens bis zum ${fmtDatum(v.versand_bis)}` : ', zeitnah nach Unterschrift'}. Die Produkte gehen nach Veröffentlichung der Inhalte in das Eigentum des Creators über.`
    )
  }
  if (mitFee) {
    firmaPfl.push(
      `${firma} zahlt dem Creator eine Vergütung von ${fmtEur(v.fee)}. Die Zahlung erfolgt innerhalb von ${zahlTage} Tagen nach Veröffentlichung der vereinbarten Inhalte und Zugang einer ordnungsgemäßen Rechnung bzw. Zahlungsdaten.`
    )
  }
  list.push({ titel: `Pflichten von ${firma}`, absaetze: firmaPfl })

  list.push({
    titel: 'Nutzungsrechte',
    absaetze: [
      `Der Creator räumt ${firma} das einfache, zeitlich unbegrenzte Recht ein, die Inhalte auf den eigenen Kanälen von ${firma} (Social Media, Website, Newsletter) organisch zu teilen und zu reposten, unter Nennung des Creators.`,
      v.nutzungsrechte_ads
        ? `Zusätzlich darf ${firma} die Inhalte für bezahlte Werbeanzeigen (z. B. Meta/TikTok Ads, Whitelisting) nutzen.`
        : `Eine Nutzung für bezahlte Werbeanzeigen ist nur nach gesonderter Absprache erlaubt.`,
    ],
  })

  list.push({
    titel: 'Nichterfüllung',
    absaetze: [
      `Veröffentlicht der Creator die Inhalte nicht fristgerecht, setzt ${firma} eine Nachfrist von 7 Tagen. Erfolgt auch dann keine Veröffentlichung, entfällt ${mitFee ? 'der Anspruch auf die Vergütung' : 'jeder weitere Anspruch'}${mitProdukt ? ` und der Creator sendet die erhaltenen Produkte auf eigene Kosten zurück` : ''}.`,
      `Kommt ${firma} den eigenen Pflichten nicht fristgerecht nach, ist der Creator nicht zur Veröffentlichung verpflichtet, bis ${firma} nachgeholt hat.`,
    ],
  })

  if (v.zusatz) list.push({ titel: 'Zusätzliche Vereinbarungen', absaetze: [v.zusatz] })

  list.push({
    titel: 'Schlussbestimmungen',
    absaetze: [
      'Es gilt das Recht der Bundesrepublik Deutschland. Änderungen bedürfen der Textform; eine Absprache per Instagram-Nachricht genügt.',
      'Die Vereinbarung wird elektronisch unterzeichnet. Name, Unterschrift, Zeitpunkt und technische Daten der Unterzeichnung werden zu Nachweiszwecken gespeichert.',
    ],
  })

  return list
}

export function nachrichtVorlage(v: Vertrag, link: string) {
  const vorname = (v.creator_name || '').split(' ')[0] || 'du'
  return `Hey ${vorname}! 💛 Wie im Chat besprochen hier einmal unsere kurze Kooperationsvereinbarung mit allem, was wir abgesprochen haben. Bitte einmal durchlesen und direkt am Handy unterschreiben, dauert nur eine Minute:\n\n${link}\n\nDanke dir, wir freuen uns mega auf die Zusammenarbeit! ✨`
}
