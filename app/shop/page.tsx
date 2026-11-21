'use client'
// Shop-Analyse: Funnel, typische Abbruch-Muster, Auswertungen und Session-Verlauf aus dem Shopify-Pixel, mit Link zur Clarity-Aufnahme.
import Sidebar from '../components/Sidebar'
import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const CLARITY_PROJECT = 'tfeedgnn6h'
const SHOP_ADMIN = 'https://admin.shopify.com/store/s6kepz-zi'

type CartItem = { p: string | null; v: string | null; val: number | null; q: string | null }
type Session = {
  sid: string; started: string; ended: string; stage: number; pages: number; clicks: number; products_viewed: number
  cart_products: string[] | null; removed_products: string[] | null; cart_items: CartItem[] | null
  value: number | null; shipping: number | null; discount: string | null
  clarity_user: string | null; clarity_session: string | null; last_path: string | null; last_field: string | null
  searches: string[] | null; device: string | null; order_id: string | null; order_name: string | null
  source: string | null; pattern: string; is_returning: boolean; duration: number; secs_to_cart: number | null
}
type Grp = { k: string; n: number; cart: number; checkout: number; bought: number }
type Overview = {
  total: number; stages: { stage: number; n: number }[] | null; patterns: { key: string; n: number; value: number }[]
  lost_value: number; won_value: number; avg_duration_cart: number; returning_cart: number
  sources: Grp[]; devices: Grp[]; cart_products: { p: string; carts: number; checkout: number; bought: number }[]; view_products: { p: string; views: number; carts: number }[]
}
type CmpRow = { n: number; avg_value: number | null; dur: number | null; pages: number | null; prods: number | null; clicks: number | null; to_cart: number | null; cart_to_end: number | null; items: number | null; ret: number | null; mobil: number | null; code: number | null }
type Cmp = { buyers: CmpRow | null; abandoners: CmpRow | null; bought_products: { p: string; n: number }[]; buyer_sources: { k: string; n: number; v: number }[] }
type Ev = { ts: string; event: string; path: string | null; product: string | null; variant: string | null; value: number | null; discount: string | null; shipping: number | null; data: any }

const STAGES: { stage: number; label: string }[] = [
  { stage: 1, label: 'Shop besucht' }, { stage: 2, label: 'Produkt angesehen' }, { stage: 3, label: 'In den Warenkorb gelegt' },
  { stage: 5, label: 'Checkout gestartet' }, { stage: 8, label: 'Versand gewählt' }, { stage: 9, label: 'Zahlung eingegeben' }, { stage: 10, label: 'Gekauft' },
]
const RANGES: { key: string; label: string; days: number }[] = [{ key: '1', label: 'Heute', days: 1 }, { key: '7', label: '7 Tage', days: 7 }, { key: '30', label: '30 Tage', days: 30 }]
const PATTERN: Record<string, { label: string; cls: string }> = {
  warenkorb_direkt_weg: { label: 'In den Warenkorb gelegt und direkt gegangen', cls: 'bg-amber-500/15 text-amber-300' },
  warenkorb_weiter: { label: 'In den Warenkorb gelegt, weitergestöbert, dann gegangen', cls: 'bg-amber-500/15 text-amber-300' },
  warenkorb_angesehen: { label: 'Warenkorb geöffnet, nicht zur Kasse', cls: 'bg-amber-500/15 text-amber-300' },
  entfernt: { label: 'Produkt wieder aus dem Warenkorb entfernt', cls: 'bg-amber-500/15 text-amber-300' },
  checkout_sofort: { label: 'Checkout gestartet und sofort abgebrochen', cls: 'bg-red-500/15 text-red-300' },
  checkout_adresse: { label: 'Checkout abgebrochen bei der Adresse', cls: 'bg-red-500/15 text-red-300' },
  checkout_versand: { label: 'Checkout abgebrochen beim Versand', cls: 'bg-red-500/15 text-red-300' },
  checkout_zahlung: { label: 'Checkout abgebrochen bei der Zahlung', cls: 'bg-red-500/15 text-red-300' },
  checkout_nach_zahlung: { label: 'Zahlung eingegeben, nicht abgeschlossen', cls: 'bg-red-500/15 text-red-300' },
  rabattcode: { label: 'Rabattcode eingegeben, nicht gekauft', cls: 'bg-red-500/15 text-red-300' },
  gekauft: { label: 'Gekauft', cls: 'bg-emerald-500/15 text-emerald-300' },
}
const EVENT: Record<string, string> = {
  page_viewed: 'Seite geöffnet', collection_viewed: 'Kollektion angesehen', search_submitted: 'Gesucht', product_viewed: 'Produkt angesehen',
  product_added_to_cart: 'In den Warenkorb gelegt', product_removed_from_cart: 'Aus dem Warenkorb entfernt', cart_viewed: 'Warenkorb geöffnet',
  checkout_started: 'Checkout gestartet', checkout_contact_info_submitted: 'Kontaktdaten eingegeben', checkout_address_info_submitted: 'Adresse eingegeben',
  checkout_shipping_info_submitted: 'Versand gewählt', payment_info_submitted: 'Zahlung eingegeben', checkout_completed: 'Gekauft',
  clicked: 'Klick', input_focused: 'Feld angeklickt', form_submitted: 'Formular abgeschickt',
}
const SORTS: [string, string][] = [['zeit', 'Neueste zuerst'], ['wert', 'Höchster Warenwert'], ['dauer', 'Längste Dauer'], ['seiten', 'Meiste Seiten'], ['klicks', 'Meiste Klicks']]

