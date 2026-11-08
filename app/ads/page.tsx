'use client'
import Sidebar from '../components/Sidebar'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { Ad, Brand } from '@/lib/ads'

const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const dat = (d?: string | null) => d ? new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''
const days = (a?: string | null, b?: string | null) => a ? Math.max(1, Math.round(((b ? new Date(b) : new Date()).getTime() - new Date(a).getTime()) / 86400000)) : 0
const iso = (d: Date) => d.toISOString().slice(0, 10)
const libUrl = (adId: string) => `https://www.facebook.com/ads/library/?id=${adId}`
const PLAT: Record<string, string> = { facebook: 'FB', instagram: 'IG', messenger: 'MSG', audience_network: 'AN', threads: 'TH' }

type Koop = { id: string; brand_id: string; creator: string; creator_handle?: string | null; creator_url?: string | null; source: string; ref: string; url?: string | null; start_date?: string | null; end_date?: string | null; media_url?: string | null; text?: string | null; platform?: string | null }
const SRC: Record<string, { label: string; color: string }> = { ad: { label: 'Partnership-Ad', color: '#e6c27a' }, branded: { label: 'Branded Content (IG)', color: '#c9b8ff' }, ig_tag: { label: 'Instagram-Tag', color: '#ff7a8a' }, tiktok: { label: 'TikTok', color: '#5ee3a3' } }
type Settings = { hasToken: boolean; tokenHint: string; countries: string[]; updated_at: string | null }
type Preset = 'all' | 'active' | '30' | '90' | 'y0' | 'y1' | 'y2' | 'y3' | 'custom'
const ANLASS: Record<string, string> = { black_week: 'Black Week', weihnachten: 'Weihnachten', valentinstag: 'Valentinstag', muttertag: 'Muttertag' }

// Filter-Zustand bleibt erhalten (Tab-Wechsel, Zurück-Navigation, Reload)
const FKEY = 'tf_ads_filters'
type Saved = { sel?: string[]; preset?: Preset; from?: string; to?: string; platform?: string; anlass?: string; type?: string; sort?: string; q?: string; view?: 'ads' | 'koops'; koopSort?: 'brands' | 'count' | 'recent'; koopMin?: 'all' | 'multi' | 'multibrand'; koopQ?: string }
const loadSaved = (): Saved => { if (typeof window === 'undefined') return {}; try { return JSON.parse(localStorage.getItem(FKEY) || '{}') } catch { return {} } }

