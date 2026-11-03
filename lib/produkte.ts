export type GalerieItem = {
  id: string            // intern eindeutig (shopify-id oder uuid)
  title: string
  price?: string | null
  images: string[]      // 1. Bild = Produktbild, weitere = getragen etc.
  url?: string | null
  varianten?: string[]
  hinweis?: string | null
  custom?: boolean
}
export type Galerie = {
  id?: string
  token?: string
  titel: string
  beschreibung?: string | null
  max_auswahl?: number | null
  items: GalerieItem[]
  status?: 'aktiv' | 'geschlossen'
  created_at?: string
}
export type Wunsch = { id: string; creator_name: string; kontakt?: string | null; nachricht?: string | null; auswahl: string[]; created_at: string }

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
  })).filter(it => it.id && it.title)
}
export const fmtPreis = (p?: string | null) => p == null || p === '' || isNaN(Number(p)) ? '' : Number(p).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
