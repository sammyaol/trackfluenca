'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import Sidebar from '../components/Sidebar'
import { createBrowserClient } from '@supabase/ssr'

const avatarSrc = (url?: string | null) => {
  if (!url) return url as any
  if (url.includes('cdninstagram.com') || url.includes('fbcdn.net') || url.includes('tiktokcdn')) {
    return '/api/img-proxy?url=' + encodeURIComponent(url)
  }
  return url
}

type Reel = {
  id: string
  title?: string
  category?: string
  video_path: string
  video_url: string
  creator_ids: string[]
  created_at: string
}

type CreatorLite = {
  id: string
  name: string
  ig?: string
  tt?: string
  ig_image?: string
  tt_image?: string
}

const emptyForm = { title: '', category: '', creatorIds: [] as string[] }

export default function ReelsPage() {
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const getToken = async () => { const { data } = await sb.auth.getSession(); return data.session?.access_token || '' }

  const [reels, setReels] = useState<Reel[]>([])
  const [creators, setCreators] = useState<CreatorLite[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [creatorFilter, setCreatorFilter] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [creatorSearch, setCreatorSearch] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    setLoading(true)
    const token = await getToken()
    const [reelsRes, creatorsRes, celebsRes] = await Promise.all([
      fetch('/api/reels', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/creators?type=creator', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/creators?type=celeb', { headers: { Authorization: `Bearer ${token}` } }),
    ])
    const [reelsData, creatorsData, celebsData] = await Promise.all([reelsRes.json(), creatorsRes.json(), celebsRes.json()])
    setReels(Array.isArray(reelsData) ? reelsData : [])
    setCreators([...(Array.isArray(creatorsData) ? creatorsData : []), ...(Array.isArray(celebsData) ? celebsData : [])])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const creatorById = useMemo(() => {
    const m: Record<string, CreatorLite> = {}
    creators.forEach(c => { m[c.id] = c })
    return m
  }, [creators])

  const categories = useMemo(() => {
    const s = new Set<string>()
    reels.forEach(r => { if (r.category) s.add(r.category) })
    return Array.from(s).sort()
  }, [reels])

  const filtered = reels.filter(r => {
    const s = search.toLowerCase()
    const matchesSearch = !s || (r.title || '').toLowerCase().includes(s) || (r.category || '').toLowerCase().includes(s)
    const matchesCategory = !categoryFilter || r.category === categoryFilter
    const matchesCreator = !creatorFilter || r.creator_ids.includes(creatorFilter)
    return matchesSearch && matchesCategory && matchesCreator
  })

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFile(null)
    setUploadError('')
    setCreatorSearch('')
    setShowModal(true)
  }

  const openEdit = (r: Reel) => {
    setEditingId(r.id)
    setForm({ title: r.title || '', category: r.category || '', creatorIds: r.creator_ids || [] })
    setFile(null)
    setUploadError('')
    setCreatorSearch('')
    setShowModal(true)
  }

  const toggleCreator = (id: string) => {
    setForm(f => ({ ...f, creatorIds: f.creatorIds.includes(id) ? f.creatorIds.filter(x => x !== id) : [...f.creatorIds, id] }))
  }

  const save = async () => {
    setUploadError('')
    const token = await getToken()

    if (editingId) {
      setUploading(true)
      const res = await fetch(`/api/reels/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: form.title, category: form.category, creatorIds: form.creatorIds }),
      })
      setUploading(false)
      if (!res.ok) { setUploadError('Speichern fehlgeschlagen'); return }
      setShowModal(false)
      load()
      return
    }

    if (!file) { setUploadError('Bitte eine Videodatei auswählen'); return }
    setUploading(true)
    try {
      const urlRes = await fetch('/api/reels/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ filename: file.name }),
      })
      const urlData = await urlRes.json()
      if (!urlRes.ok) throw new Error(urlData.error || 'Upload-URL fehlgeschlagen')

      const { error: uploadErr } = await sb.storage.from('reels').uploadToSignedUrl(urlData.path, urlData.token, file)
      if (uploadErr) throw uploadErr

      const saveRes = await fetch('/api/reels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ path: urlData.path, title: form.title, category: form.category, creatorIds: form.creatorIds }),
      })
      const saveData = await saveRes.json()
      if (!saveRes.ok) throw new Error(saveData.error || 'Speichern fehlgeschlagen')

      setShowModal(false)
      load()
    } catch (e: any) {
      setUploadError(e.message || 'Upload fehlgeschlagen')
    } finally {
      setUploading(false)
    }
  }

  const deleteReel = async (id: string) => {
    const token = await getToken()
    await fetch(`/api/reels/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    setConfirmDeleteId(null)
    load()
  }

  const filteredCreatorsForModal = creators.filter(c => (c.name || '').toLowerCase().includes(creatorSearch.toLowerCase()))

  const inputCls = "w-full bg-surface-0 border border-hairline rounded-apple-sm px-4 py-2.5 text-ink-1 text-sm placeholder-gray-700 focus:outline-none focus:border-accent/50 transition-colors"
  const labelCls = "text-ink-3 text-xs block mb-1.5"

  return (
    <div className="flex min-h-screen bg-surface-0">
      <Sidebar />
      <main className="flex-1 md:ml-60 min-h-screen pb-20 md:pb-0">
        <div className="border-b border-hairline-soft px-8 py-4 bg-surface-0/80 backdrop-blur sticky top-0 z-20 flex items-center justify-between">
          <div>
            <h1 className="text-ink-1 font-semibold text-lg">Reels</h1>
            <p className="text-ink-3 text-xs mt-0.5">Beispiel-Videos hochladen, ansehen und sehen wer welche Art von Content produzieren kann</p>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 px-3 py-1.5 rounded-apple-sm bg-accent text-ink-1 text-xs hover:bg-accent-hover shadow-[0_6px_20px_-4px_rgba(10,132,255,0.55)] transition-colors font-medium">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Reel hochladen
          </button>
        </div>

        <div className="p-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Suchen..."
              className="w-full max-w-sm bg-surface-2 border border-hairline rounded-apple-sm px-3 py-2 text-sm text-ink-1 focus:outline-none focus:border-accent" />
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
              className="bg-surface-2 border border-hairline rounded-apple-sm px-3 py-2 text-sm text-ink-1 focus:outline-none focus:border-accent">
              <option value="">Alle Kategorien</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={creatorFilter} onChange={e => setCreatorFilter(e.target.value)}
              className="bg-surface-2 border border-hairline rounded-apple-sm px-3 py-2 text-sm text-ink-1 focus:outline-none focus:border-accent">
              <option value="">Alle Creator</option>
              {creators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {loading && <div className="text-ink-4 text-sm">Lädt...</div>}
          {!loading && filtered.length === 0 && <div className="text-ink-4 text-sm">Noch keine Reels hochgeladen.</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(r => (
              <div key={r.id} className="bg-surface-2 rounded-apple-lg border border-hairline-soft overflow-hidden flex flex-col">
                <video src={r.video_url} controls preload="metadata" className="w-full aspect-[9/16] bg-black object-cover" />
                <div className="p-3 flex flex-col gap-2 flex-1">
                  <div className="min-w-0">
                    <div className="text-ink-1 text-sm font-medium truncate">{r.title || 'Ohne Titel'}</div>
                    {r.category && <div className="text-ink-4 text-xs mt-0.5">{r.category}</div>}
                  </div>
                  {r.creator_ids.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {r.creator_ids.map(cid => {
                        const c = creatorById[cid]
                        if (!c) return null
                        return (
                          <span key={cid} className="inline-flex items-center gap-1.5 text-[10px] text-ink-2 bg-white/[0.05] rounded-full pl-1 pr-2 py-0.5">
                            <span className="w-4 h-4 rounded-full bg-[#30D158]/30 overflow-hidden flex items-center justify-center text-[8px] flex-shrink-0">
                              {(c.tt_image || c.ig_image) ? <img src={avatarSrc(c.tt_image || c.ig_image)} alt="" className="w-full h-full object-cover" /> : (c.name || '?')[0]}
                            </span>
                            {c.name}
                          </span>
                        )
                      })}
                    </div>
                  )}
                  <div className="mt-auto flex items-center gap-2 pt-1">
                    <a href={r.video_url} download className="flex-1 text-center text-xs px-2 py-1.5 rounded-apple-sm bg-white/[0.05] text-ink-2 hover:text-ink-1 hover:bg-white/[0.08] transition-colors">
                      Herunterladen
                    </a>
                    <button onClick={() => openEdit(r)} className="text-xs px-2 py-1.5 rounded-apple-sm bg-white/[0.05] text-ink-2 hover:text-ink-1 hover:bg-white/[0.08] transition-colors">
                      Bearbeiten
                    </button>
                    {confirmDeleteId === r.id ? (
                      <button onClick={() => deleteReel(r.id)} className="text-xs px-2 py-1.5 rounded-apple-sm bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors">
                        Sicher?
                      </button>
                    ) : (
                      <button onClick={() => setConfirmDeleteId(r.id)} className="text-xs px-2 py-1.5 rounded-apple-sm bg-white/[0.05] text-red-400 hover:bg-red-500/15 transition-colors">
                        Löschen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => !uploading && setShowModal(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-md bg-surface-0 border border-hairline rounded-apple-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-hairline-soft sticky top-0 bg-surface-0 z-10">
                <div className="text-ink-1 font-semibold text-sm">{editingId ? 'Reel bearbeiten' : 'Reel hochladen'}</div>
                <button onClick={() => !uploading && setShowModal(false)} className="w-7 h-7 rounded-apple-sm bg-white/[0.05] flex items-center justify-center text-ink-2 hover:text-ink-1 text-lg">×</button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                {!editingId && (
                  <div>
                    <label className={labelCls}>Videodatei</label>
                    <input ref={fileInputRef} type="file" accept="video/*" onChange={e => setFile(e.target.files?.[0] || null)}
                      className="w-full text-ink-2 text-xs file:mr-3 file:px-3 file:py-2 file:rounded-apple-sm file:border-0 file:bg-white/[0.08] file:text-ink-1 file:text-xs file:cursor-pointer" />
                  </div>
                )}
                <div>
                  <label className={labelCls}>Titel</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} placeholder="z.B. Unboxing Beispiel" />
                </div>
                <div>
                  <label className={labelCls}>Kategorie / Art des Videos</label>
                  <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inputCls} placeholder="z.B. Unboxing, Tanz, Testimonial" list="reel-categories" />
                  <datalist id="reel-categories">
                    {categories.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div>
                  <label className={labelCls}>Creator die diese Art von Video machen können</label>
                  <input value={creatorSearch} onChange={e => setCreatorSearch(e.target.value)} className={inputCls + ' mb-2'} placeholder="Creator suchen..." />
                  <div className="max-h-48 overflow-y-auto border border-hairline rounded-apple-sm divide-y divide-hairline-soft">
                    {filteredCreatorsForModal.map(c => (
                      <label key={c.id} className="flex items-center gap-2 px-3 py-2 text-xs text-ink-2 hover:bg-white/[0.03] cursor-pointer">
                        <input type="checkbox" checked={form.creatorIds.includes(c.id)} onChange={() => toggleCreator(c.id)} />
                        {c.name}
                      </label>
                    ))}
                    {filteredCreatorsForModal.length === 0 && <div className="px-3 py-2 text-xs text-ink-4">Keine Treffer</div>}
                  </div>
                </div>
                {uploadError && <div className="text-red-400 text-xs">{uploadError}</div>}
                <button onClick={save} disabled={uploading}
                  className="w-full py-2.5 rounded-apple-sm bg-accent text-ink-1 text-sm font-medium hover:bg-accent-hover shadow-[0_6px_20px_-4px_rgba(10,132,255,0.55)] transition-colors disabled:opacity-50">
                  {uploading ? 'Wird gespeichert...' : (editingId ? 'Speichern' : 'Hochladen')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
