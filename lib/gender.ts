// Geschlecht aus dem Vornamen schaetzen (Namensliste aus gender-guesser, nur eindeutige Namen aus Europa/US/TR/AR).
import names from './names.json'

const W = new Set<string>([...(names as any).w, ...(names as any).w1])
const M = new Set<string>([...(names as any).m, ...(names as any).m1])
const STRICT_W = new Set<string>((names as any).w), STRICT_M = new Set<string>((names as any).m)

const clean = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
// Kandidaten: Woerter aus dem Anzeigenamen (ohne Emojis/Zeichen), dann Handle-Bestandteile (lena.mueller → lena, mueller)
export function firstNames(name?: string | null, handle?: string | null): string[] {
  const out: string[] = []
  const push = (w: string) => { w = clean(w).replace(/[^a-z]/g, ''); if (w.length >= 2 && !out.includes(w)) out.push(w) }
  for (const w of (name || '').split(/[\s|·•,/_\-()]+/)) push(w)
  for (const w of (handle || '').split(/[._\-\d]+/)) push(w)
  // Handles ohne Trenner: laengsten Namens-Praefix suchen (z. B. "lenamueller" → "lena")
  const h = clean(handle || '').replace(/[^a-z]/g, '')
  for (let l = Math.min(10, h.length); l >= 3; l--) { const p = h.slice(0, l); if (W.has(p) || M.has(p)) { push(p); break } }
  return out
}

export function guessGender(name?: string | null, handle?: string | null): 'w' | 'm' | null {
  const cands = firstNames(name, handle)
  for (const c of cands) { if (STRICT_W.has(c)) return 'w'; if (STRICT_M.has(c)) return 'm' }
  for (const c of cands) { if (W.has(c)) return 'w'; if (M.has(c)) return 'm' }
  return null
}
