'use client'
import Sidebar from '../components/Sidebar'
import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  type PlanPost, type PlanProdukt, KAMPAGNEN, PLATTFORMEN, FORMATE, DEAL_STATUS, POST_STATUS, DEAL_LABEL, POST_LABEL,
  ZEITRAEUME, zeitraumFor, VERSAND_STATUS, VERSAND_LABEL, versandInfo, fmtDatum, fmtKurz, fmtEur, briefingText,
} from '@/lib/postingplan'

const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

const DEAL_CLS: Record<string, string> = {
  offen: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  angefragt: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  zugesagt: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  deal: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  abgesagt: 'bg-white/5 text-ink-4 border-hairline',
}
const DEAL_DOT: Record<string, string> = { offen: '#FFB340', angefragt: '#0A84FF', zugesagt: '#BF5AF2', deal: '#30D158', abgesagt: '#636366' }

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const todayIso = () => iso(new Date())
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

const emptyPost = (): PlanPost => ({
  creator_id: '', creator_name: '', kampagne: 'Allgemein', geplant_am: '', plattform: 'Instagram', format: 'Reel',
  beschreibung: '', produkte: [], gage: null, deal_status: 'offen', post_status: 'geplant', beispiel_links: [], notizen: '',
  versand_status: 'offen', versand_vorlauf_tage: 6, versendet_am: '', sendungsnummer: '',
})

