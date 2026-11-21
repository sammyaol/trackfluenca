'use client'
// Shop-Analyse: Funnel aus dem Shopify-Pixel (Produkt -> Warenkorb -> Checkout -> Kauf) mit Link zur Clarity-Aufnahme.
import Sidebar from '../components/Sidebar'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const CLARITY_PROJECT = 'tfeedgnn6h'

type Session = {
  sid: string; started: string; ended: string; stage: number; pages: number; products_viewed: number
  cart_products: string[] | null; value: number | null; shipping: number | null; discount: string | null
  clarity_user: string | null; clarity_session: string | null; last_path: string | null; last_event: string | null
  referrer: string | null; first_url: string | null; device: string | null; order_id: string | null
}
type Funnel = { total: number; stages: { stage: number; n: number }[] | null; ended_at: { stage: number; n: number }[] | null; sessions: Session[] }

const STAGES: { stage: number; label: string }[] = [
  { stage: 1, label: 'Shop besucht' },
  { stage: 2, label: 'Produkt angesehen' },
  { stage: 3, label: 'In den Warenkorb gelegt' },
  { stage: 5, label: 'Checkout gestartet' },
  { stage: 8, label: 'Versand gewählt' },
  { stage: 9, label: 'Zahlung eingegeben' },
  { stage: 10, label: 'Gekauft' },
]
const RANGES: { key: string; label: string; days: number }[] = [{ key: '1', label: 'Heute', days: 1 }, { key: '7', label: '7 Tage', days: 7 }, { key: '30', label: '30 Tage', days: 30 }]
type Filter = 'alle' | 'warenkorb' | 'checkout' | 'gekauft'

const status = (s: Session): { label: string; cls: string; group: Filter } => {
  if (s.stage >= 10) return { label: 'Gekauft', cls: 'bg-emerald-500/15 text-emerald-300', group: 'gekauft' }
  if (s.stage === 9) return { label: 'Checkout abgebrochen · nach Zahlungseingabe', cls: 'bg-red-500/15 text-red-300', group: 'checkout' }
  if (s.stage === 8) return { label: 'Checkout abgebrochen · bei der Zahlung', cls: 'bg-red-500/15 text-red-300', group: 'checkout' }
  if (s.stage === 7) return { label: 'Checkout abgebrochen · beim Versand', cls: 'bg-red-500/15 text-red-300', group: 'checkout' }
  if (s.stage === 6) return { label: 'Checkout abgebrochen · bei der Adresse', cls: 'bg-red-500/15 text-red-300', group: 'checkout' }
  if (s.stage === 5) return { label: 'Checkout abgebrochen · gleich am Anfang', cls: 'bg-red-500/15 text-red-300', group: 'checkout' }
  if (s.stage === 4) return { label: 'Warenkorb angesehen, nicht zur Kasse', cls: 'bg-amber-500/15 text-amber-300', group: 'warenkorb' }
  return { label: 'In den Warenkorb gelegt, nicht weiter', cls: 'bg-amber-500/15 text-amber-300', group: 'warenkorb' }
}
const zeit = (d: string) => new Date(d).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
const dauer = (a: string, b: string) => { const m = Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000); return m < 1 ? '< 1 Min.' : m + ' Min.' }
const euro = (v: number | null) => v === null || v === undefined ? '' : Number(v).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
const quelle = (s: Session) => {
  try { const u = new URL(s.first_url || ''); const utm = u.searchParams.get('utm_source'); if (utm) return utm; if (u.searchParams.get('fbclid')) return 'Meta'; if (u.searchParams.get('ttclid')) return 'TikTok'; if (u.searchParams.get('gclid')) return 'Google Ads' } catch { /* keine URL */ }
  try { if (s.referrer) return new URL(s.referrer).hostname.replace(/^www\./, '') } catch { /* kein Referrer */ }
  return 'direkt'
}
const aufnahme = (s: Session) => s.clarity_user && s.clarity_session ? `https://clarity.microsoft.com/player/${CLARITY_PROJECT}/${s.clarity_user}/${s.clarity_session}` : null