const pat = (k: string) => PATTERN[k] || { label: k, cls: 'bg-white/10 text-ink-2' }
const zeit = (d: string) => new Date(d).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
const uhr = (d: string) => new Date(d).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
const dauer = (s: number | null) => { if (s === null || s === undefined) return ''; if (s < 60) return s + ' Sek.'; const m = Math.floor(s / 60); return m + ' Min. ' + (s % 60) + ' Sek.' }
const euro = (v: number | null) => v === null || v === undefined ? '' : Number(v).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
const pct = (a: number, b: number) => b ? (a / b * 100).toFixed(a / b < 0.1 ? 1 : 0) + ' %' : '–'
const aufnahme = (s: Session) => s.clarity_user && s.clarity_session ? `https://clarity.microsoft.com/player/${CLARITY_PROJECT}/${s.clarity_user}/${s.clarity_session}` : null
const card = 'bg-surface-3/40 rounded-apple-md border border-hairline-soft p-5'
const sel = 'bg-surface-2 border border-hairline rounded-apple-sm text-ink-2 text-xs px-2 py-1.5'

export default function ShopPage() {
  const [range, setRange] = useState('7')
  const [ov, setOv] = useState<Overview | null>(null)
  const [cmp, setCmp] = useState<Cmp | null>(null)
  const [list, setList] = useState<{ count: number; sessions: Session[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fPattern, setFPattern] = useState('')
  const [fProduct, setFProduct] = useState('')
  const [fSource, setFSource] = useState('')
  const [fDevice, setFDevice] = useState('')
  const [fMin, setFMin] = useState('')
  const [sort, setSort] = useState('zeit')
  const [open, setOpen] = useState<string | null>(null)
  const [timeline, setTimeline] = useState<Record<string, Ev[]>>({})

  const span = useCallback(() => {
    const days = RANGES.find(r => r.key === range)?.days || 7
    const to = new Date(); const from = new Date(); from.setHours(0, 0, 0, 0); from.setDate(from.getDate() - (days - 1))
    return { p_from: from.toISOString(), p_to: to.toISOString() }
  }, [range])

  const loadOv = useCallback(async () => {
    setLoading(true); setError('')
    const { data, error: e } = await sb.rpc('shop_overview', span())
    if (e) setError(e.message); else setOv(data as Overview)
    const c = await sb.rpc('shop_compare', span())
    if (!c.error) setCmp(c.data as Cmp)
    setLoading(false)
  }, [span])
  const loadList = useCallback(async () => {
    const min = parseFloat(fMin.replace(',', '.'))
    const { data, error: e } = await sb.rpc('shop_sessions', { ...span(), p_pattern: fPattern || null, p_product: fProduct || null, p_source: fSource || null, p_device: fDevice || null, p_min_value: Number.isFinite(min) ? min : null, p_sort: sort, p_limit: 200 })
    if (e) setError(e.message); else setList(data as { count: number; sessions: Session[] })
  }, [span, fPattern, fProduct, fSource, fDevice, fMin, sort])
  useEffect(() => { loadOv() }, [loadOv])
  useEffect(() => { const t = setTimeout(loadList, 250); return () => clearTimeout(t) }, [loadList])

  const toggle = async (sid: string) => {
    if (open === sid) { setOpen(null); return }
    setOpen(sid)
    if (!timeline[sid]) { const { data } = await sb.rpc('shop_session', { p_sid: sid }); setTimeline(t => ({ ...t, [sid]: (data as Ev[]) || [] })) }
  }
  const count = (stage: number) => ov?.stages?.find(x => x.stage === stage)?.n || 0
  const top = count(1)
  const cartN = count(3)
  const reset = () => { setFPattern(''); setFProduct(''); setFSource(''); setFDevice(''); setFMin('') }
  const hasFilter = !!(fPattern || fProduct || fSource || fDevice || fMin)

  const evText = (e: Ev) => {
    const el = e.data?.el
    if (e.event === 'clicked') return el ? [el.href, el.name, el.id].filter(Boolean)[0] || (el.tag || '').toLowerCase() : ''
    if (e.event === 'input_focused' || e.event === 'form_submitted') return el ? [el.name, el.id].filter(Boolean)[0] || '' : ''
    if (e.event === 'search_submitted') return e.data?.q ? `„${e.data.q}“` : ''
    if (e.product) return e.product + (e.variant && e.variant !== 'Default Title' ? ' · ' + e.variant : '') + (e.value !== null && e.event !== 'product_viewed' ? ' · ' + euro(e.value) : '')
    if (e.event.startsWith('checkout') || e.event === 'payment_info_submitted' || e.event === 'cart_viewed') return [e.value !== null ? euro(e.value) : '', e.shipping !== null ? 'Versand ' + euro(e.shipping) : '', e.discount ? 'Code ' + e.discount : ''].filter(Boolean).join(' · ')
    return e.path || ''
  }
  const strong = (ev: string) => !['page_viewed', 'collection_viewed', 'clicked', 'input_focused', 'form_submitted', 'product_viewed', 'search_submitted'].includes(ev)

  return (
    <div className="flex min-h-screen bg-surface-0">
      <Sidebar />
      <main className="flex-1 md:ml-60 min-h-screen min-w-0">
        <div className="glass-top px-8 py-5 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-ink-1 font-semibold text-lg tracking-tight">Shop-Analyse</h1>
            <p className="text-ink-3 text-xs mt-0.5">Wo Besucher im Shop aussteigen und was sie davor gemacht haben</p>
          </div>
          <div className="flex items-center gap-1.5">
            {RANGES.map(r => <button key={r.key} onClick={() => setRange(r.key)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${range === r.key ? 'border-accent text-accent' : 'border-hairline text-ink-3 hover:text-ink-1'}`}>{r.label}</button>)}
            <button onClick={() => { loadOv(); loadList() }} className="text-xs px-3 py-1.5 rounded-full border border-hairline text-ink-3 hover:text-ink-1">Aktualisieren</button>
          </div>
        </div>

        <div className="px-8 py-6 space-y-5">
          {error && <div className="text-red-300 text-xs bg-red-500/10 border border-red-500/20 rounded-apple-sm px-3 py-2">Daten konnten nicht geladen werden: {error}</div>}
          {loading && !ov && <div className="text-ink-4 text-sm">Lädt…</div>}
          {ov && !ov.total && !loading && (
            <div className={card + ' max-w-2xl'}>
              <div className="text-ink-1 text-sm font-medium mb-1">Noch keine Daten im gewählten Zeitraum</div>
              <p className="text-ink-3 text-xs leading-relaxed">Die Daten kommen aus dem Trackfluenca-Pixel im Shopify-Store (Einstellungen → Kundenereignisse).</p>
            </div>
          )}

          {ov && ov.total > 0 && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {([
                  ['Sessions', ov.total.toLocaleString('de-DE'), 'mit Cookie-Zustimmung'],
                  ['Mit Warenkorb', cartN.toLocaleString('de-DE'), pct(cartN, top) + ' der Sessions'],
                  ['Gekauft', count(10).toLocaleString('de-DE'), pct(count(10), cartN) + ' der Warenkörbe'],
                  ['Liegen geblieben', euro(ov.lost_value), 'Warenwert ohne Kauf'],
                  ['Ø Dauer mit Warenkorb', dauer(ov.avg_duration_cart), ov.returning_cart + ' Wiederkehrer'],
                ] as [string, string, string][]).map(([l, v, s]) => (
                  <div key={l} className="bg-surface-3/40 rounded-apple-md border border-hairline-soft px-4 py-3">
                    <div className="text-ink-3 text-[11px]">{l}</div>
                    <div className="text-ink-1 text-xl font-semibold tabular-nums mt-0.5">{v}</div>
                    <div className="text-ink-4 text-[10px] mt-0.5">{s}</div>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-5">
                <div className={card}>
                  <div className="text-ink-2 text-xs font-medium mb-4">Funnel</div>
                  <div className="space-y-2.5">
                    {STAGES.map((st, i) => {
                      const n = count(st.stage); const prev = i ? count(STAGES[i - 1].stage) : n
                      const w = top ? (n / top) * 100 : 0; const drop = i && prev ? Math.round((1 - n / prev) * 100) : 0
                      return (
                        <div key={st.stage} className="flex items-center gap-3">
                          <div className="w-40 text-ink-2 text-xs flex-shrink-0">{st.label}</div>
                          <div className="flex-1 h-5 bg-white/[0.04] rounded overflow-hidden"><div className="h-full rounded" style={{ width: `${Math.max(w, n ? 1 : 0)}%`, background: st.stage === 10 ? '#34d399' : '#4F7FD9' }} /></div>
                          <div className="w-12 text-right text-ink-1 text-xs font-semibold tabular-nums">{n.toLocaleString('de-DE')}</div>
                          <div className="w-20 text-right text-[11px] tabular-nums text-red-300">{i > 0 && prev > 0 ? `−${drop} %` : ''}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className={card}>
                  <div className="text-ink-2 text-xs font-medium mb-1">Was am häufigsten passiert</div>
                  <div className="text-ink-4 text-[11px] mb-3">Sessions mit Warenkorb · Klick filtert die Liste unten</div>
                  <div className="space-y-1">
                    {ov.patterns.map(p => (
                      <button key={p.key} onClick={() => setFPattern(fPattern === p.key ? '' : p.key)} className={`w-full flex items-center gap-3 text-left px-2 py-1.5 rounded hover:bg-white/[0.04] ${fPattern === p.key ? 'bg-white/[0.06]' : ''}`}>
                        <span className={`text-[11px] px-2 py-0.5 rounded flex-1 min-w-0 truncate ${pat(p.key).cls}`}>{pat(p.key).label}</span>
                        <span className="text-ink-1 text-xs font-semibold tabular-nums w-8 text-right">{p.n}</span>
                        <span className="text-ink-3 text-[11px] tabular-nums w-12 text-right">{pct(p.n, cartN)}</span>
                        <span className="text-ink-3 text-[11px] tabular-nums w-20 text-right">{euro(p.value)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className={card}>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-ink-2 text-xs font-medium">Käufe im Vergleich zu Abbrüchen</div>
                  <button onClick={() => setFPattern(fPattern === 'gekauft' ? '' : 'gekauft')} className={`text-[11px] px-2.5 py-1 rounded-full border ${fPattern === 'gekauft' ? 'border-accent text-accent' : 'border-hairline text-ink-3 hover:text-ink-1'}`}>Nur Käufe in der Liste zeigen</button>
                </div>
                <div className="text-ink-4 text-[11px] mb-3">Durchschnitt je Session mit Warenkorb</div>
                {!cmp?.buyers && <div className="text-ink-4 text-xs">Im gewählten Zeitraum gibt es noch keinen erfassten Kauf.</div>}
                {cmp?.buyers && (
                  <div className="grid lg:grid-cols-[1.4fr_1fr_1fr] gap-6">
                    <table className="w-full text-xs">
                      <thead><tr className="text-ink-4 text-[10px] text-left"><th className="font-normal pb-1.5"></th><th className="font-normal text-right text-emerald-300">Käufer</th><th className="font-normal text-right text-amber-300">Abbrecher</th></tr></thead>
                      <tbody>
                        {([
                          ['Sessions', (r: CmpRow) => String(r.n)],
                          ['Ø Warenwert', (r: CmpRow) => euro(r.avg_value)],
                          ['Ø Dauer im Shop', (r: CmpRow) => dauer(r.dur)],
                          ['Ø Seiten', (r: CmpRow) => String(r.pages ?? '–')],
                          ['Ø Produkte angesehen', (r: CmpRow) => String(r.prods ?? '–')],
                          ['Ø Produkte im Warenkorb', (r: CmpRow) => String(r.items ?? '–')],
                          ['Ø Klicks', (r: CmpRow) => String(r.clicks ?? '–')],
                          ['Ø Zeit bis zum ersten Warenkorb-Klick', (r: CmpRow) => dauer(r.to_cart)],
                          ['Ø Zeit vom Warenkorb bis zum Ende', (r: CmpRow) => dauer(r.cart_to_end)],
                          ['Anteil Handy', (r: CmpRow) => (r.mobil ?? 0) + ' %'],
                          ['Anteil Wiederkehrer', (r: CmpRow) => (r.ret ?? 0) + ' %'],
                          ['Anteil mit Rabattcode', (r: CmpRow) => (r.code ?? 0) + ' %'],
                        ] as [string, (r: CmpRow) => string][]).map(([l, f]) => (
                          <tr key={l} className="border-t border-white/[0.05]"><td className="py-1.5 text-ink-2">{l}</td><td className="text-right text-ink-1 tabular-nums">{cmp.buyers ? f(cmp.buyers) : '–'}</td><td className="text-right text-ink-3 tabular-nums">{cmp.abandoners ? f(cmp.abandoners) : '–'}</td></tr>
                        ))}
                      </tbody>
                    </table>
                    <div>
                      <div className="text-ink-3 text-[11px] mb-2">Gekaufte Produkte</div>
                      {cmp.bought_products.map(p => <div key={p.p} className="flex justify-between gap-3 text-xs py-1 border-t border-white/[0.05]"><span className="text-ink-2 truncate">{p.p}</span><span className="text-ink-1 tabular-nums">{p.n}</span></div>)}
                    </div>
                    <div>
                      <div className="text-ink-3 text-[11px] mb-2">Käufe nach Quelle</div>
                      {cmp.buyer_sources.map(g => <div key={g.k} className="flex justify-between gap-3 text-xs py-1 border-t border-white/[0.05]"><span className="text-ink-2 truncate">{g.k}</span><span className="text-ink-1 tabular-nums">{g.n} · {euro(g.v)}</span></div>)}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid lg:grid-cols-2 gap-5">
                <div className={card}>
                  <div className="text-ink-2 text-xs font-medium mb-3">Im Warenkorb, aber nicht gekauft</div>
                  <table className="w-full text-xs">
                    <thead><tr className="text-ink-4 text-[10px] text-left"><th className="font-normal pb-1.5">Produkt</th><th className="font-normal text-right">Warenkorb</th><th className="font-normal text-right">Checkout</th><th className="font-normal text-right">Gekauft</th></tr></thead>
                    <tbody>{ov.cart_products.map(p => (
                      <tr key={p.p} className="border-t border-white/[0.05] cursor-pointer hover:bg-white/[0.03]" onClick={() => setFProduct(fProduct === p.p ? '' : p.p)}>
                        <td className={`py-1.5 truncate max-w-[220px] ${fProduct === p.p ? 'text-accent' : 'text-ink-2'}`}>{p.p}</td><td className="text-right text-ink-1 tabular-nums">{p.carts}</td><td className="text-right text-ink-3 tabular-nums">{p.checkout}</td><td className="text-right text-ink-3 tabular-nums">{p.bought}</td>
                      </tr>))}</tbody>
                  </table>
                </div>
                <div className={card}>
                  <div className="text-ink-2 text-xs font-medium mb-3">Angesehen, aber selten in den Warenkorb</div>
                  <table className="w-full text-xs">
                    <thead><tr className="text-ink-4 text-[10px] text-left"><th className="font-normal pb-1.5">Produkt</th><th className="font-normal text-right">Angesehen</th><th className="font-normal text-right">Warenkorb</th><th className="font-normal text-right">Quote</th></tr></thead>
                    <tbody>{ov.view_products.map(p => (
                      <tr key={p.p} className="border-t border-white/[0.05]">
                        <td className="py-1.5 text-ink-2 truncate max-w-[220px]">{p.p}</td><td className="text-right text-ink-1 tabular-nums">{p.views}</td><td className="text-right text-ink-3 tabular-nums">{p.carts}</td><td className="text-right text-ink-3 tabular-nums">{pct(p.carts, p.views)}</td>
                      </tr>))}</tbody>
                  </table>
                </div>
                {([['Nach Quelle', ov.sources, setFSource, fSource], ['Nach Gerät', ov.devices, setFDevice, fDevice]] as [string, Grp[], (v: string) => void, string][]).map(([title, rows, setF, cur]) => (
                  <div key={title} className={card}>
                    <div className="text-ink-2 text-xs font-medium mb-3">{title}</div>
                    <table className="w-full text-xs">
                      <thead><tr className="text-ink-4 text-[10px] text-left"><th className="font-normal pb-1.5"></th><th className="font-normal text-right">Sessions</th><th className="font-normal text-right">Warenkorb</th><th className="font-normal text-right">Checkout</th><th className="font-normal text-right">Gekauft</th><th className="font-normal text-right">Kaufquote</th></tr></thead>
                      <tbody>{rows.map(g => (
                        <tr key={g.k} className="border-t border-white/[0.05] cursor-pointer hover:bg-white/[0.03]" onClick={() => setF(cur === g.k ? '' : g.k)}>
                          <td className={`py-1.5 ${cur === g.k ? 'text-accent' : 'text-ink-2'}`}>{g.k}</td><td className="text-right text-ink-1 tabular-nums">{g.n}</td><td className="text-right text-ink-3 tabular-nums">{g.cart} · {pct(g.cart, g.n)}</td><td className="text-right text-ink-3 tabular-nums">{g.checkout}</td><td className="text-right text-ink-3 tabular-nums">{g.bought}</td><td className="text-right text-ink-3 tabular-nums">{pct(g.bought, g.n)}</td>
                        </tr>))}</tbody>
                    </table>
                  </div>
                ))}
              </div>

              <div className={card}>
                <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                  <div className="text-ink-2 text-xs font-medium">Sessions mit Warenkorb oder Checkout <span className="text-ink-4 font-normal">· {list ? list.count : 0} Treffer{list && list.count > list.sessions.length ? `, ${list.sessions.length} angezeigt` : ''}</span></div>
                  <div className="flex gap-1.5 flex-wrap items-center">
                    <select value={fPattern} onChange={e => setFPattern(e.target.value)} className={sel}>
                      <option value="">Käufe und Abbrüche</option><option value="abbruch">Nur Abbrüche</option><option value="warenkorb">Im Warenkorb abgebrochen</option><option value="checkout">Im Checkout abgebrochen</option>
                      {Object.entries(PATTERN).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <select value={fProduct} onChange={e => setFProduct(e.target.value)} className={sel}><option value="">Alle Produkte</option>{ov.cart_products.map(p => <option key={p.p} value={p.p}>{p.p}</option>)}</select>
                    <select value={fSource} onChange={e => setFSource(e.target.value)} className={sel}><option value="">Alle Quellen</option>{ov.sources.map(g => <option key={g.k} value={g.k}>{g.k}</option>)}</select>
                    <select value={fDevice} onChange={e => setFDevice(e.target.value)} className={sel}><option value="">Alle Geräte</option>{ov.devices.map(g => <option key={g.k} value={g.k}>{g.k}</option>)}</select>
                    <input value={fMin} onChange={e => setFMin(e.target.value)} placeholder="ab € Warenwert" className={sel + ' w-28'} />
                    <select value={sort} onChange={e => setSort(e.target.value)} className={sel}>{SORTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                    {hasFilter && <button onClick={reset} className="text-[11px] text-ink-3 hover:text-ink-1 px-1">Filter zurücksetzen</button>}
                  </div>
                </div>
                {list && !list.sessions.length && <div className="text-ink-4 text-xs">Keine Sessions für diese Filter.</div>}
                <div className="divide-y divide-white/[0.05]">
                  {(list?.sessions || []).map(s => {
                    const p = pat(s.pattern); const link = aufnahme(s); const isOpen = open === s.sid; const tl = timeline[s.sid]
                    return (
                      <div key={s.sid} className="py-3">
                        <div className="flex items-start gap-4 cursor-pointer" onClick={() => toggle(s.sid)}>
                          <div className="w-24 flex-shrink-0">
                            <div className="text-ink-1 text-xs tabular-nums">{zeit(s.ended)}</div>
                            <div className="text-ink-4 text-[10px]">{s.device || 'unbekannt'} · {s.source || 'direkt'}</div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className={`inline-block text-[11px] px-2 py-0.5 rounded ${p.cls}`}>{p.label}</span>
                            {s.is_returning && <span className="ml-2 text-[10px] text-ink-3 border border-hairline rounded px-1.5 py-0.5">Wiederkehrer</span>}
                            {s.order_id && <a href={`${SHOP_ADMIN}/orders/${s.order_id}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="ml-2 text-[11px] text-accent hover:underline">{s.order_name ? `Bestellung ${s.order_name}` : 'Bestellung öffnen'}</a>}
                            <div className="text-ink-2 text-xs mt-1.5 truncate">{(s.cart_products || []).join(' · ') || 'Produkt unbekannt'}</div>
                            <div className="text-ink-4 text-[11px] mt-0.5">
                              {dauer(s.duration)} im Shop · {s.pages} Seiten · {s.products_viewed} Produkte angesehen{s.clicks ? ` · ${s.clicks} Klicks` : ''}
                              {s.secs_to_cart !== null ? ` · erster Warenkorb-Klick nach ${dauer(s.secs_to_cart)}` : ''}
                              {s.discount ? ` · Rabattcode: ${s.discount}` : ''}{s.shipping !== null && s.shipping !== undefined ? ` · Versand: ${euro(s.shipping)}` : ''}
                            </div>
                          </div>
                          <div className="w-20 text-right flex-shrink-0 text-ink-1 text-xs font-semibold tabular-nums">{euro(s.value)}</div>
                          <div className="w-32 text-right flex-shrink-0">
                            {link ? <a href={link} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="inline-block text-[11px] px-2.5 py-1 rounded-full border border-accent text-accent hover:bg-white/[0.04]">Aufnahme ansehen</a> : <span className="text-ink-4 text-[11px]">keine Aufnahme</span>}
                          </div>
                          <div className="w-4 text-ink-4 text-xs flex-shrink-0">{isOpen ? '▾' : '▸'}</div>
                        </div>
                        {isOpen && (
                          <div className="mt-3 ml-28 grid lg:grid-cols-[1fr_280px] gap-5">
                            <div>
                              <div className="text-ink-3 text-[11px] mb-2">Verlauf</div>
                              {!tl && <div className="text-ink-4 text-xs">Lädt…</div>}
                              {tl && tl.map((e, i) => {
                                const gap = i ? Math.round((new Date(e.ts).getTime() - new Date(tl[i - 1].ts).getTime()) / 1000) : 0
                                return (
                                  <div key={i} className="flex items-baseline gap-3 py-0.5">
                                    <span className="w-16 text-ink-4 text-[10px] tabular-nums flex-shrink-0">{uhr(e.ts)}</span>
                                    <span className="w-14 text-ink-4 text-[10px] tabular-nums flex-shrink-0 text-right">{i && gap >= 2 ? '+' + dauer(gap) : ''}</span>
                                    <span className={`text-xs flex-shrink-0 ${strong(e.event) ? 'text-ink-1 font-medium' : 'text-ink-3'}`}>{EVENT[e.event] || e.event}</span>
                                    <span className="text-ink-3 text-[11px] truncate">{evText(e)}</span>
                                  </div>
                                )
                              })}
                              {tl && tl.length > 0 && s.stage < 10 && <div className="flex items-baseline gap-3 py-0.5"><span className="w-16" /><span className="w-14" /><span className="text-xs text-red-300">Danach keine Aktivität mehr</span></div>}
                            </div>
                            <div>
                              <div className="text-ink-3 text-[11px] mb-2">Warenkorb</div>
                              {(s.cart_items || []).map((c, i) => (
                                <div key={i} className="flex justify-between gap-3 text-xs py-0.5"><span className="text-ink-2 truncate">{c.q && c.q !== '1' ? c.q + '× ' : ''}{c.p}{c.v && c.v !== 'Default Title' ? ' · ' + c.v : ''}</span><span className="text-ink-3 tabular-nums flex-shrink-0">{euro(c.val)}</span></div>
                              ))}
                              {(s.removed_products || []).length > 0 && <div className="text-ink-4 text-[11px] mt-2">Wieder entfernt: {(s.removed_products || []).join(', ')}</div>}
                              {(s.searches || []).length > 0 && <div className="text-ink-4 text-[11px] mt-2">Gesucht: {(s.searches || []).join(', ')}</div>}
                              {s.last_field && <div className="text-ink-4 text-[11px] mt-2">Letztes angeklicktes Feld: {s.last_field}</div>}
                              {s.last_path && <div className="text-ink-4 text-[11px] mt-2">Zuletzt auf: {s.last_path}</div>}
                            </div>
                          </div>
                        )}
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