export default function Postingplan() {
  const [posts, setPosts] = useState<any[]>([])
  const [creators, setCreators] = useState<any[]>([])
  const [links, setLinks] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'planung' | 'zeitleiste'>('planung')
  const [kampagne, setKampagne] = useState('')
  const [dealFilter, setDealFilter] = useState('')
  const [form, setForm] = useState<PlanPost | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [newLink, setNewLink] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [confirmCreator, setConfirmCreator] = useState<string | null>(null)
  const [customKats, setCustomKats] = useState<string[]>([])
  useEffect(() => { try { setCustomKats(JSON.parse(localStorage.getItem('pp_kategorien') || '[]')) } catch {} }, [])
  const kategorien = useMemo(() => Array.from(new Set([...KAMPAGNEN, ...customKats, ...posts.map(p => p.kampagne).filter(Boolean)])), [customKats, posts])
  const addKategorie = () => {
    const n = (window.prompt('Name der neuen Kategorie (z. B. Muttertag, Valentinstag):') || '').trim()
    if (!n) return null
    if (!kategorien.some(k => k.toLowerCase() === n.toLowerCase())) {
      const next = [...customKats, n]; setCustomKats(next)
      try { localStorage.setItem('pp_kategorien', JSON.stringify(next)) } catch {}
    }
    return n
  }
  const removeCreatorPosts = async (key: string, ids: string[]) => {
    if (confirmCreator !== key) { setConfirmCreator(key); return }
    const token = await getToken()
    await Promise.all(ids.map(id => fetch('/api/postingplan/' + id, { method: 'DELETE', headers: { authorization: 'Bearer ' + token } })))
    setPosts(prev => prev.filter(p => !ids.includes(p.id)))
    setConfirmCreator(null)
  }
  const [monthStart, setMonthStart] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [monthCount, setMonthCount] = useState(2)

  const getToken = async () => (await sb.auth.getSession()).data.session?.access_token || ''

  const load = async () => {
    const h = { authorization: 'Bearer ' + await getToken() }
    const [p, c, l] = await Promise.all([
      fetch('/api/postingplan', { headers: h }).then(r => r.json()).catch(() => []),
      fetch('/api/creators?type=all', { headers: h }).then(r => r.json()).catch(() => []),
      fetch('/api/outreach-links', { headers: h }).then(r => r.json()).catch(() => []),
    ])
    setPosts(Array.isArray(p) ? p : [])
    setCreators(Array.isArray(c) ? c.filter((x: any) => x.type !== 'stylist') : [])
    setLinks(Array.isArray(l) ? l : [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])
  // Produkte erst laden, wenn das Formular das erste Mal aufgeht.
  useEffect(() => {
    if (!form || products.length) return
    ;(async () => {
      const r = await fetch('/api/shop-products', { headers: { authorization: 'Bearer ' + await getToken() } }).catch(() => null)
      if (r?.ok) setProducts(await r.json())
    })()
  }, [form, products.length])

  // Tracking-Link je Creator: erster Outreach-Link (automatisch, kein Extra-Aufwand)
  const linkFor = (creatorId?: string | null) => {
    const l = links.find(x => x.creator_id === creatorId)
    return l ? `https://kolure.trackfluenca.com/r/${l.short_code}` : null
  }

  const shown = useMemo(() => posts.filter(p => (!kampagne || p.kampagne === kampagne) && (!dealFilter || p.deal_status === dealFilter)), [posts, kampagne, dealFilter])

  const stats = useMemo(() => {
    const t = todayIso()
    const aktiv = shown.filter(p => p.deal_status !== 'abgesagt')
    const next = aktiv.filter(p => p.geplant_am && p.geplant_am >= t && p.post_status !== 'gepostet').sort((a, b) => a.geplant_am.localeCompare(b.geplant_am))[0]
    return {
      anzahl: aktiv.length,
      offen: aktiv.filter(p => p.deal_status === 'offen' || p.deal_status === 'angefragt').length,
      gage: aktiv.reduce((s, p) => s + (Number(p.gage) || 0), 0),
      versandFaellig: aktiv.filter(p => { const v = versandInfo(p); return v && (v.ueberfaellig || v.dringend) }).length,
      ueberfaellig: aktiv.filter(p => p.geplant_am && p.geplant_am < t && p.post_status !== 'gepostet').length,
      next,
    }
  }, [shown])

  // Anstehende Creator: je Creator der naechste offene Post + Anzahl
  const anstehend = useMemo(() => {
    const t = todayIso()
    const map: Record<string, { name: string; id: string; next: string | null; count: number; deal: string; gage: number }> = {}
    for (const p of shown) {
      if (p.deal_status === 'abgesagt' || p.post_status === 'gepostet') continue
      const k = p.creator_id || p.creator_name
      const m = map[k] || (map[k] = { name: p.creator_name, id: p.creator_id, next: null, count: 0, deal: p.deal_status, gage: 0 })
      m.count++
      m.gage += Number(p.gage) || 0
      if (p.geplant_am && (!m.next || (p.geplant_am >= t && (m.next < t || p.geplant_am < m.next)) )) { m.next = p.geplant_am; m.deal = p.deal_status }
    }
    return Object.values(map).sort((a, b) => (a.next || '9999').localeCompare(b.next || '9999'))
  }, [shown])

  const versandListe = useMemo(() => shown
    .map(p => ({ p, v: versandInfo(p) }))
    .filter(x => x.v && x.v.offen && (x.p.deal_status === 'zugesagt' || x.p.deal_status === 'deal'))
    .sort((a, b) => a.v!.deadline.localeCompare(b.v!.deadline)), [shown])

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {}
    for (const p of shown) { const k = p.creator_name || 'Unbekannt'; (map[k] = map[k] || []).push(p) }
    return Object.entries(map).sort((a, b) => ((a[1][0]?.geplant_am || '9999').localeCompare(b[1][0]?.geplant_am || '9999')))
  }, [shown])

  const copy = async (key: string, text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(p => p === key ? null : p), 1500) } catch {}
  }

  const save = async (weiter = false) => {
    if (!form) return
    setError('')
    if (!form.creator_id) { setError('Bitte einen Creator wählen.'); return }
    setSaving(true)
    try {
      const isEdit = !!form.id
      const res = await fetch(isEdit ? '/api/postingplan/' + form.id : '/api/postingplan', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + await getToken() },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error || 'Fehler beim Speichern'); return }
      await load()
      if (weiter) setForm({ ...form, id: undefined, created_at: undefined, geplant_am: '', beschreibung: '', beispiel_links: [], versand_status: 'offen', versendet_am: '', sendungsnummer: '' })
      else setForm(null)
    } finally { setSaving(false) }
  }

  const patch = async (id: string, fields: Partial<PlanPost>) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, ...fields } : p))
    await fetch('/api/postingplan/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + await getToken() }, body: JSON.stringify(fields) })
  }

  // Zwei-Klick-Bestaetigung beim Loeschen (wie ueberall in Trackfluenca)
  const remove = async (id: string) => {
    if (confirmDelete !== id) { setConfirmDelete(id); return }
    await fetch('/api/postingplan/' + id, { method: 'DELETE', headers: { authorization: 'Bearer ' + await getToken() } })
    setConfirmDelete(null)
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  const inputCls = 'w-full bg-surface-3 border border-hairline rounded-apple-sm px-3 py-2 text-ink-1 text-sm focus:outline-none focus:border-accent/40'
  const labelCls = 'text-ink-3 text-xs mb-1 block font-medium'
  const selCls = (cls: string) => `text-xs px-2 py-1 rounded-full border cursor-pointer focus:outline-none ${cls}`

  const toggleProduct = (p: any) => {
    if (!form) return
    const has = form.produkte.some(x => String(x.id) === String(p.id))
    const entry: PlanProdukt = { id: p.id, title: p.title, image: p.image, price: p.price, url: p.url }
    setForm({ ...form, produkte: has ? form.produkte.filter(x => String(x.id) !== String(p.id)) : [...form.produkte, entry] })
  }
  const filteredProducts = products.filter(p => !productSearch || p.title.toLowerCase().includes(productSearch.toLowerCase()) || (p.type || '').toLowerCase().includes(productSearch.toLowerCase()))

  const PostCard = ({ p }: { p: any }) => {
    const link = linkFor(p.creator_id)
    const t = todayIso()
    const late = p.geplant_am && p.geplant_am < t && p.post_status !== 'gepostet' && p.deal_status !== 'abgesagt'
    return (
      <div className={`rounded-apple-sm border p-4 ${late ? 'border-red-500/30 bg-red-500/[0.05]' : 'border-hairline-soft bg-surface-2'}`}>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className={`text-sm font-semibold ${late ? 'text-red-400' : 'text-ink-1'}`}>{fmtKurz(p.geplant_am)}</span>
          <span className="text-ink-4 text-xs">{p.format} · {p.plattform}</span>
          {p.kampagne !== 'Allgemein' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent">{p.kampagne}</span>}
          <div className="ml-auto flex items-center gap-2">
            <select value={p.deal_status} onChange={e => patch(p.id, { deal_status: e.target.value })} className={selCls(DEAL_CLS[p.deal_status])}>
              {DEAL_STATUS.map(s => <option key={s} value={s}>{DEAL_LABEL[s]}</option>)}
            </select>
            <select value={p.post_status} onChange={e => patch(p.id, { post_status: e.target.value })} className={selCls('bg-white/5 text-ink-2 border-hairline')}>
              {POST_STATUS.map(s => <option key={s} value={s}>{POST_LABEL[s]}</option>)}
            </select>
          </div>
        </div>
        {p.beschreibung && <p className="text-ink-2 text-sm mb-2 whitespace-pre-line">{p.beschreibung}</p>}
        {p.produkte?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {p.produkte.map((x: PlanProdukt) => (
              <a key={String(x.id)} href={x.url || '#'} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-surface-3 rounded-apple-sm pr-2 overflow-hidden border border-hairline-soft hover:border-hairline">
                {x.image ? <img src={x.image} alt="" className="w-9 h-9 object-cover" /> : <div className="w-9 h-9 bg-white/5" />}
                <span className="text-ink-2 text-xs max-w-[140px] truncate">{x.title}</span>
              </a>
            ))}
          </div>
        )}
        {p.beispiel_links?.length > 0 && (
          <div className="mb-2 space-y-0.5">
            {p.beispiel_links.map((l: string, i: number) => <a key={i} href={l} target="_blank" rel="noreferrer" className="block text-accent text-xs truncate hover:underline">▶ {l}</a>)}
          </div>
        )}
        {(() => {
          const v = versandInfo(p)
          const st = p.versand_status || 'offen'
          if (st === 'nicht_noetig') return null
          const cls = v?.ueberfaellig ? 'border-red-500/40 bg-red-500/10 text-red-400' : v?.dringend ? 'border-amber-500/40 bg-amber-500/10 text-amber-400' : 'border-hairline-soft bg-surface-3 text-ink-3'
          return (
            <div className={`flex flex-wrap items-center gap-2 rounded-apple-sm border px-3 py-2 mb-2 text-xs ${cls}`}>
              <span>📦</span>
              <select value={st} onChange={e => patch(p.id, { versand_status: e.target.value, ...(e.target.value === 'versendet' && !p.versendet_am ? { versendet_am: todayIso() } : {}) })} className="bg-transparent border border-current/30 rounded-full px-2 py-0.5 focus:outline-none">
                {VERSAND_STATUS.map(s => <option key={s} value={s} className="text-black">{VERSAND_LABEL[s]}</option>)}
              </select>
              {st === 'offen' && v && <span>{v.ueberfaellig ? `Überfällig seit ${-v.tage} Tag${v.tage === -1 ? '' : 'en'}, sofort raus!` : v.tage === 0 ? 'Muss HEUTE raus' : `Muss raus bis ${fmtKurz(v.deadline)} (in ${v.tage} Tag${v.tage === 1 ? '' : 'en'})`}</span>}
              {st === 'versendet' && <span>seit {fmtKurz(p.versendet_am)}{p.sendungsnummer ? ` · ${p.sendungsnummer}` : ''}</span>}
              {st === 'angekommen' && <span>✓ Schmuck ist beim Creator</span>}
              {st === 'offen' && <button onClick={() => patch(p.id, { versand_status: 'versendet', versendet_am: todayIso() })} className="ml-auto px-2 py-0.5 rounded bg-white/15 hover:bg-white/25 text-ink-1">Als versendet markieren</button>}
              {st === 'versendet' && <button onClick={() => patch(p.id, { versand_status: 'angekommen' })} className="ml-auto px-2 py-0.5 rounded bg-white/15 hover:bg-white/25 text-ink-1">Als angekommen markieren</button>}
            </div>
          )
        })()}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-ink-1 text-sm font-medium">{p.gage ? fmtEur(p.gage) : 'keine Gage'}</span>
          <div className="ml-auto flex flex-wrap gap-1.5">
            <button onClick={() => copy('b' + p.id, briefingText(p, link))} className="text-[11px] px-2 py-1 rounded bg-accent text-white hover:bg-accent-hover">{copied === 'b' + p.id ? '✓ Kopiert' : 'Briefing kopieren'}</button>
            {link && <button onClick={() => copy('l' + p.id, link)} className="text-[11px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-ink-2">{copied === 'l' + p.id ? '✓' : 'Link'}</button>}
            <button onClick={() => { setForm({ ...p, geplant_am: p.geplant_am || '', beschreibung: p.beschreibung || '', notizen: p.notizen || '' }); setError('') }} className="text-[11px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-ink-2">Bearbeiten</button>
            <button onClick={() => remove(p.id)} className={`text-[11px] px-2 py-1 rounded ${confirmDelete === p.id ? 'bg-red-600 text-white' : 'bg-red-950/30 text-red-400 hover:bg-red-950/50'}`}>{confirmDelete === p.id ? 'Sicher?' : 'Löschen'}</button>
          </div>
        </div>
        {!link && <p className="text-ink-4 text-[10px] mt-2">Kein Tracking-Link für diesen Creator. Im Outreach einen Link erstellen, dann erscheint er hier automatisch.</p>}
      </div>
    )
  }

  const Month = ({ start }: { start: Date }) => {
    const y = start.getFullYear(), m = start.getMonth()
    const first = new Date(y, m, 1)
    const offset = (first.getDay() + 6) % 7
    const days = new Date(y, m + 1, 0).getDate()
    const cells: (string | null)[] = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => iso(new Date(y, m, i + 1)))]
    while (cells.length % 7) cells.push(null)
    const t = todayIso()
    return (
      <div className="bg-surface-2 rounded-apple-lg border border-hairline-soft p-4">
        <h3 className="text-ink-1 font-semibold text-sm mb-3">{MONATE[m]} {y}</h3>
        <div className="grid grid-cols-7 gap-1 text-[10px] text-ink-4 mb-1">
          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => <div key={d} className="text-center">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={i} className="min-h-[72px]" />
            const dayPosts = shown.filter(p => p.geplant_am === d && p.deal_status !== 'abgesagt')
            const zeitraum = Object.entries(ZEITRAEUME).find(([, z]) => d >= z.von && d <= z.bis)?.[0]
            return (
              <div key={i} className={`min-h-[72px] rounded-apple-sm p-1 border ${d === t ? 'border-accent' : 'border-hairline-soft'} ${zeitraum === 'Black Week' ? 'bg-white/[0.07]' : zeitraum === 'Weihnachten' ? 'bg-red-500/[0.06]' : 'bg-surface-3/40'}`}>
                <div className="text-[10px] text-ink-4 mb-0.5">{Number(d.slice(8))}</div>
                {dayPosts.map(p => (
                  <button key={p.id} onClick={() => { setForm({ ...p, geplant_am: p.geplant_am || '', beschreibung: p.beschreibung || '', notizen: p.notizen || '' }); setError('') }}
                    title={`${p.creator_name} · ${p.format} · ${DEAL_LABEL[p.deal_status]}`}
                    className="w-full text-left text-[10px] leading-tight truncate rounded px-1 py-0.5 mb-0.5 text-white" style={{ background: DEAL_DOT[p.deal_status] }}>{p.creator_name}</button>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const monthsToShow = Array.from({ length: monthCount }, (_, i) => new Date(monthStart.getFullYear(), monthStart.getMonth() + i, 1))
  const ohneDatum = shown.filter(p => !p.geplant_am)

  return (
    <div className="flex min-h-screen bg-surface-0">
      <Sidebar />
      <main className="flex-1 md:ml-60 min-h-screen">
        <div className="border-b border-hairline-soft px-8 py-5 flex items-center justify-between bg-surface-0/80 backdrop-blur-xl sticky top-0 z-20">
          <div>
            <h1 className="text-ink-1 font-semibold text-lg tracking-tight">Postingplan</h1>
            <p className="text-ink-3 text-xs mt-0.5">Wer postet wann was, mit welchem Schmuck und welcher Gage</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-surface-2 border border-hairline rounded-apple-sm p-0.5">
              {([['planung', 'Planung'], ['zeitleiste', 'Zeitleiste']] as const).map(([k, l]) => (
                <button key={k} onClick={() => setView(k)} className={`px-3 py-1.5 text-xs rounded-[6px] transition-colors ${view === k ? 'bg-accent text-white' : 'text-ink-3 hover:text-ink-1'}`}>{l}</button>
              ))}
            </div>
            <button onClick={() => { setForm(emptyPost()); setError('') }} className="bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-apple-sm px-4 py-2">+ Post planen</button>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              ['Geplante Posts', String(stats.anzahl), stats.ueberfaellig ? `${stats.ueberfaellig} überfällig` : 'ohne abgesagte'],
              ['Deal offen', String(stats.offen), 'offen oder angefragt'],
              ['Versand fällig', String(stats.versandFaellig), 'überfällig oder in ≤ 2 Tagen'],
              ['Gage gesamt', fmtEur(stats.gage), 'alle geplanten Posts'],
              ['Nächster Post', stats.next ? fmtKurz(stats.next.geplant_am) : '—', stats.next ? stats.next.creator_name : 'nichts geplant'],
            ].map(([l, v, s]) => (
              <div key={l} className="bg-surface-2 rounded-apple-lg p-5 border border-hairline-soft">
                <div className="text-ink-3 text-xs font-medium mb-1">{l}</div>
                <div className="text-2xl font-semibold text-ink-1">{v}</div>
                <div className={`text-xs mt-0.5 ${(l === 'Geplante Posts' && stats.ueberfaellig) || (l === 'Versand fällig' && stats.versandFaellig) ? 'text-red-400' : 'text-ink-4'}`}>{s}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {['', ...kategorien].map(k => (
              <button key={k || 'alle'} onClick={() => setKampagne(k)} className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${kampagne === k ? 'bg-accent/15 border-accent text-ink-1' : 'border-hairline text-ink-3 hover:text-ink-1'}`}>
                {k || 'Alle Kategorien'}
              </button>
            ))}
            <button onClick={() => { const n = addKategorie(); if (n) setKampagne(n) }} className="px-3 py-1.5 text-xs rounded-full border border-dashed border-hairline text-ink-3 hover:text-ink-1">+ Kategorie</button>
            <select value={dealFilter} onChange={e => setDealFilter(e.target.value)} className="ml-auto bg-surface-2 border border-hairline rounded-apple-sm px-3 py-1.5 text-ink-2 text-xs focus:outline-none">
              <option value="">Alle Deal-Status</option>
              {DEAL_STATUS.map(s => <option key={s} value={s}>{DEAL_LABEL[s]}</option>)}
            </select>
          </div>

          {loading ? <div className="text-ink-4 text-sm py-10 text-center">Lädt...</div> : (
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 items-start">
              <div className="space-y-6 min-w-0">
                {view === 'planung' ? (
                  grouped.length === 0 ? <div className="text-ink-4 text-sm py-10 text-center">Noch keine Posts. Plane oben den ersten.</div> :
                  grouped.map(([name, list]) => (
                    <div key={name}>
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-ink-1 font-medium text-sm">{name}</h2>
                        <span className="text-ink-4 text-xs">{list.length} Post{list.length === 1 ? '' : 's'} · {fmtEur(list.reduce((s, p) => s + (Number(p.gage) || 0), 0))}</span>
                        <button onClick={() => removeCreatorPosts(name, list.map(p => p.id))} onBlur={() => setConfirmCreator(null)} className={`ml-auto text-[11px] px-2 py-1 rounded ${confirmCreator === name ? 'bg-red-600 text-white' : 'bg-red-950/30 text-red-400 hover:bg-red-950/50'}`}>{confirmCreator === name ? `Wirklich alle ${list.length} Posts entfernen?` : 'Creator aus Plan entfernen'}</button>
                      </div>
                      <div className="space-y-2">{list.map(p => <PostCard key={p.id} p={p} />)}</div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setMonthStart(new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1))} className="px-3 py-1.5 text-xs rounded-apple-sm border border-hairline text-ink-2">←</button>
                      <button onClick={() => { const d = new Date(); setMonthStart(new Date(d.getFullYear(), d.getMonth(), 1)) }} className="px-3 py-1.5 text-xs rounded-apple-sm border border-hairline text-ink-2">Heute</button>
                      <button onClick={() => setMonthStart(new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1))} className="px-3 py-1.5 text-xs rounded-apple-sm border border-hairline text-ink-2">→</button>
                      <div className="ml-auto flex gap-1">
                        {[1, 2, 3].map(n => <button key={n} onClick={() => setMonthCount(n)} className={`px-3 py-1.5 text-xs rounded-apple-sm border ${monthCount === n ? 'bg-accent/15 border-accent text-ink-1' : 'border-hairline text-ink-3'}`}>{n} Monat{n > 1 ? 'e' : ''}</button>)}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-[11px] text-ink-3">
                      {DEAL_STATUS.filter(s => s !== 'abgesagt').map(s => <span key={s} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: DEAL_DOT[s] }} />{DEAL_LABEL[s]}</span>)}
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-white/20" />Black Week</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-500/30" />Weihnachten</span>
                    </div>
                    {monthsToShow.map(d => <Month key={d.toISOString()} start={d} />)}
                    {ohneDatum.length > 0 && (
                      <div>
                        <h2 className="text-ink-1 font-medium text-sm mb-2">Ohne Datum</h2>
                        <div className="space-y-2">{ohneDatum.map(p => <PostCard key={p.id} p={p} />)}</div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-4 xl:sticky xl:top-24">
              <div className="bg-surface-2 rounded-apple-lg border border-hairline-soft p-4">
                <h2 className="text-ink-1 font-medium text-sm mb-1">Jetzt rausschicken</h2>
                <p className="text-ink-4 text-[10px] mb-3">Nur Deals mit Status Zugesagt / Deal fix, nach Frist sortiert</p>
                {versandListe.length === 0 ? <p className="text-ink-4 text-xs">Nichts offen. 🎉</p> : (
                  <div className="space-y-2">
                    {versandListe.map(({ p, v }) => (
                      <div key={p.id} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: v!.ueberfaellig ? '#FF453A' : v!.dringend ? '#FFB340' : '#636366' }} />
                        <div className="min-w-0 flex-1">
                          <div className="text-ink-1 text-xs font-medium truncate">{p.creator_name}</div>
                          <div className={`text-[10px] ${v!.ueberfaellig ? 'text-red-400' : 'text-ink-4'}`}>raus bis {fmtKurz(v!.deadline)} · Post {fmtKurz(p.geplant_am)}</div>
                        </div>
                        <button onClick={() => patch(p.id, { versand_status: 'versendet', versendet_am: todayIso() })} className="text-[10px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-ink-2">Versendet</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-surface-2 rounded-apple-lg border border-hairline-soft p-4">
                <h2 className="text-ink-1 font-medium text-sm mb-3">Anstehende Creator</h2>
                {anstehend.length === 0 ? <p className="text-ink-4 text-xs">Keine offenen Posts.</p> : (
                  <div className="space-y-2.5">
                    {anstehend.map(a => (
                      <div key={a.id || a.name} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: DEAL_DOT[a.deal] }} />
                        <div className="min-w-0 flex-1">
                          <div className="text-ink-1 text-xs font-medium truncate">{a.name}</div>
                          <div className="text-ink-4 text-[10px]">{a.next ? fmtKurz(a.next) : 'ohne Datum'} · {a.count} Post{a.count === 1 ? '' : 's'}{a.gage ? ' · ' + fmtEur(a.gage) : ''}</div>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${DEAL_CLS[a.deal]}`}>{DEAL_LABEL[a.deal]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              </div>
            </div>
          )}
        </div>

        {form && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setForm(null)}>
            <div className="bg-surface-2 rounded-apple-lg w-full max-w-2xl border border-hairline max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-hairline-soft">
                <h2 className="text-ink-1 font-semibold">{form.id ? 'Post bearbeiten' : 'Post planen'}</h2>
                <button onClick={() => setForm(null)} className="text-ink-3 hover:text-ink-1 text-xl leading-none">×</button>
              </div>
              <div className="overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Creator *</label>
                    <select value={form.creator_id || ''} onChange={e => setForm({ ...form, creator_id: e.target.value })} className={inputCls}>
                      <option value="">— wählen —</option>
                      {creators.map(c => <option key={c.id} value={c.id}>{c.name}{c.type === 'celeb' ? ' (Celeb)' : ''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Kampagne</label>
                    <select value={form.kampagne} onChange={e => setForm({ ...form, kampagne: e.target.value })} className={inputCls}>
                      {kategorien.map(k => <option key={k}>{k}</option>)}
                    </select>
                    <button type="button" onClick={() => { const n = addKategorie(); if (n && form) setForm({ ...form, kampagne: n }) }} className="text-[10px] text-accent mt-1 hover:underline">+ neue Kategorie</button>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Datum</label>
                  <input type="date" value={form.geplant_am || ''} onChange={e => setForm({ ...form, geplant_am: e.target.value })} className={inputCls} />
                  {zeitraumFor(form.kampagne) && (
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      <span className="text-ink-4 text-[10px] self-center">{ZEITRAEUME[zeitraumFor(form.kampagne)!].label}:</span>
                      {(zeitraumFor(form.kampagne) === 'Black Week' ? ['2026-11-23', '2026-11-25', '2026-11-27', '2026-11-30'] : ['2026-12-01', '2026-12-08', '2026-12-15', '2026-12-20']).map(d => (
                        <button key={d} type="button" onClick={() => setForm({ ...form, geplant_am: d })} className="text-[10px] px-2 py-0.5 rounded-full border border-hairline text-ink-3 hover:text-ink-1">{fmtKurz(d)}</button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Plattform</label>
                    <select value={form.plattform} onChange={e => setForm({ ...form, plattform: e.target.value })} className={inputCls}>{PLATTFORMEN.map(k => <option key={k}>{k}</option>)}</select></div>
                  <div><label className={labelCls}>Format</label>
                    <select value={form.format} onChange={e => setForm({ ...form, format: e.target.value })} className={inputCls}>{FORMATE.map(k => <option key={k}>{k}</option>)}</select></div>
                </div>

                <div>
                  <label className={labelCls}>Was soll der Creator machen?</label>
                  <textarea rows={3} value={form.beschreibung || ''} onChange={e => setForm({ ...form, beschreibung: e.target.value })} placeholder="z. B. Get-ready-with-me Reel, Armband im Alltag zeigen, Rabattcode erwähnen" className={inputCls + ' resize-none'} />
                </div>

                <div>
                  <label className={labelCls}>Schmuck aus dem Shop ({form.produkte.length} gewählt)</label>
                  {form.produkte.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {form.produkte.map(x => (
                        <button key={String(x.id)} type="button" onClick={() => setForm({ ...form, produkte: form.produkte.filter(y => y.id !== x.id) })}
                          className="flex items-center gap-1.5 bg-accent/15 border border-accent/40 rounded-full pl-1 pr-2 py-0.5 text-xs text-ink-1">
                          {x.image && <img src={x.image} alt="" className="w-5 h-5 rounded-full object-cover" />}{x.title} ×
                        </button>
                      ))}
                    </div>
                  )}
                  <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder={products.length ? 'Produkt suchen…' : 'Produkte werden geladen…'} className={inputCls + ' mb-2'} />
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-52 overflow-y-auto pr-1">
                    {filteredProducts.map(p => {
                      const on = form.produkte.some(x => String(x.id) === String(p.id))
                      return (
                        <button key={p.id} type="button" onClick={() => toggleProduct(p)} className={`text-left rounded-apple-sm overflow-hidden border transition-colors ${on ? 'border-accent' : 'border-hairline-soft hover:border-hairline'} bg-surface-3`}>
                          {p.image ? <img src={p.image} alt="" className="w-full aspect-square object-cover" loading="lazy" /> : <div className="w-full aspect-square bg-white/5" />}
                          <div className="p-1.5">
                            <div className="text-ink-1 text-[10px] leading-tight line-clamp-2">{p.title}</div>
                            <div className="text-ink-4 text-[10px]">{p.price ? fmtEur(Number(p.price)) : ''}{!p.available ? ' · ausverkauft' : ''}</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div><label className={labelCls}>Gage (€)</label>
                    <input type="number" min={0} value={form.gage ?? ''} onChange={e => setForm({ ...form, gage: e.target.value === '' ? null : Number(e.target.value) })} className={inputCls} /></div>
                  <div><label className={labelCls}>Deal</label>
                    <select value={form.deal_status} onChange={e => setForm({ ...form, deal_status: e.target.value })} className={inputCls}>{DEAL_STATUS.map(s => <option key={s} value={s}>{DEAL_LABEL[s]}</option>)}</select></div>
                  <div><label className={labelCls}>Post-Status</label>
                    <select value={form.post_status} onChange={e => setForm({ ...form, post_status: e.target.value })} className={inputCls}>{POST_STATUS.map(s => <option key={s} value={s}>{POST_LABEL[s]}</option>)}</select></div>
                </div>

                <div className="rounded-apple-sm border border-hairline-soft p-3 space-y-3">
                  <div className="text-ink-2 text-xs font-medium">📦 Versand des Schmucks{(() => { const v = versandInfo(form); return v ? ` · muss raus bis ${fmtKurz(v.deadline)}` : '' })()}</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelCls}>Status</label>
                      <select value={form.versand_status || 'offen'} onChange={e => setForm({ ...form, versand_status: e.target.value, versendet_am: e.target.value === 'versendet' && !form.versendet_am ? todayIso() : form.versendet_am })} className={inputCls}>{VERSAND_STATUS.map(s => <option key={s} value={s}>{VERSAND_LABEL[s]}</option>)}</select></div>
                    <div><label className={labelCls}>Vorlauf (Tage vor Post)</label>
                      <input type="number" min={0} value={form.versand_vorlauf_tage ?? 6} onChange={e => setForm({ ...form, versand_vorlauf_tage: Number(e.target.value) })} className={inputCls} /></div>
                    <div><label className={labelCls}>Versendet am</label>
                      <input type="date" value={form.versendet_am || ''} onChange={e => setForm({ ...form, versendet_am: e.target.value })} className={inputCls} /></div>
                    <div><label className={labelCls}>Sendungsnummer</label>
                      <input value={form.sendungsnummer || ''} onChange={e => setForm({ ...form, sendungsnummer: e.target.value })} className={inputCls} /></div>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Beispiel-Videos (Links zum Schicken an den Creator)</label>
                  {form.beispiel_links.map((l, i) => (
                    <div key={i} className="flex items-center gap-2 mb-1">
                      <span className="text-accent text-xs truncate flex-1">{l}</span>
                      <button type="button" onClick={() => setForm({ ...form, beispiel_links: form.beispiel_links.filter((_, j) => j !== i) })} className="text-ink-4 hover:text-red-400 text-sm">×</button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input value={newLink} onChange={e => setNewLink(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newLink.trim()) { e.preventDefault(); setForm({ ...form, beispiel_links: [...form.beispiel_links, newLink.trim()] }); setNewLink('') } }} placeholder="https://www.instagram.com/reel/…" className={inputCls} />
                    <button type="button" onClick={() => { if (newLink.trim()) { setForm({ ...form, beispiel_links: [...form.beispiel_links, newLink.trim()] }); setNewLink('') } }} className="px-3 rounded-apple-sm border border-hairline text-ink-2 text-sm">+</button>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Notizen (intern)</label>
                  <textarea rows={2} value={form.notizen || ''} onChange={e => setForm({ ...form, notizen: e.target.value })} className={inputCls + ' resize-none'} />
                </div>

                {form.creator_id && (
                  <p className="text-ink-4 text-xs">Tracking-Link: {linkFor(form.creator_id) || 'noch keiner – im Outreach erstellen, dann wird er automatisch ins Briefing übernommen.'}</p>
                )}
                {error && <p className="text-red-400 text-xs">{error}</p>}
                <div className="flex gap-2">
                  <button onClick={() => save(false)} disabled={saving} className="flex-1 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-apple-sm py-2.5 disabled:opacity-50">{saving ? 'Speichert…' : 'Speichern'}</button>
                  {!form.id && <button onClick={() => save(true)} disabled={saving} className="flex-1 border border-hairline text-ink-1 text-sm rounded-apple-sm py-2.5 hover:bg-white/[0.05] disabled:opacity-50">Speichern + weiterer Post</button>}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
