'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Sidebar from '../components/Sidebar'
import { createBrowserClient } from '@supabase/ssr'

const avatarSrc = (url?: string | null) => {
  if (!url) return url as any
  if (url.includes('cdninstagram.com') || url.includes('fbcdn.net') || url.includes('tiktokcdn')) {
    return '/api/img-proxy?url=' + encodeURIComponent(url)
  }
  return url
}
const avatarOnError = (fallbackUrl?: string | null) => (e: any) => {
  const img = e.currentTarget as HTMLImageElement
  if (fallbackUrl && img.dataset.fb !== '1') {
    img.dataset.fb = '1'
    img.src = avatarSrc(fallbackUrl) as string
  } else {
    img.style.display = 'none'
  }
}


function OutreachInner() {
  const searchParams = useSearchParams()
  const appliedParamRef = useRef(false)
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const [creators, setCreators] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any | null>(null)
  const [search, setSearch] = useState('')
  const [nachrichten, setNachrichten] = useState<any[]>([])
  const [loadingChat, setLoadingChat] = useState(false)
  const [neueNachricht, setNeueNachricht] = useState('')
  const [chatRichtung, setChatRichtung] = useState<'raus'|'rein'|'kommentar'|'kommentar_philipp'>('rein')
  const [chatKanal, setChatKanal] = useState('Instagram')
  const [sendingChat, setSendingChat] = useState(false)
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null)
  const [editMsgText, setEditMsgText] = useState('')
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null)
  useEffect(() => {
    if (!selected?.id) { setNachrichten([]); return }
    setLoadingChat(true)
    sb.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token || ''
      const res = await fetch('/api/aktivitaeten?creator_id=' + selected.id, { headers: { authorization: 'Bearer ' + token } })
      const d = await res.json()
      setNachrichten(Array.isArray(d) ? d.slice().reverse() : [])
      setLoadingChat(false)
    })
  }, [selected])
  const sendeNachricht = async () => {
    if (!neueNachricht.trim() || !selected?.id) return
    setSendingChat(true)
    try {
      const { data } = await sb.auth.getSession()
      const token = data.session?.access_token || ''
      const heute = new Date().toISOString().slice(0,10)
      const res = await fetch('/api/aktivitaeten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token },
        body: JSON.stringify({ creator_id: selected.id, datum: heute, kanal: chatKanal, richtung: chatRichtung, notiz: neueNachricht.trim(), quelle: 'manuell' })
      })
      const d = await res.json()
      if (res.ok) {
        setNachrichten(prev => [...prev, d])
        setNeueNachricht('')
        if (chatRichtung === 'raus' || chatRichtung === 'rein') {
          setMsgSet(prev => new Set(prev).add(selected.id))
          setLrMap(prev => ({ ...prev, [selected.id]: chatRichtung }))
        } else if (chatRichtung === 'kommentar') {
          setCommentSet(prev => new Set(prev).add(selected.id))
        } else {
          setPhilippCommentSet(prev => new Set(prev).add(selected.id))
        }
      }
    } finally { setSendingChat(false) }
  }
  const startEditMsg = (m: any) => { setEditingMsgId(m.id); setEditMsgText(m.notiz || '') }
  const cancelEditMsg = () => { setEditingMsgId(null); setEditMsgText('') }
  const saveEditMsg = async (id: string) => {
    if (!editMsgText.trim()) return
    const { data } = await sb.auth.getSession()
    const token = data.session?.access_token || ''
    await fetch('/api/aktivitaeten/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token },
      body: JSON.stringify({ notiz: editMsgText.trim() })
    })
    setNachrichten(prev => prev.map(m => m.id === id ? { ...m, notiz: editMsgText.trim() } : m))
    setEditingMsgId(null)
    setEditMsgText('')
  }
  const deleteMsg = async (id: string) => {
    const { data } = await sb.auth.getSession()
    const token = data.session?.access_token || ''
    await fetch('/api/aktivitaeten/' + id, { method: 'DELETE', headers: { authorization: 'Bearer ' + token } })
    setNachrichten(prev => {
      const next = prev.filter(m => m.id !== id)
      if (selected?.id) {
        const stillHasComment = next.some(m => m.richtung === 'kommentar')
        const stillHasPhilippComment = next.some(m => m.richtung === 'kommentar_philipp')
        setCommentSet(cs => {
          const copy = new Set(cs)
          if (stillHasComment) copy.add(selected.id); else copy.delete(selected.id)
          return copy
        })
        setPhilippCommentSet(cs => {
          const copy = new Set(cs)
          if (stillHasPhilippComment) copy.add(selected.id); else copy.delete(selected.id)
          return copy
        })
      }
      return next
    })
  }
  const copyMsg = async (m: any) => {
    try {
      await navigator.clipboard.writeText(m.notiz || '')
      setCopiedMsgId(m.id)
      setTimeout(() => setCopiedMsgId(prev => prev === m.id ? null : prev), 1500)
    } catch {}
  }

  useEffect(() => {
    let mounted = true
    sb.auth.getSession().then(async ({ data }) => {
      const userId = data.session?.user?.id
      if (!userId) { setLoading(false); return }
      const { data: rows } = await sb.from('creators').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      if (!mounted) return
      setCreators(rows || [])
      if (!appliedParamRef.current) {
        const cid = searchParams.get('creator')
        if (cid) {
          const found = (rows || []).find((c: any) => c.id === cid)
          if (found) { setSelected(found); appliedParamRef.current = true }
        }
      }
      setLoading(false)
    })
    return () => { mounted = false }
  }, [])

  const initials = (name: string) => (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const [kampagnenList, setKampagnenList] = useState<string[]>([])
  useEffect(() => {
    sb.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token || ''
      const res = await fetch('/api/kampagnen', { headers: { authorization: 'Bearer ' + token } })
      const d = await res.json()
      if (Array.isArray(d)) setKampagnenList(d.map((k: any) => k.name))
    })
  }, [])
  const [bestellungen, setBestellungen] = useState<any[]>([])
  useEffect(() => {
    if (!selected?.id) { setBestellungen([]); return }
    sb.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token || ''
      const res = await fetch('/api/bestellungen', { headers: { authorization: 'Bearer ' + token } })
      const d = await res.json()
      const arr = Array.isArray(d) ? d.filter((b:any) => b.creator_id === selected.id) : []
      setBestellungen(arr)
    })
  }, [selected])
  const updateCollab = async (field: string, value: any) => {
    if (!selected?.id) return
    setSelected((p: any) => ({ ...p, [field]: value }))
    setCreators(prev => prev.map(c => c.id === selected.id ? { ...c, [field]: value } : c))
    const { data } = await sb.auth.getSession()
    const token = data.session?.access_token || ''
    await fetch('/api/creators/' + selected.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token },
      body: JSON.stringify({ [field]: value })
    })
  }
  const updateBestellungField = async (bid: string, field: string, value: any) => {
    let updatedRef: any = null
    setBestellungen((prev:any) => prev.map((b:any) => {
      if (b.id !== bid) return b
      updatedRef = { ...b, [field]: value }
      return updatedRef
    }))
    if (selected?.id && updatedRef) setBestellMap(bm => ({ ...bm, [selected.id]: updatedRef }))
    const { data } = await sb.auth.getSession()
    const token = data.session?.access_token || ''
    await fetch('/api/bestellungen/' + bid, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token },
      body: JSON.stringify({ [field]: value })
    })
  }
  const updateBestellungStatus = async (b: any, status: string) => {
    const extra: any = { status }
    if (status === 'Versendet' && !b.versandt_am) extra.versandt_am = new Date().toISOString().slice(0,10)
    if (status === 'Angekommen' && !b.angekommen_am) extra.angekommen_am = new Date().toISOString().slice(0,10)
    const updated = { ...b, ...extra }
    setBestellungen((prev:any) => prev.map((x:any) => x.id === b.id ? updated : x))
    if (selected?.id) setBestellMap(prev => ({ ...prev, [selected.id]: updated }))
    if (status === 'Angekommen') setArrivedSet(prev => new Set(prev).add(b.creator_id))
    else setArrivedSet(prev => { const copy = new Set(prev); copy.delete(b.creator_id); return copy })
    const { data } = await sb.auth.getSession()
    const token = data.session?.access_token || ''
    await fetch('/api/bestellungen/' + b.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token },
      body: JSON.stringify(extra)
    })
  }
  const [dhlTracking, setDhlTracking] = useState<Record<string, any>>({})
  const [dhlLoading, setDhlLoading] = useState<string | null>(null)
  const trackShipment = async (b: any) => {
    if (!b.tracking_nummer) return
    setDhlLoading(b.id)
    try {
      const res = await fetch('/api/tracking?number=' + encodeURIComponent(b.tracking_nummer))
      const data = await res.json()
      setDhlTracking(prev => ({ ...prev, [b.id]: data }))
      if (data.status && data.status !== b.status && !data.error) {
        await updateBestellungStatus(b, data.status)
      }
    } finally {
      setDhlLoading(null)
    }
  }
  const markVersendet = async () => {
    if (!selected?.id) return
    const heute = new Date().toISOString().slice(0,10)
    const { data } = await sb.auth.getSession()
    const token = data.session?.access_token || ''
    const res = await fetch('/api/bestellungen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token },
      body: JSON.stringify({ creator_id: selected.id, produkt: '', status: 'Versendet', versandt_am: heute })
    })
    const neu = await res.json()
    setBestellungen((prev:any) => [...prev, neu])
    setBestellMap(prev => ({ ...prev, [selected.id]: neu }))
  }
  const createBestellungWithTracking = async (trackingNumber: string) => {
    if (!selected?.id) return
    const heute = new Date().toISOString().slice(0,10)
    const { data } = await sb.auth.getSession()
    const token = data.session?.access_token || ''
    const res = await fetch('/api/bestellungen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token },
      body: JSON.stringify({ creator_id: selected.id, produkt: '', status: 'Versendet', tracking_nummer: trackingNumber, versandt_am: heute })
    })
    const neu = await res.json()
    setBestellungen((prev:any) => [...prev, neu])
    setBestellMap(prev => ({ ...prev, [selected.id]: neu }))
  }
  const [arrivedSet, setArrivedSet] = useState<Set<string>>(new Set())
  const [msgSet, setMsgSet] = useState<Set<string>>(new Set())
  const [lrMap, setLrMap] = useState({} as Record<string, string>)
  const [commentSet, setCommentSet] = useState<Set<string>>(new Set())
  const [lastAt, setLastAt] = useState({} as Record<string, string>)
  const [lastRealAt, setLastRealAt] = useState({} as Record<string, string>)
  const [sortMode, setSortMode] = useState<'wichtigkeit' | 'datum' | 'versand'>('wichtigkeit')
  const [personFilter, setPersonFilter] = useState<'none' | 'sammy' | 'philipp'>('none')
  const [philippCommentSet, setPhilippCommentSet] = useState<Set<string>>(new Set())
  const [bestellMap, setBestellMap] = useState<Record<string, any>>({})
  useEffect(() => {
    sb.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token || ''
      const res = await fetch('/api/bestellungen', { headers: { authorization: 'Bearer ' + token } })
      const best = await res.json()
      const ang = new Set<string>()
      const bm: Record<string, any> = {}
      if (Array.isArray(best)) best.forEach((b:any) => {
        if (!b.creator_id) return
        if (b.status === 'Angekommen') ang.add(b.creator_id)
        const existing = bm[b.creator_id]
        if (!existing || new Date(b.created_at || 0).getTime() >= new Date(existing.created_at || 0).getTime()) bm[b.creator_id] = b
      })
      setArrivedSet(ang)
      setBestellMap(bm)
      const { data: akt } = await sb.from('aktivitaeten').select('creator_id, richtung, created_at').order('created_at', { ascending: true })
      const ms = new Set<string>()
      const lr: Record<string, string> = {}
      const lastType: Record<string, string> = {}
      const la: Record<string, string> = {}
      const lra: Record<string, string> = {}
      if (Array.isArray(akt)) akt.forEach((a: any) => {
        if (!a.creator_id) return
        lastType[a.creator_id] = a.richtung
        la[a.creator_id] = a.created_at
        if (a.richtung === 'raus' || a.richtung === 'rein') { ms.add(a.creator_id); lr[a.creator_id] = a.richtung; lra[a.creator_id] = a.created_at }
      })
      const cs = new Set<string>()
      const csp = new Set<string>()
      Object.keys(lastType).forEach(cid => {
        if (lastType[cid] === 'kommentar') cs.add(cid)
        if (lastType[cid] === 'kommentar_philipp') csp.add(cid)
      })
      setMsgSet(ms)
      setLrMap(lr)
      setCommentSet(cs)
      setPhilippCommentSet(csp)
      setLastAt(la)
      setLastRealAt(lra)
    })
  }, [])
  const daysSince = (iso?: string) => { if (!iso) return 0; return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) }
  const timeAgo = (iso?: string) => {
    if (!iso) return ''
    const diffMs = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diffMs / 60000)
    if (mins < 1) return 'gerade eben'
    if (mins < 60) return `vor ${mins} Min.`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `vor ${hours} Std.`
    const days = Math.floor(hours / 24)
    return `vor ${days} Tag${days === 1 ? '' : 'en'}`
  }
  const shipStatus = (c:any) => bestellMap[c.id]?.status || 'Nicht versendet'
  const shipTracking = (c:any) => bestellMap[c.id]?.tracking_nummer || ''
  const shipDaysSince = (c:any) => daysSince(bestellMap[c.id]?.versandt_am)
  const needsTracking = (c:any) => shipStatus(c) === 'Versendet' && !shipTracking(c) && shipDaysSince(c) >= 2
  const needsArrivalCheck = (c:any) => !!shipTracking(c) && shipStatus(c) !== 'Angekommen' && shipDaysSince(c) >= 4
  const sammyBand = (c:any) => {
    if (c.sammy_approved === 'Nicht schreiben' || c.sammy_approved === 'Bereits zusammengearbeitet') return 3
    if (c.type === 'celeb' && !msgSet.has(c.id)) return 0
    return 2
  }
  const prio = (c:any) => {
    let p = 4
    if (needsTracking(c) || needsArrivalCheck(c)) p = 0
    else if (arrivedSet.has(c.id)) p = 1
    else if (msgSet.has(c.id) && lrMap[c.id] === 'raus') p = 2
    else if (!msgSet.has(c.id)) p = 3
    return sammyBand(c) * 10 + p
  }
  const versandPrio = (c:any) => {
    if (needsTracking(c)) return 0
    if (needsArrivalCheck(c)) return 1
    if (arrivedSet.has(c.id)) return 2
    return 3
  }
  const personBoost = (c:any) => {
    if (sortMode !== 'wichtigkeit' || personFilter === 'none') return 1
    if (personFilter === 'sammy' && philippCommentSet.has(c.id)) return 0
    if (personFilter === 'philipp' && commentSet.has(c.id)) return 0
    return 1
  }
  const filtered = creators.filter(c => {
    const s = search.toLowerCase()
    return !s || (c.name || '').toLowerCase().includes(s) || (c.ig || '').toLowerCase().includes(s)
  }).slice().sort((a:any,b:any) => {
    const ta = lastAt[a.id] ? new Date(lastAt[a.id]).getTime() : 0
    const tb = lastAt[b.id] ? new Date(lastAt[b.id]).getTime() : 0
    if (sortMode === 'datum') {
      if (ta !== tb) return tb - ta
      return prio(a) - prio(b)
    }
    if (sortMode === 'versand') {
      const va = versandPrio(a), vb = versandPrio(b)
      if (va !== vb) return va - vb
      const da = shipDaysSince(a), db = shipDaysSince(b)
      if (da !== db) return db - da
      return tb - ta
    }
    const ba = personBoost(a), bb = personBoost(b)
    if (ba !== bb) return ba - bb
    const pa = prio(a), pb = prio(b)
    if (pa !== pb) return pa - pb
    return tb - ta
  })

  return (
    <div className="h-screen bg-surface-0 text-ink-1 overflow-hidden">
      <Sidebar />
      <div className="md:ml-60 h-screen flex overflow-hidden">

        {/* LINKS: Chat-Liste */}
        <div className="w-80 flex-shrink-0 border-r border-hairline-soft flex flex-col">
          <div className="p-4 border-b border-hairline-soft">
            <h1 className="text-ink-1 font-semibold text-lg mb-3">Outreach</h1>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Suchen..."
              className="w-full bg-surface-2 border border-hairline rounded-apple-sm px-3 py-2 text-sm text-ink-1 focus:outline-none focus:border-accent" />
            <div className="flex gap-2 mt-2">
              <button onClick={() => setSortMode('wichtigkeit')}
                className={`flex-1 text-xs font-medium rounded-apple-sm px-2 py-1.5 transition-colors ${sortMode === 'wichtigkeit' ? 'bg-accent text-white' : 'bg-surface-2 text-ink-3 hover:text-ink-1'}`}>
                Wichtigkeit
              </button>
              <button onClick={() => setSortMode('datum')}
                className={`flex-1 text-xs font-medium rounded-apple-sm px-2 py-1.5 transition-colors ${sortMode === 'datum' ? 'bg-accent text-white' : 'bg-surface-2 text-ink-3 hover:text-ink-1'}`}>
                Datum
              </button>
              <button onClick={() => setSortMode('versand')}
                className={`flex-1 text-xs font-medium rounded-apple-sm px-2 py-1.5 transition-colors ${sortMode === 'versand' ? 'bg-accent text-white' : 'bg-surface-2 text-ink-3 hover:text-ink-1'}`}>
                Versand
              </button>
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => { setPersonFilter(p => p === 'sammy' ? 'none' : 'sammy'); setSortMode('wichtigkeit') }}
                className={`flex-1 text-[11px] font-medium rounded-apple-sm px-2 py-1 transition-colors ${personFilter === 'sammy' ? 'bg-red-500/20 text-red-400' : 'bg-surface-2 text-ink-4 hover:text-ink-2'}`}>
                Sammy-Filter
              </button>
              <button onClick={() => { setPersonFilter(p => p === 'philipp' ? 'none' : 'philipp'); setSortMode('wichtigkeit') }}
                className={`flex-1 text-[11px] font-medium rounded-apple-sm px-2 py-1 transition-colors ${personFilter === 'philipp' ? 'bg-violet-500/20 text-violet-400' : 'bg-surface-2 text-ink-4 hover:text-ink-2'}`}>
                Philipp-Filter
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading && <div className="p-4 text-ink-4 text-sm">Lädt...</div>}
            {!loading && filtered.length === 0 && <div className="p-4 text-ink-4 text-sm">Keine Creator</div>}
            {filtered.map(c => {
              const shipUrgent = needsTracking(c) || needsArrivalCheck(c)
              return (
              <button key={c.id} onClick={() => setSelected(c)}
                className={`w-full flex items-center gap-3 px-4 py-3 border-b border-hairline-soft text-left hover:bg-white/[0.03] transition-colors ${selected?.id === c.id ? 'bg-white/[0.05]' : ''} ${shipUrgent ? 'bg-amber-500/[0.06] border-l-2 border-l-amber-500' : ''}`}>
                <div className="w-10 h-10 rounded-full bg-[#30D158] flex items-center justify-center text-ink-1 text-sm font-bold overflow-hidden flex-shrink-0">
                  {(c.tt_image || c.ig_image) ? <img src={avatarSrc(c.tt_image || c.ig_image)} alt="" className="w-full h-full object-cover" onError={avatarOnError(c.tt_image ? c.ig_image : null)} /> : initials(c.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-ink-1 text-sm font-medium truncate">{c.name || '—'}</div>
                    {lastAt[c.id] && (
                      <span className="text-[10px] flex-shrink-0 text-ink-4">{timeAgo(lastAt[c.id])}</span>
                    )}
                  </div>
                  <div className="text-ink-4 text-xs truncate">{c.ig || ''}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    {c.sammy_approved === 'Kann schreiben' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 rounded-full px-2 py-0.5">&#9989; Kann schreiben</span>
                    )}
                    {c.sammy_approved === 'Nicht schreiben' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-400 bg-red-500/10 rounded-full px-2 py-0.5">&#128683; Nicht schreiben</span>
                    )}
                    {c.sammy_approved === 'Bereits zusammengearbeitet' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-400 bg-blue-500/10 rounded-full px-2 py-0.5">&#129309; Bereits zusammengearbeitet</span>
                    )}
                    {commentSet.has(c.id) && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-400 bg-red-500/10 rounded-full px-2 py-0.5">&#128172; Sammy Kommentar</span>
                    )}
                    {philippCommentSet.has(c.id) && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-violet-400 bg-violet-500/10 rounded-full px-2 py-0.5">&#128172; Philipp Kommentar</span>
                    )}
                    {needsTracking(c) && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-white bg-amber-500 rounded-full px-2 py-0.5">&#128230; Trackingnummer fehlt (seit {shipDaysSince(c)}T)</span>
                    )}
                    {needsArrivalCheck(c) && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-white bg-blue-500 rounded-full px-2 py-0.5">&#128231; Nachfragen: Paket da? (seit {shipDaysSince(c)}T)</span>
                    )}
                    {arrivedSet.has(c.id) ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 rounded-full px-2 py-0.5">&#128230; Anweisungen schicken</span>
                    ) : (msgSet.has(c.id) && lrMap[c.id] === 'raus' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-300 bg-amber-500/15 rounded-full px-2 py-0.5">&#8987; Antwort ausstehend</span>
                    ) : (!msgSet.has(c.id) && c.sammy_approved !== 'Nicht schreiben' && c.sammy_approved !== 'Bereits zusammengearbeitet' ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-white bg-gradient-to-r from-[#0A84FF] to-[#0066DD] rounded-full px-2.5 py-1 shadow-[0_2px_10px_rgba(10,132,255,0.45)]">&#9993;&#65039; Bitte anschreiben</span>
                    ) : null))}
                  </div>
                </div>
              </button>
            )})}
          </div>
        </div>

        {/* MITTE: Chatfeld */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-ink-4 text-sm">
              Wähle einen Chat aus der Liste
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-hairline-soft flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#30D158] flex items-center justify-center text-ink-1 text-sm font-bold overflow-hidden">
                  {(selected.tt_image || selected.ig_image) ? <img src={avatarSrc(selected.tt_image || selected.ig_image)} alt="" className="w-full h-full object-cover" onError={avatarOnError(selected.tt_image ? selected.ig_image : null)} /> : initials(selected.name)}
                </div>
                <div>
                  <div className="text-ink-1 text-sm font-medium">{selected.name}</div>
                  <div className="text-ink-4 text-xs">{selected.ig || ''}</div>
                  <div className="flex flex-wrap items-center gap-1 mt-1">
                    {selected.sammy_approved && selected.sammy_approved !== 'Offen' && (
                      <span className={`inline-block text-[10px] font-medium rounded-full px-2 py-0.5 ${selected.sammy_approved === 'Kann schreiben' ? 'text-emerald-400 bg-emerald-500/10' : selected.sammy_approved === 'Nicht schreiben' ? 'text-red-400 bg-red-500/10' : 'text-blue-400 bg-blue-500/10'}`}>
                        {selected.sammy_approved === 'Kann schreiben' ? '✅ Kann schreiben' : selected.sammy_approved === 'Nicht schreiben' ? '🚫 Nicht schreiben' : '🤝 Bereits zusammengearbeitet'}
                      </span>
                    )}
                    {commentSet.has(selected.id) && (
                      <span className="inline-block text-[10px] font-medium rounded-full px-2 py-0.5 text-red-400 bg-red-500/10">&#128172; Sammy Kommentar</span>
                    )}
                    {philippCommentSet.has(selected.id) && (
                      <span className="inline-block text-[10px] font-medium rounded-full px-2 py-0.5 text-violet-400 bg-violet-500/10">&#128172; Philipp Kommentar</span>
                    )}
                    {lastAt[selected.id] && (
                      <span className="inline-block text-[10px] text-ink-4">{timeAgo(lastAt[selected.id])}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {loadingChat && <div className="text-center text-ink-4 text-xs">Lädt...</div>}
                {!loadingChat && nachrichten.length === 0 && <div className="text-center text-ink-4 text-xs mt-8">Noch keine Nachrichten. Kopiere unten den Verlauf rein.</div>}
                {nachrichten.map((m:any) => {
                  const isEditing = editingMsgId === m.id
                  const msgActions = (
                    <div className="absolute -top-2 right-2 hidden group-hover:flex items-center gap-0.5 bg-surface-0 border border-hairline-soft rounded-full px-1 py-0.5 shadow-lg z-10">
                      <button onClick={() => copyMsg(m)} title="Kopieren" className="text-ink-3 hover:text-accent text-[11px] w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/[0.08]">{copiedMsgId === m.id ? '✓' : '⧉'}</button>
                      <button onClick={() => startEditMsg(m)} title="Bearbeiten" className="text-ink-3 hover:text-accent text-[11px] w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/[0.08]">&#9998;</button>
                      <button onClick={() => deleteMsg(m.id)} title="Löschen" className="text-ink-3 hover:text-red-400 text-[11px] w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/[0.08]">&#128465;</button>
                    </div>
                  )
                  if (m.richtung === 'kommentar' || m.richtung === 'kommentar_philipp') {
                    const isPhilipp = m.richtung === 'kommentar_philipp'
                    const cx = isPhilipp
                      ? { bubble: 'bg-violet-500/10 border-violet-500/30', label: 'text-violet-400', text: 'text-violet-100', meta: 'text-violet-400/60', cancel: 'text-violet-300' }
                      : { bubble: 'bg-red-500/10 border-red-500/30', label: 'text-red-400', text: 'text-red-100', meta: 'text-red-400/60', cancel: 'text-red-300' }
                    return (
                      <div key={m.id} className="flex justify-center">
                        <div className={`group relative max-w-[85%] rounded-apple-lg px-4 py-2 border ${cx.bubble}`}>
                          {msgActions}
                          <div className={`text-[10px] font-semibold ${cx.label} mb-0.5`}>&#128172; {isPhilipp ? 'Philipp Kommentar' : 'Sammy Kommentar'}</div>
                          {isEditing ? (
                            <div className="space-y-1">
                              <textarea value={editMsgText} onChange={e => setEditMsgText(e.target.value)} rows={2} className={`w-full bg-black/20 rounded px-2 py-1 text-sm ${cx.text} focus:outline-none resize-none`} />
                              <div className="flex gap-1 justify-end">
                                <button onClick={() => saveEditMsg(m.id)} className={`text-[10px] px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 ${cx.text}`}>Speichern</button>
                                <button onClick={cancelEditMsg} className={`text-[10px] px-2 py-0.5 rounded hover:bg-white/10 ${cx.cancel}`}>Abbrechen</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className={`text-sm whitespace-pre-wrap break-words ${cx.text}`}>{m.notiz}</div>
                              <div className={`text-[10px] mt-1 ${cx.meta}`}>{m.datum || ''}</div>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  }
                  const raus = m.richtung === 'raus'
                  return (
                    <div key={m.id} className={`flex ${raus ? 'justify-end' : 'justify-start'}`}>
                      <div className={`group relative max-w-[70%] rounded-apple-lg px-4 py-2 ${raus ? 'bg-accent text-ink-1' : 'bg-surface-3 text-ink-1 border border-hairline-soft'}`}>
                        {msgActions}
                        {isEditing ? (
                          <div className="space-y-1">
                            <textarea value={editMsgText} onChange={e => setEditMsgText(e.target.value)} rows={2} className="w-full bg-black/20 rounded px-2 py-1 text-sm text-inherit focus:outline-none resize-none" />
                            <div className="flex gap-1 justify-end">
                              <button onClick={() => saveEditMsg(m.id)} className="text-[10px] px-2 py-0.5 rounded bg-white/20 hover:bg-white/30">Speichern</button>
                              <button onClick={cancelEditMsg} className="text-[10px] px-2 py-0.5 rounded hover:bg-white/10">Abbrechen</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="text-sm whitespace-pre-wrap break-words">{m.notiz}</div>
                            <div className={`text-[10px] mt-1 ${raus ? 'text-ink-1/60' : 'text-ink-4'}`}>{m.kanal} · {m.datum || ''}</div>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="p-3 border-t border-hairline-soft">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <button onClick={() => setChatRichtung('rein')} className={`text-xs px-3 py-1 rounded-apple-sm ${chatRichtung==='rein' ? 'bg-emerald-500/20 text-emerald-400' : 'text-ink-3 hover:text-ink-2'}`}>Von Creator</button>
                  <button onClick={() => setChatRichtung('raus')} className={`text-xs px-3 py-1 rounded-apple-sm ${chatRichtung==='raus' ? 'bg-accent/20 text-accent' : 'text-ink-3 hover:text-ink-2'}`}>Von mir</button>
                  <button onClick={() => setChatRichtung('kommentar')} className={`text-xs px-3 py-1 rounded-apple-sm flex items-center gap-1 ${chatRichtung==='kommentar' ? 'bg-red-500/20 text-red-400' : 'text-ink-3 hover:text-ink-2'}`}><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span>Sammy Kommentar</button>
                  <button onClick={() => setChatRichtung('kommentar_philipp')} className={`text-xs px-3 py-1 rounded-apple-sm flex items-center gap-1 ${chatRichtung==='kommentar_philipp' ? 'bg-violet-500/20 text-violet-400' : 'text-ink-3 hover:text-ink-2'}`}><span className="w-1.5 h-1.5 rounded-full bg-violet-500 inline-block"></span>Philipp Kommentar</button>
                  <select value={chatKanal} onChange={e => setChatKanal(e.target.value)} className="bg-surface-2 border border-hairline rounded-apple-sm px-2 py-1 text-xs text-ink-2 focus:outline-none ml-auto">
                    <option>Instagram</option><option>Mail</option><option>Telefon</option><option>Sonstiges</option>
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <textarea value={neueNachricht} onChange={e => setNeueNachricht(e.target.value)} rows={2} placeholder="Nachricht reinkopieren oder tippen..."
                    className="flex-1 bg-surface-2 border border-hairline rounded-apple-sm px-3 py-2 text-sm text-ink-1 focus:outline-none focus:border-accent resize-none" />
                  <button onClick={sendeNachricht} disabled={sendingChat || !neueNachricht.trim()}
                    className={`px-4 py-2 rounded-apple-sm text-sm text-ink-1 ${sendingChat||!neueNachricht.trim() ? 'bg-accent/40' : 'bg-accent hover:bg-accent-hover shadow-[0_6px_20px_-4px_rgba(10,132,255,0.55)]'}`}>
                    {sendingChat ? '...' : 'Hinzufügen'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* RECHTS: Info-Sidebar */}
        {selected && (
          <div key={selected.id} className="flex-shrink-0 border-l border-hairline-soft p-4 overflow-hidden flex flex-col" style={{width:"288px",minWidth:"288px",maxWidth:"288px"}}>
            <div className="text-ink-1 font-medium text-sm mb-4 flex-shrink-0">Collab-Infos</div>
            <div className="space-y-3 overflow-y-auto flex-1 min-h-0 pr-1">
              <div className="bg-surface-2 rounded-apple-sm p-3 space-y-2">
                <div className="text-ink-3 text-[10px] uppercase tracking-wider">Kontakt &amp; Links</div>
                <div className="flex gap-1.5">
                  {selected.ig ? (
                    <a href={"https://instagram.com/" + (selected.ig||'').replace('@','')} target="_blank" rel="noopener noreferrer"
                      className="flex-1 text-center text-[11px] bg-surface-3 hover:bg-white/[0.05] border border-hairline rounded-apple-sm px-2 py-1.5 text-ink-2">Instagram &#8599;</a>
                  ) : null}
                  {selected.tt ? (
                    <a href={"https://tiktok.com/@" + (selected.tt||'').replace('@','')} target="_blank" rel="noopener noreferrer"
                      className="flex-1 text-center text-[11px] bg-surface-3 hover:bg-white/[0.05] border border-hairline rounded-apple-sm px-2 py-1.5 text-ink-2">TikTok &#8599;</a>
                  ) : null}
                </div>
                <div>
                  <label className="text-ink-4 text-[10px] block mb-1">Adresse</label>
                  <textarea defaultValue={selected.adresse||''} onBlur={e => updateCollab('adresse', e.target.value)} rows={2}
                    className="w-full bg-surface-3 border border-hairline rounded-apple-sm px-2 py-1.5 text-ink-1 text-xs focus:outline-none resize-none" />
                </div>
                <div>
                  <label className="text-ink-4 text-[10px] block mb-1">Telefon</label>
                  <input type="text" defaultValue={selected.telefon||''} onBlur={e => updateCollab('telefon', e.target.value)}
                    className="w-full bg-surface-3 border border-hairline rounded-apple-sm px-2 py-1.5 text-ink-1 text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="text-ink-4 text-[10px] block mb-1">E-Mail</label>
                  <input type="text" defaultValue={selected.email||''} onBlur={e => updateCollab('email', e.target.value)}
                    className="w-full bg-surface-3 border border-hairline rounded-apple-sm px-2 py-1.5 text-ink-1 text-xs focus:outline-none" />
                </div>
              </div>
              <div className="bg-surface-2 rounded-apple-sm p-3 space-y-2">
                <div className="text-ink-3 text-[10px] uppercase tracking-wider">Bestellung &amp; Tracking</div>
                {bestellungen.length === 0 && (
                <div className="space-y-1.5">
                  <div className="text-ink-4 text-xs">Keine Bestellung</div>
                  <button onClick={markVersendet} className="w-full text-[11px] font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-apple-sm px-2 py-1.5 transition-colors">&#128230; Als versendet markieren</button>
                  <input
                    placeholder="Oder Tracking-Nummer eintragen..."
                    onBlur={e => { if (e.target.value.trim()) { createBestellungWithTracking(e.target.value.trim()) } }}
                    className="w-full bg-surface-3 border border-hairline rounded-apple-sm px-2 py-1.5 text-ink-1 text-[11px] font-mono focus:outline-none"
                  />
                </div>
              )}
                {bestellungen.map((b:any) => {
                  const st = b.status || 'Nicht versendet'
                  const farbe = st === 'Angekommen' ? 'bg-emerald-500/15 text-emerald-400' : (st === 'Nicht versendet' ? 'bg-surface-3/40 text-ink-2' : 'bg-blue-500/15 text-blue-400')
                  const dhl = dhlTracking[b.id]
                  return (
                    <div key={b.id} className="space-y-1">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-ink-2 text-xs truncate">{b.produkt || 'Produkt'}</span>
                        <select value={st} onChange={e => updateBestellungStatus(b, e.target.value)}
                          className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 border-0 cursor-pointer focus:outline-none ${farbe}`}>
                          <option value="Nicht versendet">Nicht versendet</option>
                          <option value="Versendet">Versendet</option>
                          <option value="Angekommen">Angekommen</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-1">
                        <input key={b.id} defaultValue={b.tracking_nummer || ""} placeholder="Tracking-Nummer" onBlur={e => { if (e.target.value !== (b.tracking_nummer || "")) { updateBestellungField(b.id, "tracking_nummer", e.target.value) } }} className="flex-1 bg-surface-3 border border-hairline rounded-apple-sm px-2 py-1 text-ink-1 text-[11px] font-mono focus:outline-none" />
                        {b.tracking_nummer && (
                          <button onClick={() => trackShipment(b)} disabled={dhlLoading === b.id} title="DHL-Status abrufen" className="text-ink-3 hover:text-ink-1 text-xs px-1.5 transition-colors">
                            {dhlLoading === b.id ? <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin inline-block"/> : '↻'}
                          </button>
                        )}
                      </div>
                      {dhl && !dhl.error && (
                        <div className="text-[10px] text-ink-3">{dhl.description}{dhl.lastUpdate ? ' · ' + new Date(dhl.lastUpdate).toLocaleDateString('de-DE') : ''}</div>
                      )}
                      {dhl?.error && (
                        <div className="text-[10px] text-red-400/70">DHL: {dhl.error}</div>
                      )}
                    </div>
                  )
                })}
                <a href="/bestellungen" className="text-ink-4 text-[10px] pt-1 block hover:text-accent transition-colors">&rarr; in Bestellbereich bearbeiten</a>
              </div>
              <div className="bg-surface-2 rounded-apple-sm p-3 space-y-1.5">
                <div className="text-ink-3 text-[10px] uppercase tracking-wider mb-1">Reichweite</div>
                <div className="flex justify-between text-xs"><span className="text-ink-4">IG Follower</span><span className="text-ink-2">{(selected.ig_follower||0).toLocaleString('de-DE')}</span></div>
                <div className="flex justify-between text-xs"><span className="text-ink-4">TT Follower</span><span className="text-ink-2">{(selected.tt_follower||0).toLocaleString('de-DE')}</span></div>
                <div className="flex justify-between text-xs"><span className="text-ink-4">Tier</span><span className="text-ink-2">{selected.overall_tier||'—'}</span></div>
              </div>
              {(selected.ig_gender_female || selected.ig_gender_male || selected.ig_top_age || (selected.ig_top_countries?.length)) ? (
                <div className="bg-surface-2 rounded-apple-sm p-3 space-y-1.5">
                  <div className="text-ink-3 text-[10px] uppercase tracking-wider mb-1">Audience</div>
                  {(selected.ig_gender_female || selected.ig_gender_male) ? (
                    <div className="flex justify-between text-xs"><span className="text-ink-4">Geschlecht</span><span className="text-ink-2">&#9792; {selected.ig_gender_female||0}% &middot; &#9794; {selected.ig_gender_male||0}%</span></div>
                  ) : null}
                  {selected.ig_top_age ? <div className="flex justify-between text-xs"><span className="text-ink-4">Top-Alter</span><span className="text-ink-2">{String(selected.ig_top_age).replace('_','-')}</span></div> : null}
                  {(selected.ig_top_countries?.length) ? (
                    <div className="flex justify-between text-xs"><span className="text-ink-4">Top-Land</span><span className="text-ink-2">{selected.ig_top_countries[0]?.name} {selected.ig_top_countries[0]?.pct}%</span></div>
                  ) : null}
                  {selected.ig_real_followers ? <div className="flex justify-between text-xs"><span className="text-ink-4">Echte Follower</span><span className="text-ink-2">{selected.ig_real_followers}%</span></div> : null}
                </div>
              ) : null}
              {(selected.ig_er || selected.tt_er || selected.ig_avg_reel_views || selected.story_views) ? (
                <div className="bg-surface-2 rounded-apple-sm p-3 space-y-1.5">
                  <div className="text-ink-3 text-[10px] uppercase tracking-wider mb-1">Engagement</div>
                  {selected.ig_er ? <div className="flex justify-between text-xs"><span className="text-ink-4">IG ER</span><span className="text-ink-2">{selected.ig_er}%</span></div> : null}
                  {selected.tt_er ? <div className="flex justify-between text-xs"><span className="text-ink-4">TT ER</span><span className="text-ink-2">{selected.tt_er}%</span></div> : null}
                  {selected.ig_avg_reel_views ? <div className="flex justify-between text-xs"><span className="text-ink-4">&Oslash; Reel Views</span><span className="text-ink-2">{(selected.ig_avg_reel_views||0).toLocaleString('de-DE')}</span></div> : null}
                  {selected.ig_avg_likes ? <div className="flex justify-between text-xs"><span className="text-ink-4">&Oslash; Likes</span><span className="text-ink-2">{(selected.ig_avg_likes||0).toLocaleString('de-DE')}</span></div> : null}
                  {selected.story_views ? <div className="flex justify-between text-xs"><span className="text-ink-4">Story Views</span><span className="text-ink-2">{(selected.story_views||0).toLocaleString('de-DE')}</span></div> : null}
                </div>
              ) : null}
              {(selected.tkp_reel || selected.tkp_story || selected.tkp_tt || selected.reel_wert || selected.story_wert || selected.tt_wert) ? (
                <div className="bg-surface-2 rounded-apple-sm p-3 space-y-1.5">
                  <div className="text-ink-3 text-[10px] uppercase tracking-wider mb-1">TKP &amp; Werte</div>
                  {selected.tkp_reel ? <div className="flex justify-between text-xs"><span className="text-ink-4">TKP Reel</span><span className="text-ink-2">{selected.tkp_reel} &euro;</span></div> : null}
                  {selected.tkp_story ? <div className="flex justify-between text-xs"><span className="text-ink-4">TKP Story</span><span className="text-ink-2">{selected.tkp_story} &euro;</span></div> : null}
                  {selected.tkp_tt ? <div className="flex justify-between text-xs"><span className="text-ink-4">TKP TikTok</span><span className="text-ink-2">{selected.tkp_tt} &euro;</span></div> : null}
                  {selected.reel_wert ? <div className="flex justify-between text-xs"><span className="text-ink-4">Reel-Wert</span><span className="text-ink-2">{(selected.reel_wert||0).toLocaleString('de-DE')} &euro;</span></div> : null}
                  {selected.story_wert ? <div className="flex justify-between text-xs"><span className="text-ink-4">Story-Wert</span><span className="text-ink-2">{(selected.story_wert||0).toLocaleString('de-DE')} &euro;</span></div> : null}
                  {selected.tt_wert ? <div className="flex justify-between text-xs"><span className="text-ink-4">TikTok-Wert</span><span className="text-ink-2">{(selected.tt_wert||0).toLocaleString('de-DE')} &euro;</span></div> : null}
                </div>
              ) : null}
              <div>
                <label className="text-ink-4 text-xs block mb-2">Leistungen</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Reel','Story','Post','Carousel','Video','TikTok'].map(l => {
                    const aktiv = (selected.leistungen||'').split(',').filter(Boolean).includes(l)
                    return (
                      <button key={l} onClick={() => {
                        const arr = (selected.leistungen||'').split(',').filter(Boolean)
                        const next = aktiv ? arr.filter((x:string) => x !== l) : [...arr, l]
                        updateCollab('leistungen', next.join(','))
                      }} className={`text-xs px-2.5 py-1 rounded-apple-sm border transition-colors ${aktiv ? 'bg-accent border-accent text-ink-1' : 'border-white/[0.1] text-ink-3 hover:text-ink-2'}`}>
                        {l}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="text-ink-4 text-xs block mb-1">Status</label>
                <select value={selected.status||'Offen'} onChange={e => updateCollab('status', e.target.value)}
                  className="w-full bg-surface-2 border border-hairline rounded-apple-sm px-2 py-1.5 text-ink-1 text-xs focus:outline-none">
                  <option>Offen</option><option>In Verhandlung</option><option>Deal</option><option>Abgesagt</option>
                </select>
              </div>
              <div>
                <label className="text-ink-4 text-xs block mb-1">Kampagne</label>
                <select value={selected.kampagne||''} onChange={e => updateCollab('kampagne', e.target.value)}
                  className="w-full bg-surface-2 border border-hairline rounded-apple-sm px-2 py-1.5 text-ink-1 text-xs focus:outline-none">
                  <option value="">—</option>
                  {kampagnenList.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label className="text-ink-4 text-xs block mb-1">Fee €</label>
                <input type="number" defaultValue={selected.fee||0} onBlur={e => updateCollab('fee', Number(e.target.value)||0)}
                  className="w-full bg-surface-2 border border-hairline rounded-apple-sm px-2 py-1.5 text-ink-1 text-xs focus:outline-none" />
              </div>
              <div>
                <label className="text-ink-4 text-xs block mb-1">Promo-Code</label>
                <input type="text" defaultValue={selected.promo_code||''} onBlur={e => updateCollab('promo_code', e.target.value)}
                  className="w-full bg-surface-2 border border-hairline rounded-apple-sm px-2 py-1.5 text-ink-1 text-xs focus:outline-none" />
              </div>
              <div>
                <label className="text-ink-4 text-xs block mb-1">Provision</label>
                <input type="text" defaultValue={selected.affiliate_pct||'15%'} onBlur={e => updateCollab('affiliate_pct', e.target.value)}
                  className="w-full bg-surface-2 border border-hairline rounded-apple-sm px-2 py-1.5 text-ink-1 text-xs focus:outline-none" />
              </div>
              <div>
                <label className="text-ink-4 text-xs block mb-1">Notizen</label>
                <textarea defaultValue={selected.notizen||''} onBlur={e => updateCollab('notizen', e.target.value)} rows={4}
                  className="w-full bg-surface-2 border border-hairline rounded-apple-sm px-2 py-1.5 text-ink-1 text-xs focus:outline-none resize-none" />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default function Outreach() {
  return (
    <Suspense fallback={null}>
      <OutreachInner />
    </Suspense>
  )
}