export default function AdsPage() {
  const saved = useMemo(loadSaved, [])
  const [brands, setBrands] = useState<Brand[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [ads, setAds] = useState<Ad[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sel, setSel] = useState<string[]>(saved.sel || [])
  const [preset, setPreset] = useState<Preset>(saved.preset || 'all')
  const [from, setFrom] = useState(saved.from || ''); const [to, setTo] = useState(saved.to || '')
  const [platform, setPlatform] = useState(saved.platform || ''); const [anlass, setAnlass] = useState(saved.anlass || ''); const [type, setType] = useState(saved.type || ''); const [sort, setSort] = useState(saved.sort || 'newest')
  const [q, setQ] = useState(saved.q || ''); const [qDeb, setQDeb] = useState(saved.q || '')
  const [detail, setDetail] = useState<Ad | null>(null)
  const [setup, setSetup] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [syncMsg, setSyncMsg] = useState('')
  const [token, setToken] = useState(''); const [countries, setCountries] = useState('DE')
  const [newBrand, setNewBrand] = useState({ name: '', search_term: '', page_ids: '' })
  const [confirm, setConfirm] = useState<string | null>(null)
  const [err, setErr] = useState('')
  const [view, setView] = useState<'ads' | 'koops'>(saved.view || 'ads')
  const [koops, setKoops] = useState<Koop[]>([])
  const [koopsLoading, setKoopsLoading] = useState(false)
  const [koopCreator, setKoopCreator] = useState<string | null>(null)
  const [koopSort, setKoopSort] = useState<'brands' | 'count' | 'recent'>(saved.koopSort || 'brands')
  const [koopMin, setKoopMin] = useState<'all' | 'multi' | 'multibrand'>(saved.koopMin || 'all')
  const [koopQ, setKoopQ] = useState(saved.koopQ || '')
  const [koopShow, setKoopShow] = useState(60)
  useEffect(() => { try { localStorage.setItem(FKEY, JSON.stringify({ sel, preset, from, to, platform, anlass, type, sort, q, view, koopSort, koopMin, koopQ })) } catch {} }, [sel, preset, from, to, platform, anlass, type, sort, q, view, koopSort, koopMin, koopQ])
  useEffect(() => { setKoopShow(60) }, [koopSort, koopMin, koopQ, sel, preset, from, to])
  const [adding, setAdding] = useState<string | null>(null)
  const [addedMsg, setAddedMsg] = useState('')

  const getToken = async () => (await sb.auth.getSession()).data.session?.access_token || ''
  const api = useCallback(async (url: string, method = 'GET', body?: any) => {
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + await getToken() }, body: body ? JSON.stringify(body) : undefined })
    const j = await r.json().catch(() => ({})); return { ok: r.ok, j }
  }, [])

  const loadBrands = useCallback(async () => { const { ok, j } = await api('/api/ads/brands'); if (ok) { setBrands(j.brands); setSettings(j.settings); setCountries((j.settings.countries || ['DE']).join(', ')) } }, [api])
  useEffect(() => { loadBrands() }, [loadBrands])
  useEffect(() => { const t = setTimeout(() => setQDeb(q), 350); return () => clearTimeout(t) }, [q])

  const range = useMemo(() => {
    const now = new Date(), y = now.getFullYear()
    if (preset === '30') return { from: iso(new Date(now.getTime() - 30 * 86400000)), to: '' }
    if (preset === '90') return { from: iso(new Date(now.getTime() - 90 * 86400000)), to: '' }
    if (preset === 'y0') return { from: `${y}-01-01`, to: '' }
    if (preset === 'y1') return { from: `${y - 1}-01-01`, to: `${y - 1}-12-31` }
    if (preset === 'y2') return { from: `${y - 2}-01-01`, to: `${y - 2}-12-31` }
    if (preset === 'y3') return { from: `${y - 3}-01-01`, to: `${y - 3}-12-31` }
    if (preset === 'custom') return { from, to }
    return { from: '', to: '' }
  }, [preset, from, to])

  const query = useMemo(() => {
    const p = new URLSearchParams()
    if (sel.length) p.set('brand', sel.join(','))
    if (range.from) p.set('from', range.from); if (range.to) p.set('to', range.to)
    if (preset === 'active') p.set('status', 'active')
    if (platform) p.set('platform', platform); if (anlass) p.set('anlass', anlass); if (type) p.set('type', type); if (qDeb) p.set('q', qDeb); if (sort !== 'newest') p.set('sort', sort)
    return p.toString()
  }, [sel, range, preset, platform, anlass, type, qDeb, sort])

  const loadAds = useCallback(async (pg: number, append: boolean) => {
    setLoading(true)
    const { ok, j } = await api(`/api/ads?${query}&page=${pg}`)
    if (ok) { setAds(a => append ? [...a, ...j.ads] : j.ads); setTotal(j.total); setPage(pg) }
    setLoading(false)
  }, [api, query])
  useEffect(() => { loadAds(0, false) }, [loadAds])
  const loadKoops = useCallback(async () => {
    setKoopsLoading(true)
    const p = new URLSearchParams(); if (sel.length) p.set('brand', sel.join(',')); if (range.from) p.set('from', range.from); if (range.to) p.set('to', range.to)
    const { ok, j } = await api('/api/ads/koops?' + p.toString()); if (ok) setKoops(j.koops); setKoopsLoading(false)
  }, [api, sel, range])
  useEffect(() => { if (view === 'koops') loadKoops() }, [view, loadKoops])

  // Aggregation fuer die Zeitleiste: pro Creator alle Kooperationen, sortiert nach Anzahl
  const koopRows = useMemo(() => {
    const m = new Map<string, { creator: string; handle: string | null; url: string | null; items: Koop[]; brands: Set<string> }>()
    for (const k of koops) {
      const key = (k.creator_handle || k.creator).toLowerCase()
      const r = m.get(key) || { creator: k.creator, handle: k.creator_handle || null, url: k.creator_url || null, items: [], brands: new Set<string>() }
      r.items.push(k); r.brands.add(k.brand_id); if (!r.handle && k.creator_handle) r.handle = k.creator_handle; if (!r.url && k.creator_url) r.url = k.creator_url
      m.set(key, r)
    }
    let rows = [...m.values()]
    if (koopMin === 'multi') rows = rows.filter(r => r.items.length > 1)
    if (koopMin === 'multibrand') rows = rows.filter(r => r.brands.size > 1)
    if (koopQ.trim()) { const q = koopQ.trim().toLowerCase(); rows = rows.filter(r => r.creator.toLowerCase().includes(q) || (r.handle || '').toLowerCase().includes(q)) }
    const last = (r: { items: Koop[] }) => r.items.reduce((a, k) => (k.start_date || '') > a ? (k.start_date || '') : a, '')
    rows.sort((a, b) => {
      if (koopSort === 'brands') return b.brands.size - a.brands.size || b.items.length - a.items.length || last(b).localeCompare(last(a))
      if (koopSort === 'count') return b.items.length - a.items.length || b.brands.size - a.brands.size || last(b).localeCompare(last(a))
      return last(b).localeCompare(last(a)) || b.items.length - a.items.length
    })
    return rows
  }, [koops, koopSort, koopMin, koopQ])
  // Farbe pro Marke (stabil aus der ID), damit man in der Zeitleiste sieht, welche Marke wann gebucht hat
  const brandColor = useCallback((id: string) => { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0; return `hsl(${h % 360} 70% 62%)` }, [])
  const brandStats = useCallback((items: Koop[]) => { const m = new Map<string, number>(); for (const k of items) m.set(k.brand_id, (m.get(k.brand_id) || 0) + 1); return [...m.entries()].sort((a, b) => b[1] - a[1]) }, [])
  const spanLabel = useCallback((items: Koop[]) => { const ds = items.map(k => k.start_date).filter(Boolean).sort() as string[]; if (!ds.length) return ''; const f = (d: string) => new Date(d).toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }); const a = f(ds[0]), b = f(ds[ds.length - 1]); return a === b ? a : `${a} – ${b}` }, [])
  const postLink = (k: Koop) => k.url || (k.source === 'tiktok' && k.creator_handle ? `https://www.tiktok.com/@${k.creator_handle}` : k.creator_handle ? `https://www.instagram.com/${k.creator_handle}/` : '#')
  const profileLink = (r: { handle: string | null; url: string | null; items: Koop[] }) => r.url || (r.handle ? (r.items.some(k => k.source === 'tiktok') && !r.items.some(k => k.source !== 'tiktok') ? `https://www.tiktok.com/@${r.handle}` : `https://www.instagram.com/${r.handle}/`) : null)
  const koopSpan = useMemo(() => {
    const ds = koops.map(k => k.start_date).filter(Boolean).sort() as string[]
    const end = new Date(); end.setDate(1)
    let start = new Date(end); start.setMonth(start.getMonth() - 11)
    // Zeitachse: mindestens 12, hoechstens 24 Monate – aeltere Punkte werden am linken Rand gesammelt
    const min = new Date(end); min.setMonth(min.getMonth() - 23)
    if (ds.length) { const first = new Date(ds[0]); first.setDate(1); if (first < start) start = first < min ? min : first }
    const months: Date[] = []; const c = new Date(start); while (c <= end) { months.push(new Date(c)); c.setMonth(c.getMonth() + 1) }
    const total = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1
    const pos = (d: string) => { const x = new Date(d); const idx = (x.getFullYear() - start.getFullYear()) * 12 + (x.getMonth() - start.getMonth()) + (x.getDate() - 1) / 31; return Math.max(0, Math.min(100, (idx / total) * 100)) }
    return { months, pos }
  }, [koops])
  const addCreator = async (r: { creator: string; handle: string | null; url: string | null }) => {
    setAdding(r.creator); setAddedMsg('')
    const ig = r.handle || (r.url && /instagram\.com\/([^/?]+)/.exec(r.url)?.[1]) || (/^[a-z0-9._]+$/i.test(r.creator) ? r.creator : '')
    const { ok, j } = await api('/api/creators', 'POST', { name: r.creator, ig: ig || null, type: 'creator', notes: 'Aus Ad Library / Kooperationen übernommen' })
    setAdding(null); setAddedMsg(ok ? `${r.creator} als Creator angelegt` : (j.error || 'Fehler'))
    setTimeout(() => setAddedMsg(''), 3000)
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { setDetail(null); setSetup(false) } }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [])

  const sync = async (brandId?: string) => {
    setSyncing(brandId || 'all'); setSyncMsg(''); setErr('')
    const { ok, j } = await api('/api/ads/sync' + (brandId ? '?brand=' + brandId : ''), 'POST')
    setSyncing(null)
    if (!ok) { setErr(j.error || 'Sync fehlgeschlagen'); return }
    const parts = Object.entries(j.sync || {}).map(([k, v]: any) => typeof v === 'string' ? `${k}: ${v}` : `${k}: ${v.inserted} neu`)
    setSyncMsg(parts.join(' · ') + (j.media ? ` · Medien: ${j.media.ok} geladen` : ''))
    await loadBrands(); await loadAds(0, false)
  }
  const saveToken = async () => {
    setErr('')
    const { ok, j } = await api('/api/ads/settings', 'POST', { meta_token: token, countries })
    if (!ok) { setErr(j.error || 'Fehler'); return }
    setToken(''); await loadBrands()
  }
  const addBrand = async () => {
    if (!newBrand.name.trim()) return
    const { ok, j } = await api('/api/ads/brands', 'POST', newBrand)
    if (!ok) { setErr(j.error || 'Fehler'); return }
    setNewBrand({ name: '', search_term: '', page_ids: '' }); await loadBrands()
  }
  const patchBrand = async (id: string, body: any) => { await api('/api/ads/brands/' + id, 'PATCH', body); await loadBrands() }
  const delBrand = async (id: string) => { await api('/api/ads/brands/' + id, 'DELETE'); setSel(s => s.filter(x => x !== id)); await loadBrands(); await loadAds(0, false) }
  const twoClick = (k: string, fn: () => void) => { if (confirm === k) { setConfirm(null); fn() } else setConfirm(k) }

  const brandName = (id: string) => brands.find(b => b.id === id)?.name || ''
  const inputCls = 'w-full bg-surface-3 border border-hairline rounded-apple-sm px-3 py-2 text-ink-1 text-sm focus:outline-none focus:border-accent/40'
  const selCls = 'bg-surface-3 border border-hairline rounded-apple-sm px-3 py-2 text-ink-1 text-sm focus:outline-none focus:border-accent/40'
  const labelCls = 'text-ink-3 text-xs mb-1 block font-medium'
  const chip = (on: boolean) => `press text-xs px-3 py-1.5 rounded-full border transition ${on ? 'bg-accent text-[#1a1507] border-accent font-semibold' : 'border-hairline text-ink-3 hover:text-ink-1 hover:border-hairline-strong'}`
  const btnDel = (a: boolean) => `text-[11px] px-2 py-1 rounded whitespace-nowrap ${a ? 'bg-red-600 text-white' : 'bg-red-950/30 text-red-400 hover:bg-red-950/50'}`

  const Media = ({ a, big }: { a: Ad; big?: boolean }) => {
    if (a.media_type === 'video' && a.media_url) return <video src={a.media_url} poster={a.media_poster || undefined} controls={big} muted playsInline preload={big ? 'auto' : 'none'} className="w-full h-full object-cover bg-black" onMouseEnter={e => { if (!big) (e.currentTarget as HTMLVideoElement).play().catch(() => {}) }} onMouseLeave={e => { if (!big) { const v = e.currentTarget as HTMLVideoElement; v.pause(); v.currentTime = 0 } }} />
    if (a.media_url) return <img src={a.media_url} alt="" className={`w-full h-full ${big ? 'object-contain' : 'object-cover'}`} loading="lazy" />
    if (a.media_poster) return <img src={a.media_poster} alt="" className="w-full h-full object-cover" loading="lazy" />
    return <div className="w-full h-full flex flex-col items-center justify-center text-ink-4 text-xs gap-1 p-4 text-center">{a.media_status === 'pending' ? 'Medien werden geladen…' : a.media_status === 'error' ? 'Medien nicht abrufbar' : 'Kein Bild'}<span className="text-ink-2 text-[11px] line-clamp-4 mt-2">{a.body}</span></div>
  }

  return (
    <div className="flex min-h-screen bg-surface-0">
      <Sidebar />
      <main className="flex-1 md:ml-60 min-h-screen min-w-0">
        <div className="glass-top px-8 py-5 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-ink-1 font-semibold text-lg tracking-tight">Ad Library</h1>
            <p className="text-ink-3 text-xs mt-0.5">Meta-Ads der Wettbewerber: automatisch gesammelt, nach Marke und Zeitraum filterbar</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-full border border-hairline p-0.5 mr-2">
              <button onClick={() => setView('ads')} className={`press text-xs px-3 py-1.5 rounded-full ${view === 'ads' ? 'bg-accent text-[#1a1507] font-semibold' : 'text-ink-3 hover:text-ink-1'}`}>Ads</button>
              <button onClick={() => setView('koops')} className={`press text-xs px-3 py-1.5 rounded-full ${view === 'koops' ? 'bg-accent text-[#1a1507] font-semibold' : 'text-ink-3 hover:text-ink-1'}`}>Kooperationen</button>
            </div>
            {syncMsg && <span className="text-ink-4 text-xs max-w-md truncate" title={syncMsg}>{syncMsg}</span>}
            <button onClick={async () => { setSyncing('imports'); const { j } = await api('/api/ads/sync?mode=imports', 'POST'); setSyncing(null); const r = (j.imports || []).reduce((a: any, x: any) => ({ ok: a.ok + x.ok, fail: a.fail + x.fail }), { ok: 0, fail: 0 }); setSyncMsg(`Medien: ${r.ok} gespeichert${r.fail ? `, ${r.fail} fehlgeschlagen` : ''}`); loadAds(0, false) }} disabled={!!syncing} className="press text-sm font-medium rounded-full px-4 py-2 border border-hairline text-ink-2 hover:text-ink-1 disabled:opacity-50">{syncing === 'imports' ? 'Lädt Medien…' : 'Medien nachladen'}</button>
            {settings?.hasToken && <button onClick={() => sync()} disabled={!!syncing || !settings?.hasToken} className="press text-sm font-medium rounded-full px-4 py-2 border border-hairline text-ink-2 hover:text-ink-1 disabled:opacity-50">{syncing === 'all' ? 'Synchronisiert…' : 'Jetzt synchronisieren'}</button>}
            <button onClick={() => setSetup(true)} className="press bg-accent hover:bg-accent-hover text-sm font-semibold rounded-full px-4 py-2">Marken & Zugang</button>
          </div>
        </div>

        <div className="p-8 space-y-5">
          {settings && !settings.hasToken && (
            <div className="bg-surface-2 border border-hairline-soft rounded-apple-lg p-4 text-sm text-ink-3 flex items-center justify-between gap-4">
              <span>Die Ads werden per Browser aus der öffentlichen Meta Ad Library eingesammelt (Claude macht das auf Zuruf). Ein API-Token ist optional – damit liefe es automatisch jede Nacht.</span>
              <button onClick={() => setSetup(true)} className="press text-xs font-semibold rounded-full px-3 py-1.5 border border-hairline text-ink-2 hover:text-ink-1 whitespace-nowrap">API einrichten</button>
            </div>
          )}
          {err && <div className="text-red-400 text-sm">{err}</div>}

          <div className="flex flex-wrap gap-2 items-center">
            <button onClick={() => setSel([])} className={chip(!sel.length)}>Alle Marken</button>
            {brands.map(b => <button key={b.id} onClick={() => setSel(s => s.includes(b.id) ? s.filter(x => x !== b.id) : [...s, b.id])} className={chip(sel.includes(b.id))} title={b.last_error || ''}>{b.name}<span className="ml-1.5 opacity-60">{b.ad_count}</span></button>)}
          </div>

          {view === 'koops' && (
            <>
              <div className="flex flex-wrap gap-2 items-center">
                <select value={preset} onChange={e => setPreset(e.target.value as Preset)} className={selCls}>
                  <option value="all">Gesamter Zeitraum</option>
                  <option value="90">Letzte 90 Tage</option>
                  <option value="y0">{new Date().getFullYear()}</option>
                  <option value="y1">{new Date().getFullYear() - 1}</option>
                  <option value="custom">Eigener Zeitraum</option>
                </select>
                {preset === 'custom' && <><input type="date" value={from} onChange={e => setFrom(e.target.value)} className={selCls} /><span className="text-ink-4 text-xs">bis</span><input type="date" value={to} onChange={e => setTo(e.target.value)} className={selCls} /></>}
                <div className="flex items-center gap-3 ml-2 text-[11px] text-ink-4"><span>Punkt = Marke (Farbe), Rand = Quelle:</span>{Object.entries(SRC).map(([k, v]) => <span key={k} className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: v.color }} />{v.label}</span>)}</div>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <select value={koopSort} onChange={e => setKoopSort(e.target.value as 'brands' | 'count' | 'recent')} className={selCls}>
                  <option value="brands">Sortierung: meiste Marken</option>
                  <option value="count">Sortierung: meiste Buchungen</option>
                  <option value="recent">Sortierung: zuletzt gebucht</option>
                </select>
                <select value={koopMin} onChange={e => setKoopMin(e.target.value as 'all' | 'multi' | 'multibrand')} className={selCls}>
                  <option value="all">Alle Creator</option>
                  <option value="multi">Nur mehrfach gebucht (≥2 Posts)</option>
                  <option value="multibrand">Nur bei ≥2 Marken gebucht</option>
                </select>
                <input value={koopQ} onChange={e => setKoopQ(e.target.value)} placeholder="Creator suchen…" className={selCls + ' w-44'} />
                <span className="text-ink-4 text-xs ml-auto">{koops.length} Kooperationen · {koopRows.length} Creator · {koopRows.filter(r => r.items.length > 1).length} mehrfach gebucht · {koopRows.filter(r => r.brands.size > 1).length} bei mehreren Marken</span>
              </div>
              {addedMsg && <div className="text-emerald-400 text-sm">{addedMsg}</div>}
              {koopsLoading ? <div className="text-ink-4 text-sm py-10 text-center">Lädt…</div> : !koopRows.length ? (
                <div className="text-center py-16"><div className="text-ink-2 text-sm font-medium">Keine Kooperationen in dieser Auswahl</div><div className="text-ink-4 text-xs mt-1">Quellen: Partnership-Ads („Creator mit Marke“) aus der Ad Library, Branded-Content-Library und Instagram-Tags. Sag Claude, welche Marke per Browser nachgezogen werden soll.</div></div>
              ) : (
                <div className="bg-surface-2 rounded-apple-lg border border-hairline-soft overflow-hidden">
                  <div className="grid grid-cols-[260px_1fr_120px] border-b border-hairline-soft text-[10px] uppercase tracking-wide text-ink-4 bg-surface-2">
                    <div className="px-4 py-2">Creator</div>
                    <div className="relative h-8">{koopSpan.months.map((m, i) => <span key={i} className={`absolute top-0 bottom-0 flex items-center justify-center text-[10px] ${i % 2 ? 'bg-white/[0.025]' : ''} ${m.getMonth() === 0 || i === 0 ? 'text-ink-2 font-semibold' : ''}`} style={{ left: `${(i / koopSpan.months.length) * 100}%`, width: `${100 / koopSpan.months.length}%` }}>{m.toLocaleDateString('de-DE', { month: 'short' })}{m.getMonth() === 0 || i === 0 ? ` ${String(m.getFullYear()).slice(2)}` : ''}</span>)}</div>
                    <div className="px-3 py-2 text-right">Buchungen</div>
                  </div>
                  <div className="max-h-[70vh] overflow-y-auto">
                    {koopRows.slice(0, koopShow).map(r => (
                      <div key={r.creator} className="grid grid-cols-[260px_1fr_120px] items-center border-b border-hairline-soft/60 hover:bg-white/[0.03]">
                        <div className="px-4 py-2.5 min-w-0">
                          <button onClick={() => setKoopCreator(koopCreator === r.creator ? null : r.creator)} className="text-ink-1 text-sm font-medium truncate block text-left hover:text-accent">{r.creator}</button>
                          <div className="text-ink-4 text-[11px] flex items-center gap-2">
                            {profileLink(r) && <a href={profileLink(r)!} target="_blank" rel="noreferrer" className="hover:text-ink-2 truncate">{r.handle ? '@' + r.handle : 'Profil'} ↗</a>}
                            {r.brands.size > 1 && <span className="text-accent font-medium whitespace-nowrap">{r.brands.size} Marken</span>}
                            <button onClick={() => addCreator(r)} disabled={adding === r.creator} className="text-[10px] px-1.5 py-0.5 rounded border border-hairline text-ink-3 hover:text-ink-1 disabled:opacity-50 whitespace-nowrap">{adding === r.creator ? '…' : '+ Creator'}</button>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">{brandStats(r.items).slice(0, 4).map(([b, n]) => <span key={b} className="text-[10px] px-1.5 py-px rounded-full border" style={{ borderColor: brandColor(b), color: brandColor(b) }}>{brandName(b)}{n > 1 ? ` ×${n}` : ''}</span>)}{brandStats(r.items).length > 4 && <span className="text-[10px] text-ink-4">+{brandStats(r.items).length - 4}</span>}</div>
                        </div>
                        <div className="relative h-14">
                          <div className="absolute inset-y-0 left-0 right-0">{koopSpan.months.map((_, i) => <span key={i} className={`absolute top-0 bottom-0 border-l border-hairline-soft/50 ${i % 2 ? 'bg-white/[0.025]' : ''}`} style={{ left: `${(i / koopSpan.months.length) * 100}%`, width: `${100 / koopSpan.months.length}%` }} />)}</div>
                          <div className="absolute left-0 right-0 top-1/2 border-t border-hairline-soft/60" />
                          {r.items.filter(k => k.start_date).map(k => {
                            const days = k.end_date ? Math.max(1, Math.round((new Date(k.end_date).getTime() - new Date(k.start_date!).getTime()) / 86400000)) : 1
                            const size = Math.min(26, 14 + Math.log2(days + 1) * 2)
                            return <a key={k.id} href={postLink(k)} target="_blank" rel="noreferrer" title={`${brandName(k.brand_id)} · ${dat(k.start_date)}${k.end_date ? ' – ' + dat(k.end_date) : ''} · ${SRC[k.source]?.label || k.source}${k.text ? '\n' + k.text.slice(0, 120) : ''}\nKlick: Post öffnen`} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full border-[3px] shadow-[0_0_0_1px_rgba(0,0,0,.5)] hover:scale-125 hover:z-10 transition" style={{ left: `${koopSpan.pos(k.start_date!)}%`, width: size, height: size, background: brandColor(k.brand_id), borderColor: SRC[k.source]?.color || '#999' }} />
                          })}
                        </div>
                        <div className="px-3 py-2 text-right"><span className="text-ink-1 text-sm font-semibold">{r.items.length}×</span><div className="text-ink-4 text-[10px] whitespace-nowrap">{spanLabel(r.items)}</div></div>
                        {koopCreator === r.creator && (
                          <div className="col-span-3 px-4 pb-3">
                            <div className="flex items-center gap-2 mb-2 text-xs text-ink-3">
                              <span className="text-ink-1 font-medium">{r.items.length} Posts</span>
                              <span>·</span>
                              {brandStats(r.items).map(([b, n]) => <span key={b} style={{ color: brandColor(b) }}>{brandName(b)} {n}×</span>)}
                              {profileLink(r) && <a href={profileLink(r)!} target="_blank" rel="noreferrer" className="ml-auto press text-[11px] px-2.5 py-1 rounded-full border border-hairline text-ink-2 hover:text-ink-1">Profil öffnen ↗</a>}
                            </div>
                            <div className="grid gap-1.5 max-h-[50vh] overflow-y-auto pr-1">
                              {[...r.items].sort((a, b) => (b.start_date || '').localeCompare(a.start_date || '')).map(k => (
                                <div key={k.id} className="flex items-center gap-3 bg-surface-3 rounded-apple-sm border border-hairline-soft p-1.5">
                                  <a href={postLink(k)} target="_blank" rel="noreferrer" className="w-12 h-14 rounded bg-black/30 overflow-hidden flex-shrink-0">{k.media_url && <img src={k.media_url} alt="" className="w-full h-full object-cover" loading="lazy" />}</a>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 text-[11px]"><span className="font-medium" style={{ color: brandColor(k.brand_id) }}>{brandName(k.brand_id)}</span><span className="text-ink-4">{dat(k.start_date)}{k.end_date ? ` – ${dat(k.end_date)}` : ''}</span><span className="px-1.5 rounded-full text-[10px]" style={{ background: (SRC[k.source]?.color || '#999') + '22', color: SRC[k.source]?.color || '#999' }}>{SRC[k.source]?.label || k.source}</span></div>
                                    <div className="text-ink-3 text-[11px] truncate">{k.text || '—'}</div>
                                  </div>
                                  <a href={postLink(k)} target="_blank" rel="noreferrer" className="press flex-shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-accent text-[#1a1507] font-semibold">Öffnen ↗</a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {koopRows.length > koopShow && (
                      <div className="p-3 text-center"><button onClick={() => setKoopShow(n => n + 100)} className="press text-xs px-4 py-2 rounded-full border border-hairline text-ink-2 hover:text-ink-1">Weitere {Math.min(100, koopRows.length - koopShow)} Creator anzeigen ({koopRows.length - koopShow} übrig)</button></div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {view === 'ads' && (<>
          <div className="flex flex-wrap gap-2 items-center">
            <select value={preset} onChange={e => setPreset(e.target.value as Preset)} className={selCls}>
              <option value="all">Gesamter Zeitraum</option>
              <option value="active">Aktuell aktiv</option>
              <option value="30">Letzte 30 Tage</option>
              <option value="90">Letzte 90 Tage</option>
              <option value="y0">{new Date().getFullYear()}</option>
              <option value="y1">{new Date().getFullYear() - 1}</option>
              <option value="y2">{new Date().getFullYear() - 2}</option>
              <option value="y3">{new Date().getFullYear() - 3}</option>
              <option value="custom">Eigener Zeitraum</option>
            </select>
            {preset === 'custom' && <><input type="date" value={from} onChange={e => setFrom(e.target.value)} className={selCls} /><span className="text-ink-4 text-xs">bis</span><input type="date" value={to} onChange={e => setTo(e.target.value)} className={selCls} /></>}
            <div className="flex gap-1">{Object.entries(ANLASS).map(([k, v]) => <button key={k} onClick={() => setAnlass(a => a === k ? '' : k)} className={chip(anlass === k)}>{v}</button>)}</div>
            <select value={platform} onChange={e => setPlatform(e.target.value)} className={selCls}><option value="">Alle Plattformen</option><option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="messenger">Messenger</option><option value="audience_network">Audience Network</option></select>
            <select value={type} onChange={e => setType(e.target.value)} className={selCls}><option value="">Bild & Video</option><option value="image">Nur Bilder</option><option value="video">Nur Videos</option></select>
            <select value={sort} onChange={e => setSort(e.target.value)} className={selCls}><option value="newest">Neueste zuerst</option><option value="oldest">Älteste zuerst</option><option value="reach">Größte Reichweite (EU)</option></select>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Text durchsuchen…" className={selCls + ' min-w-[220px]'} />
            <span className="text-ink-4 text-xs ml-auto">{total} Ads</span>
          </div>

          {loading && !ads.length ? <div className="text-ink-4 text-sm py-10 text-center">Lädt…</div> : !ads.length ? (
            <div className="text-center py-16">
              <div className="text-ink-2 text-sm font-medium">Keine Ads in dieser Auswahl</div>
              <div className="text-ink-4 text-xs mt-1">{settings?.hasToken ? 'Filter anpassen oder „Jetzt synchronisieren“ klicken.' : 'Filter anpassen – oder Claude bitten, die Marke per Browser einzusammeln.'}</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {ads.map(a => (
                <div key={a.id} className="bg-surface-2 rounded-apple-lg border border-hairline-soft overflow-hidden flex flex-col group">
                  <button onClick={() => setDetail(a)} className="aspect-[4/5] bg-surface-3 overflow-hidden text-left relative">
                    <Media a={a} />
                    {a.media_type === 'video' && <span className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white font-medium">VIDEO</span>}
                    {a.anlass && a.anlass.length > 0 && <span className="absolute bottom-2 left-2 text-[10px] px-1.5 py-0.5 rounded bg-white/90 text-neutral-900 font-medium">{a.anlass.map(x => ANLASS[x] || x).join(' · ')}</span>}
                    {!a.end_date && <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/90 text-white font-medium">aktiv</span>}
                  </button>
                  <div className="p-3 flex-1 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-ink-1 text-sm font-medium truncate">{brandName(a.brand_id) || a.page_name}</span>
                      <span className="text-ink-4 text-[10px] whitespace-nowrap">{a.platforms.map(p => PLAT[p] || p).join(' · ')}</span>
                    </div>
                    <div className="text-ink-4 text-[11px]">{dat(a.start_date)}{a.end_date ? ` – ${dat(a.end_date)}` : ' – heute'} · {days(a.start_date, a.end_date)} Tage{a.eu_reach ? ` · ${a.eu_reach.toLocaleString('de-DE')} Reichweite` : ''}</div>
                    {a.body && <p className="text-ink-3 text-xs line-clamp-3 whitespace-pre-line">{a.body}</p>}
                    <div className="mt-auto pt-1 flex items-center justify-between">
                      <button onClick={() => setDetail(a)} className="text-[11px] text-accent hover:underline">Details</button>
                      <a href={libUrl(a.ad_id)} target="_blank" rel="noreferrer" className="text-[11px] text-ink-4 hover:text-ink-2">Ad Library ↗</a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {ads.length < total && <div className="text-center"><button onClick={() => loadAds(page + 1, true)} disabled={loading} className="press text-sm rounded-full px-5 py-2 border border-hairline text-ink-2 hover:text-ink-1 disabled:opacity-50">{loading ? 'Lädt…' : `Mehr laden (${total - ads.length} weitere)`}</button></div>}
          </>)}
        </div>

        {detail && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
            <div className="bg-surface-2 rounded-apple-lg border border-hairline w-full max-w-5xl max-h-[92vh] overflow-hidden grid md:grid-cols-[1fr_380px]" onClick={e => e.stopPropagation()}>
              <div className="bg-black flex items-center justify-center min-h-[320px] max-h-[92vh]"><div className="w-full h-full max-h-[92vh]"><Media a={detail} big /></div></div>
              <div className="p-5 overflow-y-auto space-y-4 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div><div className="text-ink-1 font-semibold">{brandName(detail.brand_id) || detail.page_name}</div><div className="text-ink-4 text-xs">{detail.page_name}</div></div>
                  <button onClick={() => setDetail(null)} className="text-ink-4 hover:text-ink-1 text-xl leading-none">×</button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-surface-3 rounded-apple-sm p-2"><div className="text-ink-4">Start</div><div className="text-ink-1">{dat(detail.start_date) || '–'}</div></div>
                  <div className="bg-surface-3 rounded-apple-sm p-2"><div className="text-ink-4">Ende</div><div className="text-ink-1">{detail.end_date ? dat(detail.end_date) : 'läuft noch'}</div></div>
                  <div className="bg-surface-3 rounded-apple-sm p-2"><div className="text-ink-4">Laufzeit</div><div className="text-ink-1">{days(detail.start_date, detail.end_date)} Tage</div></div>
                  <div className="bg-surface-3 rounded-apple-sm p-2"><div className="text-ink-4">Reichweite EU</div><div className="text-ink-1">{detail.eu_reach ? detail.eu_reach.toLocaleString('de-DE') : '–'}</div></div>
                  <div className="bg-surface-3 rounded-apple-sm p-2 col-span-2"><div className="text-ink-4">Plattformen</div><div className="text-ink-1">{detail.platforms.join(', ') || '–'}</div></div>
                </div>
                {detail.title && <div><div className="text-ink-4 text-xs mb-1">Headline</div><div className="text-ink-1">{detail.title}</div></div>}
                {detail.body && <div><div className="text-ink-4 text-xs mb-1">Text</div><div className="text-ink-2 whitespace-pre-line">{detail.body}</div></div>}
                {detail.caption && <div><div className="text-ink-4 text-xs mb-1">Caption</div><div className="text-ink-2">{detail.caption}</div></div>}
                {(detail.cta || detail.link_url) && <div><div className="text-ink-4 text-xs mb-1">Call to Action</div><div className="text-ink-2">{detail.cta}{detail.link_url && <> · <a href={detail.link_url} target="_blank" rel="noreferrer" className="text-accent hover:underline break-all">{detail.link_url}</a></>}</div></div>}
                <div className="flex gap-3 pt-2 flex-wrap">
                  <a href={libUrl(detail.ad_id)} target="_blank" rel="noreferrer" className="press text-xs rounded-full px-3 py-1.5 border border-hairline text-ink-2 hover:text-ink-1">In Meta Ad Library öffnen ↗</a>
                  {detail.media_url && <a href={detail.media_url} target="_blank" rel="noreferrer" download className="press text-xs rounded-full px-3 py-1.5 border border-hairline text-ink-2 hover:text-ink-1">Medium herunterladen</a>}
                </div>
                <div className="text-ink-4 text-[10px]">Ad-ID {detail.ad_id} · erfasst {dat(detail.first_seen)}</div>
              </div>
            </div>
          </div>
        )}

        {setup && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setSetup(false)}>
            <div className="bg-surface-2 rounded-apple-lg border border-hairline w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6 space-y-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between"><h2 className="text-ink-1 font-semibold">Marken & Zugang</h2><button onClick={() => setSetup(false)} className="text-ink-4 hover:text-ink-1 text-xl leading-none">×</button></div>

              <section className="space-y-3">
                <div className="flex items-center justify-between"><h3 className="text-ink-2 text-sm font-medium">Meta-Zugang</h3>{settings?.hasToken && <span className="text-[11px] text-emerald-400">Token hinterlegt ({settings.tokenHint}){settings.updated_at ? ' · ' + dat(settings.updated_at) : ''}</span>}</div>
                <div className="bg-surface-3 rounded-apple-sm p-3 text-xs text-ink-3 space-y-1 leading-relaxed">
                  <p>So bekommst du den Token (einmalig, ca. 5 Minuten):</p>
                  <p>1. Auf <a href="https://www.facebook.com/ID" target="_blank" rel="noreferrer" className="text-accent hover:underline">facebook.com/ID</a> Identität bestätigen (Pflicht für die Ad Library API).</p>
                  <p>2. Auf <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" className="text-accent hover:underline">developers.facebook.com</a> eine App anlegen (Typ egal, z. B. „Business“).</p>
                  <p>3. Im <a href="https://developers.facebook.com/tools/explorer" target="_blank" rel="noreferrer" className="text-accent hover:underline">Graph API Explorer</a> die App wählen, „User Token“ generieren und kopieren.</p>
                  <p>4. Optional im <a href="https://developers.facebook.com/tools/debug/accesstoken" target="_blank" rel="noreferrer" className="text-accent hover:underline">Token-Debugger</a> auf „Extend“ klicken, dann hält er ca. 60 Tage.</p>
                  <p>5. Token hier einfügen. Danach läuft der Sync automatisch jede Nacht; Medien werden nachgeladen.</p>
                </div>
                <div className="grid grid-cols-[1fr_140px_auto] gap-2 items-end">
                  <div><label className={labelCls}>Access-Token</label><input value={token} onChange={e => setToken(e.target.value)} placeholder={settings?.hasToken ? 'Neuen Token einfügen, um zu ersetzen' : 'EAAG…'} className={inputCls} /></div>
                  <div><label className={labelCls}>Länder (Ads ausgeliefert in)</label><input value={countries} onChange={e => setCountries(e.target.value)} className={inputCls} /></div>
                  <button onClick={saveToken} disabled={!token && countries === (settings?.countries || ['DE']).join(', ')} className="press bg-accent hover:bg-accent-hover text-sm font-semibold rounded-apple-sm px-4 py-2 disabled:opacity-50">Speichern & testen</button>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-ink-2 text-sm font-medium">Marken</h3>
                <div className="space-y-2">
                  {brands.map(b => (
                    <div key={b.id} className="bg-surface-3 rounded-apple-sm p-3 grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                      <input defaultValue={b.name} onBlur={e => e.target.value !== b.name && patchBrand(b.id, { name: e.target.value })} className={inputCls} />
                      <input defaultValue={b.search_term || ''} onBlur={e => e.target.value !== (b.search_term || '') && patchBrand(b.id, { search_term: e.target.value })} placeholder="Suchbegriff" className={inputCls} title="Suchbegriff in der Ad Library (exakte Phrase)" />
                      <input defaultValue={(b.page_ids || []).join(', ')} onBlur={e => e.target.value !== (b.page_ids || []).join(', ') && patchBrand(b.id, { page_ids: e.target.value })} placeholder="Page-IDs (optional, genauer)" className={inputCls} title="Facebook-Page-IDs, kommagetrennt. Wenn gesetzt, wird nur nach diesen Seiten gesucht." />
                      <div className="flex items-center gap-2">
                        <button onClick={() => sync(b.id)} disabled={!!syncing || !settings?.hasToken} className="press text-[11px] px-2 py-1 rounded border border-hairline text-ink-2 hover:text-ink-1 disabled:opacity-50">{syncing === b.id ? '…' : 'Sync'}</button>
                        <button onClick={() => patchBrand(b.id, { active: !b.active })} className={`text-[11px] px-2 py-1 rounded border ${b.active ? 'border-emerald-500/40 text-emerald-400' : 'border-hairline text-ink-4'}`}>{b.active ? 'aktiv' : 'pausiert'}</button>
                        <button onClick={() => twoClick('b' + b.id, () => delBrand(b.id))} className={btnDel(confirm === 'b' + b.id)}>{confirm === 'b' + b.id ? 'Sicher?' : 'Löschen'}</button>
                      </div>
                      <div className="col-span-4 text-[11px] text-ink-4">{b.ad_count} Ads{b.last_sync ? ` · letzter Sync ${new Date(b.last_sync).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}` : ' · noch nie synchronisiert'}{b.last_error && <span className="text-red-400"> · {b.last_error}</span>}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                  <div><label className={labelCls}>Neue Marke</label><input value={newBrand.name} onChange={e => setNewBrand({ ...newBrand, name: e.target.value })} placeholder="Name" className={inputCls} /></div>
                  <div><label className={labelCls}>Suchbegriff</label><input value={newBrand.search_term} onChange={e => setNewBrand({ ...newBrand, search_term: e.target.value })} placeholder="= Name, wenn leer" className={inputCls} /></div>
                  <div><label className={labelCls}>Page-IDs (optional)</label><input value={newBrand.page_ids} onChange={e => setNewBrand({ ...newBrand, page_ids: e.target.value })} placeholder="123456789, …" className={inputCls} /></div>
                  <button onClick={addBrand} className="press bg-accent hover:bg-accent-hover text-sm font-semibold rounded-apple-sm px-4 py-2">+ Hinzufügen</button>
                </div>
                <p className="text-ink-4 text-[11px]">Tipp: Der Suchbegriff findet alle Ads, in denen der Name vorkommt – auch von Händlern. Mit Page-IDs (aus der URL der Facebook-Seite oder aus einer gefundenen Ad) wird es exakt.</p>
              </section>
              {err && <div className="text-red-400 text-sm">{err}</div>}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
