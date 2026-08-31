'use client'
import { useState, useEffect } from 'react'
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


type Stylist = {
  id: string
  name: string
  management: string
  telefon: string
  email: string
  adresse: string
  notizen: string
  status: string
  kampagne?: string
  fee?: number
  fee_bezahlt?: boolean
  fee_faellig_am?: string
  ig?: string
  ig_follower?: number
  ig_tier?: string
  ig_image?: string
  tt_image?: string
  ig_verified?: boolean
}

const statusStyle: Record<string, string> = {
  'Deal': 'text-emerald-400 bg-emerald-950 border border-emerald-800/30',
  'In Verhandlung': 'text-amber-400 bg-amber-950 border border-amber-800/30',
  'Offen': 'text-ink-2 bg-surface-3 border border-hairline/50',
  'Abgesagt': 'text-red-400 bg-red-950 border border-red-800/30',
}

const emptyForm = { name: '', management: '', telefon: '', email: '', adresse: '', notizen: '', ig: '' }

export default function StylistenPage() {
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const getToken = async () => { const { data } = await sb.auth.getSession(); return data.session?.access_token || '' }

  const [stylisten, setStylisten] = useState<Stylist[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Stylist | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editingIg, setEditingIg] = useState(false)
  const [igInput, setIgInput] = useState('')
  const [igSaving, setIgSaving] = useState(false)
  const [igError, setIgError] = useState('')
  const [kampagnenList, setKampagnenList] = useState<string[]>([])

  const [nachrichten, setNachrichten] = useState<any[]>([])
  const [loadingChat, setLoadingChat] = useState(false)
  const [neueNachricht, setNeueNachricht] = useState('')
  const [chatRichtung, setChatRichtung] = useState<'raus'|'rein'>('rein')
  const [chatKanal, setChatKanal] = useState('Instagram')
  const [sendingChat, setSendingChat] = useState(false)

  const load = async () => {
    setLoading(true)
    const token = await getToken()
    const res = await fetch('/api/creators?type=stylist', { headers: { authorization: 'Bearer ' + token } })
    const data = await res.json()
    if (Array.isArray(data)) setStylisten(data)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  useEffect(() => {
    sb.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token || ''
      const res = await fetch('/api/kampagnen', { headers: { authorization: 'Bearer ' + token } })
      const d = await res.json()
      if (Array.isArray(d)) setKampagnenList(d.map((k: any) => k.name))
    })
  }, [])

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
  }, [selected?.id])

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
      }
    } finally { setSendingChat(false) }
  }

  const openAdd = () => { setForm(emptyForm); setSaveError(''); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setSaveError(''); setForm(emptyForm) }

  const handleSave = async () => {
    if (!form.name.trim()) return
    if (saving) return
    setSaveError('')
    const nameNorm = form.name.trim().toLowerCase()
    const igHandle = form.ig.trim().replace('@', '')
    const igNorm = igHandle.toLowerCase()
    const isDup = stylisten.some(c => (c.name || '').trim().toLowerCase() === nameNorm || (igNorm && (c.ig || '').replace('@', '').toLowerCase() === igNorm))
    if (isDup) { setSaveError('Diese Person ist bereits bei Stylisten in der Liste.'); return }
    setSaving(true)
    let igData: any = {}
    if (igHandle) {
      try {
        const token0 = await getToken()
        const res0 = await fetch('/api/creator?ig=' + encodeURIComponent(igHandle), { headers: { authorization: 'Bearer ' + token0 } })
        const d0 = await res0.json()
        if (!d0.error) igData = d0
      } catch {}
    }
    const token = await getToken()
    const res = await fetch('/api/creators', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token },
      body: JSON.stringify({
        name: form.name.trim(), type: 'stylist',
        management: form.management, telefon: form.telefon, email: form.email,
        adresse: form.adresse, notizen: form.notizen, status: 'Offen',
        ig: igHandle ? '@' + igHandle : '',
        ig_follower: igData.igFollower || 0,
        ig_tier: igData.igTier || '',
        ig_image: igData.igImage || '',
        ig_verified: igData.igVerified || false,
        ig_er: igData.igEr || 0,
        ig_avg_likes: igData.igAvgLikes || 0,
      })
    })
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      setSaveError(errData.error || 'Fehler beim Speichern')
      setSaving(false)
      return
    }
    await load()
    setSaving(false)
    closeModal()
  }

  const updateSelected = async (fields: Record<string, any>) => {
    if (!selected) return
    setSelected(p => p ? { ...p, ...fields } : p)
    setStylisten(prev => prev.map(c => c.id === selected.id ? { ...c, ...fields } : c))
    const token = await getToken()
    await fetch('/api/creators/' + selected.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token },
      body: JSON.stringify(fields)
    })
  }

  const startEditIg = () => {
    if (!selected) return
    setIgInput((selected.ig || '').replace('@', ''))
    setIgError('')
    setEditingIg(true)
  }

  const saveIg = async () => {
    if (!selected) return
    const handle = igInput.trim().replace('@', '')
    setIgSaving(true)
    setIgError('')
    try {
      const fields: Record<string, any> = { ig: handle ? '@' + handle : '' }
      if (handle) {
        const token = await getToken()
        const res = await fetch('/api/creator?ig=' + encodeURIComponent(handle), { headers: { authorization: 'Bearer ' + token } })
        const d = await res.json()
        if (d.error) throw new Error(d.error)
        fields.ig_follower = d.igFollower || 0
        fields.ig_tier = d.igTier || ''
        fields.ig_image = d.igImage || ''
        fields.ig_verified = d.igVerified || false
        fields.ig_er = d.igEr || 0
        fields.ig_avg_likes = d.igAvgLikes || 0
      } else {
        fields.ig_follower = 0
        fields.ig_tier = ''
        fields.ig_image = ''
        fields.ig_verified = false
      }
      await updateSelected(fields)
      setEditingIg(false)
    } catch (e: any) {
      setIgError(e.message || 'Fehler beim Laden der Instagram-Daten')
    } finally {
      setIgSaving(false)
    }
  }

  const deleteSelected = async () => {
    if (!selected) return
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    const token = await getToken()
    await fetch('/api/creators/' + selected.id, { method: 'DELETE', headers: { authorization: 'Bearer ' + token } })
    setStylisten(prev => prev.filter(c => c.id !== selected.id))
    setSelected(null)
    setConfirmDelete(false)
    setDeleting(false)
  }

  const filtered = stylisten.filter(c => {
    const s = search.toLowerCase()
    return !s || (c.name || '').toLowerCase().includes(s) || (c.management || '').toLowerCase().includes(s)
  })

  const initials = (name: string) => (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const inputCls = "w-full bg-surface-0 border border-hairline rounded-apple-sm px-4 py-2.5 text-ink-1 text-sm placeholder-gray-700 focus:outline-none focus:border-accent/50 transition-colors"
  const labelCls = "text-ink-3 text-xs block mb-1.5"

  return (
    <div className="flex min-h-screen bg-surface-0">
      <Sidebar />
      <main className="flex-1 md:ml-60 min-h-screen">
        <div className="border-b border-hairline-soft px-8 py-4 bg-surface-0/80 backdrop-blur sticky top-0 z-20 flex items-center justify-between">
          <div>
            <h1 className="text-ink-1 font-semibold text-lg">Stylisten</h1>
            <p className="text-ink-3 text-xs mt-0.5">Stylisten für Kooperationen, Shootings und Kontakt</p>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 px-3 py-1.5 rounded-apple-sm bg-accent text-ink-1 text-xs hover:bg-accent-hover shadow-[0_6px_20px_-4px_rgba(10,132,255,0.55)] transition-colors font-medium">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Stylist hinzufügen
          </button>
        </div>

        <div className="p-8 space-y-4 max-w-5xl">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Suchen..."
            className="w-full max-w-sm bg-surface-2 border border-hairline rounded-apple-sm px-3 py-2 text-sm text-ink-1 focus:outline-none focus:border-accent" />

          <div className="bg-surface-2 rounded-apple-lg border border-hairline-soft overflow-hidden">
            {loading && <div className="p-6 text-ink-4 text-sm">Lädt...</div>}
            {!loading && filtered.length === 0 && <div className="p-6 text-ink-4 text-sm">Noch keine Stylisten hinzugefügt.</div>}
            {!loading && filtered.map(c => (
              <button key={c.id} onClick={() => { setSelected(c); setConfirmDelete(false); setEditingIg(false) }}
                className="w-full flex items-center gap-4 px-6 py-4 border-b border-hairline-soft last:border-b-0 text-left hover:bg-white/[0.03] transition-colors">
                <div className="w-10 h-10 rounded-full bg-[#00C7BE]/20 flex items-center justify-center text-[#00C7BE] text-sm font-semibold flex-shrink-0 overflow-hidden">
                  {(c.tt_image || c.ig_image) ? <img src={avatarSrc(c.tt_image || c.ig_image)} alt="" className="w-full h-full object-cover" onError={avatarOnError(c.tt_image ? c.ig_image : null)} /> : initials(c.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-ink-1 text-sm font-medium truncate">{c.name}</div>
                  <div className="text-ink-4 text-xs truncate">
                    {c.ig ? `${c.ig} · ${(c.ig_follower || 0).toLocaleString('de-DE')} Follower` : (c.management || 'Kein Management hinterlegt')}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-md flex-shrink-0 ${statusStyle[c.status] || statusStyle['Offen']}`}>{c.status || 'Offen'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Detail Slide-over */}
        {selected && (
          <div className="fixed inset-0 z-50 flex" onClick={() => { setSelected(null); setConfirmDelete(false); setEditingIg(false) }}>
            <div className="flex-1 bg-black/60 backdrop-blur-sm" />
            <div className="w-full max-w-md bg-surface-0 border-l border-hairline h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-5 border-b border-hairline-soft sticky top-0 bg-surface-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#00C7BE]/20 flex items-center justify-center text-[#00C7BE] font-semibold text-lg overflow-hidden">
                    {(selected.tt_image || selected.ig_image) ? <img src={avatarSrc(selected.tt_image || selected.ig_image)} alt="" className="w-full h-full object-cover" onError={avatarOnError(selected.tt_image ? selected.ig_image : null)} /> : initials(selected.name)}
                  </div>
                  <div>
                    <div className="text-ink-1 font-semibold text-base flex items-center gap-1.5">
                      {selected.name}
                      {selected.ig_verified && <span className="text-blue-400 text-sm">✓</span>}
                    </div>
                    <select value={selected.status || 'Offen'} onChange={e => updateSelected({ status: e.target.value })}
                      className={`text-xs px-2 py-0.5 rounded-md border-0 cursor-pointer ${statusStyle[selected.status] || statusStyle['Offen']} bg-transparent`}>
                      <option>Offen</option><option>In Verhandlung</option><option>Deal</option><option>Abgesagt</option>
                    </select>
                  </div>
                </div>
                <button onClick={() => { setSelected(null); setConfirmDelete(false); setEditingIg(false) }} className="w-8 h-8 rounded-apple-sm bg-white/[0.05] flex items-center justify-center text-ink-2 hover:text-ink-1 text-lg">×</button>
              </div>

              <div className="p-6 flex flex-col gap-4">
                <div className="bg-surface-2 rounded-apple-sm p-4 space-y-3 border border-hairline-soft">
                  <div className="text-ink-3 text-[10px] uppercase tracking-wider">Nachrichtenverlauf</div>
                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                    {loadingChat && <div className="text-ink-4 text-xs text-center">Lädt...</div>}
                    {!loadingChat && nachrichten.length === 0 && <div className="text-ink-4 text-xs text-center py-2">Noch keine Nachrichten</div>}
                    {nachrichten.map((m:any) => {
                      const raus = m.richtung === 'raus'
                      return (
                        <div key={m.id} className={`flex ${raus ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-apple-sm px-3 py-1.5 ${raus ? 'bg-accent text-ink-1' : 'bg-surface-3 text-ink-1 border border-hairline-soft'}`}>
                            <div className="text-xs whitespace-pre-wrap break-words">{m.notiz}</div>
                            <div className={`text-[9px] mt-0.5 ${raus ? 'text-ink-1/60' : 'text-ink-4'}`}>{m.kanal} · {m.datum || ''}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setChatRichtung('rein')} className={`text-[10px] px-2 py-1 rounded-apple-sm ${chatRichtung==='rein' ? 'bg-emerald-500/20 text-emerald-400' : 'text-ink-3 hover:text-ink-2'}`}>Von Stylist</button>
                    <button onClick={() => setChatRichtung('raus')} className={`text-[10px] px-2 py-1 rounded-apple-sm ${chatRichtung==='raus' ? 'bg-accent/20 text-accent' : 'text-ink-3 hover:text-ink-2'}`}>Von mir</button>
                    <select value={chatKanal} onChange={e => setChatKanal(e.target.value)} className="bg-surface-3 border border-hairline rounded-apple-sm px-1.5 py-1 text-[10px] text-ink-2 focus:outline-none ml-auto">
                      <option>Instagram</option><option>Mail</option><option>Telefon</option><option>Sonstiges</option>
                    </select>
                  </div>
                  <div className="flex items-end gap-1.5">
                    <textarea value={neueNachricht} onChange={e => setNeueNachricht(e.target.value)} rows={2} placeholder="Nachricht..."
                      className="flex-1 bg-surface-3 border border-hairline rounded-apple-sm px-2 py-1.5 text-xs text-ink-1 focus:outline-none focus:border-accent resize-none" />
                    <button onClick={sendeNachricht} disabled={sendingChat || !neueNachricht.trim()}
                      className={`px-3 py-2 rounded-apple-sm text-xs text-ink-1 ${sendingChat||!neueNachricht.trim() ? 'bg-accent/40' : 'bg-accent hover:bg-accent-hover'}`}>
                      {sendingChat ? '...' : 'Senden'}
                    </button>
                  </div>
                </div>

                <div className="bg-surface-2 rounded-apple-sm p-4 space-y-3 border border-hairline-soft">
                  <div className="text-ink-3 text-[10px] uppercase tracking-wider">Instagram</div>
                  {!editingIg && <div className="flex items-center justify-between">
                    <span/>
                    <button onClick={startEditIg} className="text-ink-4 hover:text-accent text-[10px] px-1.5 py-0.5 rounded hover:bg-white/[0.05] transition-colors">Bearbeiten</button>
                  </div>}
                  {!editingIg ? (
                    selected.ig ? (
                      <div className="flex items-center justify-between">
                        <a href={`https://instagram.com/${selected.ig.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                          className="text-ink-2 hover:text-accent text-xs underline decoration-dotted underline-offset-2">{selected.ig} ↗</a>
                        <span className="text-ink-4 text-xs">{(selected.ig_follower || 0).toLocaleString('de-DE')} Follower</span>
                      </div>
                    ) : (
                      <p className="text-ink-4 text-xs">Kein Instagram-Handle hinterlegt.</p>
                    )
                  ) : (
                    <div className="space-y-2">
                      <input type="text" value={igInput} onChange={e => setIgInput(e.target.value)} placeholder="@instagram"
                        className="w-full bg-surface-3 border border-hairline rounded-apple-sm px-2 py-1.5 text-ink-1 text-xs focus:outline-none" />
                      <div className="flex items-center gap-2">
                        <button onClick={saveIg} disabled={igSaving} className="px-2 py-1 rounded-apple-sm bg-accent text-ink-1 text-xs hover:bg-accent-hover disabled:opacity-50">{igSaving ? 'Lädt Follower...' : 'Speichern + Follower laden'}</button>
                        <button onClick={() => setEditingIg(false)} className="px-2 py-1 rounded-apple-sm bg-white/[0.05] text-ink-2 text-xs hover:text-ink-1">Abbrechen</button>
                      </div>
                      {igError && <p className="text-red-400 text-[10px]">{igError}</p>}
                    </div>
                  )}
                </div>

                <div className="bg-surface-2 rounded-apple-sm p-4 space-y-3 border border-hairline-soft">
                  <div className="text-ink-3 text-[10px] uppercase tracking-wider">Kontakt &amp; Management</div>
                  <div>
                    <label className="text-ink-4 text-[10px] block mb-1">Management / Agentur</label>
                    <input type="text" defaultValue={selected.management || ''} onBlur={e => updateSelected({ management: e.target.value })}
                      className="w-full bg-surface-3 border border-hairline rounded-apple-sm px-2 py-1.5 text-ink-1 text-xs focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-ink-4 text-[10px] block mb-1">Telefon</label>
                    <input type="text" defaultValue={selected.telefon || ''} onBlur={e => updateSelected({ telefon: e.target.value })}
                      className="w-full bg-surface-3 border border-hairline rounded-apple-sm px-2 py-1.5 text-ink-1 text-xs focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-ink-4 text-[10px] block mb-1">E-Mail</label>
                    <input type="text" defaultValue={selected.email || ''} onBlur={e => updateSelected({ email: e.target.value })}
                      className="w-full bg-surface-3 border border-hairline rounded-apple-sm px-2 py-1.5 text-ink-1 text-xs focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-ink-4 text-[10px] block mb-1">Adresse</label>
                    <textarea defaultValue={selected.adresse || ''} onBlur={e => updateSelected({ adresse: e.target.value })} rows={2}
                      className="w-full bg-surface-3 border border-hairline rounded-apple-sm px-2 py-1.5 text-ink-1 text-xs focus:outline-none resize-none" />
                  </div>
                </div>

                <div className="bg-surface-2 rounded-apple-sm p-4 space-y-3 border border-hairline-soft">
                  <div className="text-ink-3 text-[10px] uppercase tracking-wider">Kampagne &amp; Zahlung</div>
                  <div>
                    <label className="text-ink-4 text-[10px] block mb-1">Kampagne</label>
                    <select value={selected.kampagne || ''} onChange={e => updateSelected({ kampagne: e.target.value })}
                      className="w-full bg-surface-3 border border-hairline rounded-apple-sm px-2 py-1.5 text-ink-1 text-xs focus:outline-none">
                      <option value="">—</option>
                      {kampagnenList.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-ink-4 text-[10px] block mb-1">Fee €</label>
                      <input type="number" defaultValue={selected.fee || 0} onBlur={e => updateSelected({ fee: Number(e.target.value) || 0 })}
                        className="w-full bg-surface-3 border border-hairline rounded-apple-sm px-2 py-1.5 text-ink-1 text-xs focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-ink-4 text-[10px] block mb-1">Fällig am</label>
                      <input type="date" defaultValue={selected.fee_faellig_am || ''} onBlur={e => updateSelected({ fee_faellig_am: e.target.value || null })}
                        className="w-full bg-surface-3 border border-hairline rounded-apple-sm px-2 py-1.5 text-ink-1 text-xs focus:outline-none" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!selected.fee_bezahlt} onChange={e => updateSelected({ fee_bezahlt: e.target.checked, fee_bezahlt_am: e.target.checked ? new Date().toISOString().slice(0,10) : null })}
                      className="w-3.5 h-3.5 accent-emerald-500" />
                    <span className="text-ink-2 text-xs">Bezahlt</span>
                  </label>
                </div>

                <div>
                  <label className="text-ink-4 text-xs block mb-1">Notizen</label>
                  <textarea defaultValue={selected.notizen || ''} onBlur={e => updateSelected({ notizen: e.target.value })} rows={4}
                    className="w-full bg-surface-2 border border-hairline rounded-apple-sm px-2 py-1.5 text-ink-1 text-xs focus:outline-none resize-none" />
                </div>

                <button onClick={deleteSelected} disabled={deleting}
                  className={`w-full py-2.5 rounded-apple-sm text-sm font-medium transition-colors ${confirmDelete ? 'bg-red-600 text-ink-1 hover:bg-red-500' : 'bg-red-950/30 text-red-400 hover:bg-red-950/50 border border-red-500/20'}`}>
                  {deleting ? 'Löscht...' : confirmDelete ? 'Wirklich löschen?' : 'Stylist löschen'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add Stylist */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeModal}>
            <div className="bg-surface-2 rounded-apple-lg w-full max-w-md border border-hairline max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-5 border-b border-hairline-soft">
                <div>
                  <h2 className="text-ink-1 font-semibold">Stylist hinzufügen</h2>
                  <p className="text-ink-3 text-xs mt-0.5">Name + Kontakt/Management, optional Instagram</p>
                </div>
                <button onClick={closeModal} className="w-8 h-8 rounded-apple-sm bg-white/[0.05] flex items-center justify-center text-ink-2 hover:text-ink-1 text-lg">×</button>
              </div>

              <div className="overflow-y-auto p-6 flex flex-col gap-3">
                <div>
                  <label className={labelCls}>Name *</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="z.B. Max Mustermann" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Instagram Handle</label>
                  <input value={form.ig} onChange={e => setForm(p => ({ ...p, ig: e.target.value }))} placeholder="@username — Follower werden automatisch geladen" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Management / Agentur</label>
                  <input value={form.management} onChange={e => setForm(p => ({ ...p, management: e.target.value }))} placeholder="Agentur oder Ansprechpartner" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Telefon</label>
                  <input value={form.telefon} onChange={e => setForm(p => ({ ...p, telefon: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>E-Mail</label>
                  <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Adresse</label>
                  <textarea value={form.adresse} onChange={e => setForm(p => ({ ...p, adresse: e.target.value }))} rows={2}
                    className="w-full bg-surface-0 border border-hairline rounded-apple-sm px-4 py-2.5 text-ink-1 text-sm placeholder-gray-700 focus:outline-none resize-none" />
                </div>
                <div>
                  <label className={labelCls}>Notizen</label>
                  <textarea value={form.notizen} onChange={e => setForm(p => ({ ...p, notizen: e.target.value }))} placeholder="Kontext, Idee fürs Styling/Shooting..." rows={2}
                    className="w-full bg-surface-0 border border-hairline rounded-apple-sm px-4 py-2.5 text-ink-1 text-sm placeholder-gray-700 focus:outline-none resize-none" />
                </div>

                {saveError && (
                  <div className="bg-red-950/30 border border-red-500/20 rounded-apple-sm px-4 py-3">
                    <p className="text-red-400 text-xs">{saveError}</p>
                  </div>
                )}

                <button onClick={handleSave} disabled={!form.name.trim() || saving}
                  className={`w-full py-3 rounded-apple-sm text-sm font-medium transition-colors ${form.name.trim() ? 'bg-accent text-ink-1 hover:bg-accent-hover shadow-[0_6px_20px_-4px_rgba(10,132,255,0.55)]' : 'bg-white/[0.05] text-ink-4 cursor-not-allowed'}`}>
                  {saving ? 'Speichert...' : 'Stylist hinzufügen'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