export default function ShopPage() {
  const [range, setRange] = useState('7')
  const [data, setData] = useState<Funnel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Filter>('alle')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    const days = RANGES.find(r => r.key === range)?.days || 7
    const to = new Date(); const from = new Date(); from.setHours(0, 0, 0, 0); from.setDate(from.getDate() - (days - 1))
    const { data: d, error: e } = await sb.rpc('shop_funnel', { p_from: from.toISOString(), p_to: to.toISOString(), p_min_stage: 3, p_limit: 300 })
    if (e) setError(e.message); else setData(d as Funnel)
    setLoading(false)
  }, [range])
  useEffect(() => { load() }, [load])

  const count = (stage: number) => data?.stages?.find(x => x.stage === stage)?.n || 0
  const sessions = useMemo(() => (data?.sessions || []).filter(s => filter === 'alle' || status(s).group === filter), [data, filter])
  const groups = useMemo(() => { const g: Record<Filter, number> = { alle: 0, warenkorb: 0, checkout: 0, gekauft: 0 }; for (const s of data?.sessions || []) { g.alle++; g[status(s).group]++ } return g }, [data])
  const top = count(1)

  return (
    <div className="flex min-h-screen bg-surface-0">
      <Sidebar />
      <main className="flex-1 md:ml-60 min-h-screen min-w-0">
        <div className="glass-top px-8 py-5 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-ink-1 font-semibold text-lg tracking-tight">Shop-Analyse</h1>
            <p className="text-ink-3 text-xs mt-0.5">Wo Besucher im Shop aussteigen: vom Produkt über den Warenkorb bis zum Kauf</p>
          </div>
          <div className="flex items-center gap-1.5">
            {RANGES.map(r => <button key={r.key} onClick={() => setRange(r.key)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${range === r.key ? 'border-accent text-accent' : 'border-hairline text-ink-3 hover:text-ink-1'}`}>{r.label}</button>)}
            <button onClick={load} className="text-xs px-3 py-1.5 rounded-full border border-hairline text-ink-3 hover:text-ink-1">Aktualisieren</button>
          </div>
        </div>

        <div className="px-8 py-6 space-y-5">
          {error && <div className="text-red-300 text-xs bg-red-500/10 border border-red-500/20 rounded-apple-sm px-3 py-2">Daten konnten nicht geladen werden: {error}</div>}
          {loading && !data && <div className="text-ink-4 text-sm">Lädt…</div>}

          {data && !data.total && !loading && (
            <div className="bg-surface-3/40 rounded-apple-md border border-hairline-soft p-6 max-w-2xl">
              <div className="text-ink-1 text-sm font-medium mb-1">Noch keine Daten im gewählten Zeitraum</div>
              <p className="text-ink-3 text-xs leading-relaxed">Die Daten kommen aus dem Trackfluenca-Pixel im Shopify-Store (Einstellungen → Kundenereignisse). Sobald es dort verbunden ist, erscheinen hier nach wenigen Minuten die ersten Sessions.</p>
            </div>
          )}

          {data && data.total > 0 && (
            <>
              <div className="bg-surface-3/40 rounded-apple-md border border-hairline-soft p-5">
                <div className="text-ink-2 text-xs font-medium mb-4">Funnel · {data.total.toLocaleString('de-DE')} Sessions</div>
                <div className="space-y-2.5">
                  {STAGES.map((st, i) => {
                    const n = count(st.stage); const prev = i ? count(STAGES[i - 1].stage) : n
                    const pct = top ? (n / top) * 100 : 0; const drop = i && prev ? Math.round((1 - n / prev) * 100) : 0
                    return (
                      <div key={st.stage} className="flex items-center gap-3">
                        <div className="w-44 text-ink-2 text-xs flex-shrink-0">{st.label}</div>
                        <div className="flex-1 h-6 bg-white/[0.04] rounded overflow-hidden"><div className="h-full rounded" style={{ width: `${Math.max(pct, n ? 1 : 0)}%`, background: st.stage === 10 ? '#34d399' : '#4F7FD9' }} /></div>
                        <div className="w-16 text-right text-ink-1 text-xs font-semibold tabular-nums">{n.toLocaleString('de-DE')}</div>
                        <div className="w-14 text-right text-ink-3 text-[11px] tabular-nums">{pct.toFixed(pct < 10 ? 1 : 0)} %</div>
                        <div className="w-24 text-right text-[11px] tabular-nums text-red-300">{i > 0 && prev > 0 ? `−${drop} % Abbruch` : ''}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-surface-3/40 rounded-apple-md border border-hairline-soft p-5">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                  <div className="text-ink-2 text-xs font-medium">Sessions mit Warenkorb oder Checkout <span className="text-ink-4 font-normal">· neueste zuerst, max. 300</span></div>
                  <div className="flex gap-1.5">
                    {([['alle', 'Alle'], ['warenkorb', 'Im Warenkorb abgebrochen'], ['checkout', 'Im Checkout abgebrochen'], ['gekauft', 'Gekauft']] as [Filter, string][]).map(([k, l]) => (
                      <button key={k} onClick={() => setFilter(k)} className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${filter === k ? 'border-accent text-accent' : 'border-hairline text-ink-3 hover:text-ink-1'}`}>{l} {groups[k]}</button>
                    ))}
                  </div>
                </div>
                {!sessions.length && <div className="text-ink-4 text-xs">Keine Sessions für diesen Filter.</div>}
                <div className="divide-y divide-white/[0.05]">
                  {sessions.map(s => {
                    const st = status(s); const link = aufnahme(s)
                    return (
                      <div key={s.sid} className="py-3 flex items-start gap-4">
                        <div className="w-24 flex-shrink-0">
                          <div className="text-ink-1 text-xs tabular-nums">{zeit(s.ended)}</div>
                          <div className="text-ink-4 text-[10px]">{dauer(s.started, s.ended)} · {s.device || 'unbekannt'}</div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className={`inline-block text-[11px] px-2 py-0.5 rounded ${st.cls}`}>{st.label}</span>
                          <div className="text-ink-2 text-xs mt-1.5 truncate">{(s.cart_products || []).join(' · ') || 'Produkt unbekannt'}</div>
                          <div className="text-ink-4 text-[11px] mt-0.5">
                            {s.pages} Seiten · {s.products_viewed} Produkte angesehen · Quelle: {quelle(s)}
                            {s.discount ? ` · Rabattcode: ${s.discount}` : ''}{s.shipping !== null && s.shipping !== undefined ? ` · Versand: ${euro(s.shipping)}` : ''}
                            {s.last_path ? ` · zuletzt auf ${s.last_path}` : ''}
                          </div>
                        </div>
                        <div className="w-24 text-right flex-shrink-0 text-ink-1 text-xs font-semibold tabular-nums">{euro(s.value)}</div>
                        <div className="w-36 text-right flex-shrink-0">
                          {link ? <a href={link} target="_blank" rel="noreferrer" className="inline-block text-[11px] px-2.5 py-1 rounded-full border border-accent text-accent hover:bg-white/[0.04]">Aufnahme ansehen</a> : <span className="text-ink-4 text-[11px]">keine Aufnahme</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
