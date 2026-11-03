'use client'
import Sidebar from '../components/Sidebar'
import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { fmtPreis, type Galerie, type GalerieItem, type Wunsch } from '@/lib/produkte'

const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const linkUrl = (token: string) => `${typeof window !== 'undefined' ? window.location.origin : 'https://kolure.trackfluenca.com'}/p/${token}`
const dat = (d?: string | null) => d ? new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''

export default function Produkte() {
  const [list, setList] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [edit, setEdit] = useState<Galerie | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'shop' | 'eigene'>('shop')
  const [custom, setCustom] = useState({ title: '', price: '', hinweis: '', images: [] as string[] })
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<string | null>(null)
  const [wuensche, setWuensche] = useState<{ g: any; list: Wunsch[] } | null>(null)
  const [drag, setDrag] = useState<string | null>(null)

  const getToken = async () => (await sb.auth.getSession()).data.session?.access_token || ''
  const api = async (url: string, method = 'GET', body?: any) => {
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + await getToken() }, body: body ? JSON.stringify(body) : undefined })
    return { ok: r.ok, j: await r.json().catch(() => ({})) }
  }
  const load = async () => { const { ok, j } = await api('/api/produkte'); if (ok) setList(j); setLoading(false) }
  useEffect(() => { load() }, [])
  useEffect(() => { if (edit && !products.length) api('/api/shop-products').then(({ ok, j }) => { if (ok) setProducts(j) }) }, [edit])
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { setWuensche(null); setEdit(null) } }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [])

  const copy = async (k: string, t: string) => { try { await navigator.clipboard.writeText(t); setCopied(k); setTimeout(() => setCopied(c => c === k ? null : c), 1500) } catch {} }
  const twoClick = (k: string, fn: () => void) => { if (confirm === k) { setConfirm(null); fn() } else setConfirm(k) }

  const openNew = () => { setEdit({ titel: '', label: '', sprache: 'de', beschreibung: '', max_auswahl: null, items: [] }); setError(''); setTab('shop') }
  const openEdit = (g: any) => { setEdit({ id: g.id, token: g.token, titel: g.titel || '', label: g.label || '', sprache: g.sprache === 'en' ? 'en' : 'de', beschreibung: g.beschreibung || '', max_auswahl: g.max_auswahl, items: g.items || [], status: g.status }); setError(''); setTab('shop') }

  const hasItem = (id: string) => !!edit?.items.some(i => i.id === id)
  const toggleShop = (p: any) => {
    if (!edit) return
    const id = String(p.id)
    if (hasItem(id)) setEdit({ ...edit, items: edit.items.filter(i => i.id !== id) })
    else setEdit({ ...edit, items: [...edit.items, { id, title: p.title, price: p.price, images: p.images?.length ? p.images : (p.image ? [p.image] : []), url: p.url, varianten: p.varianten || [], custom: false }] })
  }
  const addCustom = () => {
    if (!edit || !custom.title.trim()) { setError('Bitte einen Produktnamen eingeben.'); return }
    setEdit({ ...edit, items: [...edit.items, { id: 'c-' + crypto.randomUUID(), title: custom.title.trim(), price: custom.price || null, hinweis: custom.hinweis || null, images: custom.images, custom: true }] })
    setCustom({ title: '', price: '', hinweis: '', images: [] }); setError('')
  }
  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    try {
      const token = await getToken()
      const urls: string[] = []
      for (const f of Array.from(files).slice(0, 8)) {
        const r = await fetch('/api/produkte/upload-url', { method: 'POST', headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token }, body: JSON.stringify({ filename: f.name }) })
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || 'Upload-URL fehlgeschlagen')
        const { error } = await sb.storage.from('produkte').uploadToSignedUrl(d.path, d.token, f, { contentType: f.type || 'image/jpeg' })
        if (error) throw error
        urls.push(d.publicUrl)
      }
      setCustom(c => ({ ...c, images: [...c.images, ...urls] }))
    } catch (e: any) { setError(e.message || 'Upload fehlgeschlagen') } finally { setUploading(false) }
  }
  const move = (from: string, to: string) => {
    if (!edit || from === to) return
    const items = [...edit.items]; const a = items.findIndex(i => i.id === from); const b = items.findIndex(i => i.id === to)
    if (a < 0 || b < 0) return
    const [it] = items.splice(a, 1); items.splice(b, 0, it); setEdit({ ...edit, items })
  }
  const setItemImages = (id: string, images: string[]) => edit && setEdit({ ...edit, items: edit.items.map(i => i.id === id ? { ...i, images } : i) })

  const save = async () => {
    if (!edit) return
    if (!edit.items.length) { setError('Bitte mindestens ein Produkt hinzufügen.'); return }
    setSaving(true); setError('')
    const { ok, j } = edit.id ? await api('/api/produkte/' + edit.id, 'PATCH', edit) : await api('/api/produkte', 'POST', edit)
    setSaving(false)
    if (!ok) { setError(j.error || 'Fehler beim Speichern'); return }
    setEdit(null); await load()
  }
  const remove = async (id: string) => { await api('/api/produkte/' + id, 'DELETE'); await load() }
  const setStatus = async (g: any, status: string) => { await api('/api/produkte/' + g.id, 'PATCH', { status }); await load() }
  const openWuensche = async (g: any) => { const { ok, j } = await api(`/api/produkte/${g.id}/wuensche`); if (ok) setWuensche({ g, list: j }) }
  const removeWunsch = async (gid: string, wid: string) => { await api(`/api/produkte/${gid}/wuensche`, 'DELETE', { wunsch_id: wid }); setWuensche(w => w ? { ...w, list: w.list.filter(x => x.id !== wid) } : w); await load() }

  const shown = useMemo(() => products.filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()) || (p.type || '').toLowerCase().includes(search.toLowerCase())), [products, search])
  const inputCls = 'w-full bg-surface-3 border border-hairline rounded-apple-sm px-3 py-2 text-ink-1 text-sm focus:outline-none focus:border-accent/40'
  const labelCls = 'text-ink-3 text-xs mb-1 block font-medium'
  const btnDel = (a: boolean) => `text-[11px] px-2 py-1 rounded whitespace-nowrap ${a ? 'bg-red-600 text-white' : 'bg-red-950/30 text-red-400 hover:bg-red-950/50'}`

  return (
    <div className="flex min-h-screen bg-surface-0">
      <Sidebar />
      <main className="flex-1 md:ml-60 min-h-screen min-w-0">
        <div className="glass-top px-8 py-5 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-ink-1 font-semibold text-lg tracking-tight">Produkte</h1>
            <p className="text-ink-3 text-xs mt-0.5">Produktgalerien für Creator: auswählen, Link schicken, Wünsche einsammeln</p>
          </div>
          <button onClick={openNew} className="press bg-accent hover:bg-accent-hover text-sm font-semibold rounded-full px-4 py-2">+ Neue Galerie</button>
        </div>

        <div className="p-8 space-y-4">
          {loading ? <div className="text-ink-4 text-sm py-10 text-center">Lädt…</div> : list.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-ink-2 text-sm font-medium">Noch keine Galerie</div>
              <div className="text-ink-4 text-xs mt-1">Lege eine Galerie an, wähle Produkte aus dem Shop oder lade eigene Bilder hoch, und schick den Link an Creator.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {list.map(g => (
                <div key={g.id} className="bg-surface-2 rounded-apple-lg border border-hairline-soft p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-ink-1 font-medium truncate">{g.titel || g.label || 'Ohne Titel'}</h2>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-ink-3 font-mono">{(g.sprache || 'de').toUpperCase()}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${g.status === 'aktiv' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-ink-4 border-hairline'}`}>{g.status === 'aktiv' ? 'Aktiv' : 'Geschlossen'}</span>
                      </div>
                      <p className="text-ink-4 text-xs mt-0.5">{(g.items || []).filter((i: GalerieItem) => !i.hidden).length} sichtbar von {(g.items || []).length} Produkten · erstellt {dat(g.created_at)}{g.max_auswahl ? ` · max. ${g.max_auswahl} pro Creator` : ''}</p>
                    </div>
                    <button onClick={() => openWuensche(g)} className={`press text-xs px-3 py-1.5 rounded-full border ${g.wuensche ? 'border-accent text-accent bg-accent/10' : 'border-hairline text-ink-3'}`}>{g.wuensche} {g.wuensche === 1 ? 'Wunsch' : 'Wünsche'}</button>
                  </div>
                  <div className="flex gap-1.5 mt-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                    {(g.items || []).filter((i: GalerieItem) => !i.hidden).slice(0, 10).map((i: GalerieItem) => <div key={i.id} className="w-12 h-14 flex-shrink-0 rounded bg-surface-3 overflow-hidden">{i.images?.[0] && <img src={i.images[0]} alt="" className="w-full h-full object-cover" />}</div>)}
                    {(g.items || []).length > 10 && <div className="w-12 h-14 flex-shrink-0 rounded bg-surface-3 flex items-center justify-center text-ink-4 text-xs">+{g.items.length - 10}</div>}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <input readOnly value={linkUrl(g.token)} onFocus={e => e.currentTarget.select()} className={inputCls + ' text-xs'} />
                    <button onClick={() => copy(g.id, linkUrl(g.token))} className="press px-3 rounded-apple-sm bg-accent text-xs font-semibold whitespace-nowrap">{copied === g.id ? '✓ Kopiert' : 'Link kopieren'}</button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <a href={linkUrl(g.token)} target="_blank" rel="noreferrer" className="text-[11px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-ink-2">Vorschau ↗</a>
                    <button onClick={() => openEdit(g)} className="text-[11px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-ink-2">Bearbeiten</button>
                    <button onClick={() => setStatus(g, g.status === 'aktiv' ? 'geschlossen' : 'aktiv')} className="text-[11px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-ink-2">{g.status === 'aktiv' ? 'Schließen' : 'Wieder öffnen'}</button>
                    <button onClick={() => twoClick('g' + g.id, () => remove(g.id))} className={btnDel(confirm === 'g' + g.id) + ' ml-auto'}>{confirm === 'g' + g.id ? 'Wirklich löschen?' : 'Löschen'}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {wuensche && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setWuensche(null)}>
            <div className="bg-surface-2 rounded-apple-lg w-full max-w-2xl border border-hairline max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-hairline-soft">
                <div><h2 className="text-ink-1 font-semibold">Wünsche · {wuensche.g.titel || wuensche.g.label || 'Galerie'}</h2><p className="text-ink-4 text-xs">{wuensche.list.length} Einsendung{wuensche.list.length === 1 ? '' : 'en'}</p></div>
                <button onClick={() => setWuensche(null)} className="text-ink-3 hover:text-ink-1 text-xl leading-none">×</button>
              </div>
              <div className="overflow-y-auto p-6 space-y-4">
                {wuensche.list.length === 0 && <p className="text-ink-4 text-sm">Noch keine Einsendungen.</p>}
                {wuensche.list.map(w => {
                  const items = (wuensche.g.items as GalerieItem[]).filter(i => w.auswahl.includes(i.id))
                  return (
                    <div key={w.id} className="bg-surface-3 rounded-apple-sm p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div><div className="text-ink-1 font-medium">{w.creator_name}</div><div className="text-ink-4 text-xs">{w.kontakt || '—'} · {new Date(w.created_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div></div>
                        <button onClick={() => twoClick('w' + w.id, () => removeWunsch(wuensche.g.id, w.id))} className={btnDel(confirm === 'w' + w.id)}>{confirm === 'w' + w.id ? 'Sicher?' : 'Löschen'}</button>
                      </div>
                      {w.nachricht && <p className="text-ink-2 text-sm mt-2">„{w.nachricht}“</p>}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {items.map(i => <div key={i.id} className="flex items-center gap-2 bg-surface-2 rounded-apple-sm pr-2 overflow-hidden border border-hairline-soft">{i.images?.[0] ? <img src={i.images[0]} alt="" className="w-9 h-9 object-cover" /> : <div className="w-9 h-9" />}<span className="text-ink-2 text-xs">{i.title}</span></div>)}
                      </div>
                      <button onClick={() => copy('wl' + w.id, `${w.creator_name}${w.kontakt ? ' (' + w.kontakt + ')' : ''}:\n` + items.map(i => '- ' + i.title + (i.price ? ' · ' + fmtPreis(i.price) : '')).join('\n') + (w.nachricht ? `\nNachricht: ${w.nachricht}` : ''))} className="text-[11px] text-accent mt-3 hover:underline">{copied === 'wl' + w.id ? '✓ Kopiert' : 'Liste kopieren'}</button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {edit && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface-2 rounded-apple-lg w-full max-w-5xl border border-hairline max-h-[94vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-hairline-soft">
                <h2 className="text-ink-1 font-semibold">{edit.id ? 'Galerie bearbeiten' : 'Neue Galerie'}</h2>
                <button onClick={() => setEdit(null)} className="text-ink-3 hover:text-ink-1 text-xl leading-none">×</button>
              </div>
              <div className="overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                <div className="space-y-4 min-w-0">
                  <div className="grid grid-cols-[120px_1fr_1fr_120px] gap-3">
                    <div><label className={labelCls}>Sprache</label><select value={edit.sprache || 'de'} onChange={e => setEdit({ ...edit, sprache: e.target.value as any })} className={inputCls}><option value="de">Deutsch</option><option value="en">English</option></select></div>
                    <div><label className={labelCls}>Kleine Zeile oben (optional)</label><input value={edit.label || ''} onChange={e => setEdit({ ...edit, label: e.target.value })} placeholder="z. B. Women · Launch 2026" className={inputCls} /></div>
                    <div><label className={labelCls}>Überschrift (optional)</label><input value={edit.titel} onChange={e => setEdit({ ...edit, titel: e.target.value })} className={inputCls} /></div>
                    <div><label className={labelCls}>Max. Auswahl</label><input type="number" min={1} value={edit.max_auswahl ?? ''} onChange={e => setEdit({ ...edit, max_auswahl: e.target.value ? Number(e.target.value) : null })} placeholder="frei" className={inputCls} /></div>
                  </div>
                  <div><label className={labelCls}>Text unter der Überschrift (optional, Zeilenumbrüche bleiben erhalten)</label><textarea rows={3} value={edit.beschreibung || ''} onChange={e => setEdit({ ...edit, beschreibung: e.target.value })} placeholder="z. B. Such dir bis zu 3 Teile aus, die du im Reel zeigen möchtest." className={inputCls + ' resize-none'} /></div>

                  <div className="flex gap-1 bg-surface-3 rounded-full p-1 w-fit">
                    {([['shop', 'Aus dem Shop'], ['eigene', 'Eigenes Produkt (Bilder hochladen)']] as const).map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`px-3 py-1.5 text-xs rounded-full ${tab === k ? 'bg-accent' : 'text-ink-3 hover:text-ink-1'}`}>{l}</button>)}
                  </div>

                  {tab === 'shop' ? (
                    <div>
                      <input value={search} onChange={e => setSearch(e.target.value)} placeholder={products.length ? 'Produkt suchen…' : 'Shop-Produkte werden geladen…'} className={inputCls + ' mb-2'} />
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[46vh] overflow-y-auto pr-1">
                        {shown.map(p => {
                          const on = hasItem(String(p.id))
                          return (
                            <button key={p.id} type="button" onClick={() => toggleShop(p)} className={`text-left rounded-apple-sm overflow-hidden border transition-colors bg-surface-3 ${on ? 'border-accent' : 'border-hairline-soft hover:border-hairline'}`}>
                              <div className="relative">{p.image ? <img src={p.image} alt="" className="w-full aspect-[4/5] object-cover" loading="lazy" /> : <div className="w-full aspect-[4/5] bg-white/5" />}{on && <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-accent text-[11px] flex items-center justify-center">✓</span>}{(p.images?.length || 0) > 1 && <span className="absolute bottom-1.5 left-1.5 text-[10px] px-1.5 rounded bg-black/60 text-white">{p.images.length} Bilder</span>}</div>
                              <div className="p-1.5"><div className="text-ink-1 text-[10px] leading-tight line-clamp-2">{p.title}</div><div className="text-ink-4 text-[10px]">{p.price ? fmtPreis(p.price) : ''}{!p.available ? ' · ausverkauft' : ''}</div></div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 bg-surface-3 rounded-apple-sm p-4">
                      <div className="grid grid-cols-[1fr_120px] gap-3">
                        <div><label className={labelCls}>Produktname</label><input value={custom.title} onChange={e => setCustom({ ...custom, title: e.target.value })} className={inputCls} /></div>
                        <div><label className={labelCls}>Preis (€)</label><input type="number" min={0} value={custom.price} onChange={e => setCustom({ ...custom, price: e.target.value })} className={inputCls} /></div>
                      </div>
                      <div><label className={labelCls}>Hinweis (optional)</label><input value={custom.hinweis} onChange={e => setCustom({ ...custom, hinweis: e.target.value })} placeholder="z. B. Neu ab Dezember · Silber und Gold" className={inputCls} /></div>
                      <div>
                        <label className={labelCls}>Bilder (1. Bild = Produktbild, danach getragen etc.)</label>
                        <input type="file" accept="image/*" multiple onChange={e => upload(e.target.files)} className="text-xs text-ink-3" />
                        {uploading && <p className="text-ink-4 text-xs mt-1">Lädt hoch…</p>}
                        {custom.images.length > 0 && <div className="flex gap-2 mt-2 flex-wrap">{custom.images.map((u, i) => <div key={u} className="relative"><img src={u} alt="" className="w-16 h-20 object-cover rounded" /><button onClick={() => setCustom({ ...custom, images: custom.images.filter(x => x !== u) })} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white text-[10px]">×</button><span className="absolute bottom-0.5 left-0.5 text-[9px] px-1 bg-black/60 text-white rounded">{i + 1}</span></div>)}</div>}
                      </div>
                      <button onClick={addCustom} className="press bg-accent text-sm font-semibold rounded-full px-4 py-2">Zur Galerie hinzufügen</button>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between"><h3 className="text-ink-1 text-sm font-medium">Pool ({edit.items.filter(i => !i.hidden).length} sichtbar / {edit.items.length})</h3><span className="text-ink-4 text-[10px]">Ziehen zum Sortieren · Auge = ein-/ausblenden</span></div>
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => setEdit({ ...edit, items: [...edit.items, ...products.filter(p => !hasItem(String(p.id))).map(p => ({ id: String(p.id), title: p.title, price: p.price, images: p.images?.length ? p.images : (p.image ? [p.image] : []), url: p.url, varianten: p.varianten || [], custom: false }))] })} className="text-[11px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-ink-2">Alle Shop-Produkte hinzufügen</button>
                    <button onClick={() => setEdit({ ...edit, items: edit.items.map(i => ({ ...i, hidden: false })) })} className="text-[11px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-ink-2">Alle einblenden</button>
                    <button onClick={() => setEdit({ ...edit, items: edit.items.map(i => ({ ...i, hidden: true })) })} className="text-[11px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-ink-2">Alle ausblenden</button>
                  </div>
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                    {edit.items.length === 0 && <p className="text-ink-4 text-xs">Noch leer. Links Produkte antippen.</p>}
                    {edit.items.map(i => (
                      <div key={i.id} draggable onDragStart={() => setDrag(i.id)} onDragOver={e => e.preventDefault()} onDrop={() => { if (drag) move(drag, i.id); setDrag(null) }} className={`bg-surface-3 rounded-apple-sm p-2 border border-hairline-soft cursor-grab ${drag === i.id ? 'opacity-40' : ''} ${i.hidden ? 'opacity-50' : ''}`}>
                        <div className="flex items-center gap-2">
                          <button title={i.hidden ? 'Einblenden' : 'Ausblenden'} onClick={() => setEdit({ ...edit, items: edit.items.map(x => x.id === i.id ? { ...x, hidden: !x.hidden } : x) })} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${i.hidden ? 'bg-white/5 text-ink-4' : 'bg-accent/20 text-accent'}`}>{i.hidden ? '○' : '●'}</button>
                          {i.images[0] ? <img src={i.images[0]} alt="" className="w-10 h-12 object-cover rounded" /> : <div className="w-10 h-12 bg-white/5 rounded" />}
                          <div className="min-w-0 flex-1"><div className="text-ink-1 text-xs truncate">{i.title}</div><div className="text-ink-4 text-[10px]">{i.price ? fmtPreis(i.price) : ''}{i.custom ? ' · eigenes Produkt' : ''} · {i.images.length} Bild{i.images.length === 1 ? '' : 'er'}{i.hidden ? ' · ausgeblendet' : ''}</div></div>
                          <button onClick={() => setEdit({ ...edit, items: edit.items.filter(x => x.id !== i.id) })} className="text-ink-4 hover:text-red-400 text-sm">×</button>
                        </div>
                        {i.images.length > 1 && (
                          <div className="flex gap-1 mt-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                            {i.images.map((u, idx) => (
                              <button key={u} title={idx === 0 ? 'Titelbild' : 'Als Titelbild setzen'} onClick={() => setItemImages(i.id, [u, ...i.images.filter(x => x !== u)])} className={`relative flex-shrink-0 w-8 h-10 rounded overflow-hidden border ${idx === 0 ? 'border-accent' : 'border-transparent opacity-70 hover:opacity-100'}`}><img src={u} alt="" className="w-full h-full object-cover" /></button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-hairline-soft">
                {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
                <div className="flex gap-2">
                  <button onClick={save} disabled={saving} className="press flex-1 bg-accent hover:bg-accent-hover text-sm font-semibold rounded-full py-2.5 disabled:opacity-50">{saving ? 'Speichert…' : edit.id ? 'Speichern' : 'Galerie anlegen und Link erzeugen'}</button>
                  <button onClick={() => setEdit(null)} className="border border-hairline text-ink-2 text-sm rounded-full px-5">Abbrechen</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
