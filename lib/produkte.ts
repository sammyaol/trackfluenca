export type GalerieItem = {
  id: string            // intern eindeutig (shopify-id oder uuid)
  title: string
  price?: string | null
  images: string[]      // 1. Bild = Produktbild, weitere = getragen etc.
  url?: string | null
  varianten?: string[]
  hinweis?: string | null
  custom?: boolean
  hidden?: boolean   // im Pool behalten, aber nicht anzeigen
}
export type Sprache = 'de' | 'en'
export type Galerie = {
  id?: string
  token?: string
  sprache?: Sprache
  label?: string | null
  titel: string
  beschreibung?: string | null
  max_auswahl?: number | null
  whatsapp?: string | null
  items: GalerieItem[]
  status?: 'aktiv' | 'geschlossen'
  created_at?: string
}
export type Wunsch = { id: string; code?: string | null; creator_name?: string | null; kontakt?: string | null; nachricht?: string | null; auswahl: string[]; created_at: string }

const TOKEN_CHARS = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function genToken(len = 20) {
  const b = new Uint8Array(len); crypto.getRandomValues(b)
  let s = ''; for (const x of b) s += TOKEN_CHARS[x % TOKEN_CHARS.length]; return s
}
export function cleanItems(v: unknown): GalerieItem[] {
  if (!Array.isArray(v)) return []
  return v.slice(0, 200).map((it: any) => ({
    id: String(it?.id ?? '').slice(0, 80),
    title: String(it?.title ?? '').slice(0, 200),
    price: it?.price != null && it.price !== '' ? String(it.price).slice(0, 20) : null,
    images: (Array.isArray(it?.images) ? it.images : []).map((u: unknown) => String(u ?? '')).filter((u: string) => /^https?:\/\//.test(u)).slice(0, 10),
    url: it?.url ? String(it.url).slice(0, 500) : null,
    varianten: (Array.isArray(it?.varianten) ? it.varianten : []).map((x: unknown) => String(x ?? '').slice(0, 40)).filter(Boolean).slice(0, 12),
    hinweis: it?.hinweis ? String(it.hinweis).slice(0, 300) : null,
    custom: !!it?.custom,
    hidden: !!it?.hidden,
  })).filter(it => it.id && it.title)
}
export const fmtPreis = (p?: string | null) => p == null || p === '' || isNaN(Number(p)) ? '' : Number(p).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })

export const UI: Record<Sprache, Record<string, string>> = {
  de: { loading: 'Lädt…', notFound: 'Link nicht gefunden', notFoundText: 'Dieser Link ist ungültig oder nicht mehr aktiv.', closed: 'Diese Auswahl ist geschlossen.', select: 'Auswählen', selected: 'Ausgewählt', pick: 'Produkte auswählen', next: 'Weiter', chosen: 'Deine Auswahl', close: 'Schließen', remove: 'entfernen', name: 'Dein Name *', contact: 'Instagram oder E-Mail (optional)', contactPh: '@deinname', message: 'Nachricht (optional, z. B. Größe oder Farbe)', send: 'Auswahl senden', sending: 'Wird gesendet…', sent: 'Gesendet', thanks: 'Danke', thanksText: 'Wir haben deine Auswahl erhalten und melden uns bei dir.', errName: 'Bitte gib deinen Namen ein.', errMin: 'Bitte wähle mindestens ein Produkt.', errFirst: 'Wähle zuerst mindestens ein Produkt.', errMax: 'Du kannst maximal {n} Produkte auswählen.', errSend: 'Senden fehlgeschlagen.', errNet: 'Keine Verbindung. Bitte nochmal versuchen.', product: 'Produkt', products: 'Produkte', create: 'Link erstellen', creating: 'Einen Moment…', linkHead: 'Hey, hier ist dein Link für deine Produkte.', linkText: 'Schick uns den Link einfach per WhatsApp und wir kümmern uns dann darum.', copyLink: 'Link kopieren', copied: 'Kopiert', waBtn: 'Per WhatsApp schicken', waMsg: 'Hey, hier ist meine Produktauswahl: {url}', copyList: 'Liste kopieren' },
  en: { loading: 'Loading…', notFound: 'Link not found', notFoundText: 'This link is invalid or no longer active.', closed: 'This selection is closed.', select: 'Select', selected: 'Selected', pick: 'Select products', next: 'Continue', chosen: 'Your selection', close: 'Close', remove: 'remove', name: 'Your name *', contact: 'Instagram or email (optional)', contactPh: '@yourname', message: 'Message (optional, e.g. size or colour)', send: 'Send selection', sending: 'Sending…', sent: 'Sent', thanks: 'Thank you', thanksText: 'We have received your selection and will get back to you.', errName: 'Please enter your name.', errMin: 'Please select at least one product.', errFirst: 'Select at least one product first.', errMax: 'You can select up to {n} products.', errSend: 'Sending failed.', errNet: 'No connection. Please try again.', product: 'product', products: 'products', create: 'Create link', creating: 'One moment…', linkHead: 'Hey, here is the link to your products.', linkText: 'Just send us the link via WhatsApp and we will take care of the rest.', copyLink: 'Copy link', copied: 'Copied', waBtn: 'Send via WhatsApp', waMsg: 'Hey, here is my product selection: {url}', copyList: 'Copy list' },
}

export const cleanWhatsapp = (v: unknown) => { const d = String(v || '').replace(/[^\d]/g, '').replace(/^00/, ''); return d.length >= 8 && d.length <= 16 ? d : null }
