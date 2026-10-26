'use client'
import Sidebar from '../components/Sidebar'
import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { fmtDatum, fmtEur, fmtZeit, nachrichtVorlage, SPRACHEN, type Vertrag } from '@/lib/vertrag'

const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

const linkUrl = (token: string) => `https://kolure.trackfluenca.com/v/${token}`
const FIRMA_KEY = 'trackfluenca_vertrag_firma'

const STATUS: Record<string, { label: string; cls: string }> = {
  offen: { label: 'Offen', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  angesehen: { label: 'Angesehen', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  unterschrieben: { label: 'Unterschrieben', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  storniert: { label: 'Storniert', cls: 'bg-white/5 text-ink-4 border-hairline' },
}

const emptyForm = () => ({
  creator_id: '', creator_name: '', creator_handle: '',
  inhalte: '', plattform: 'Instagram', anzahl_videos: '1',
  posting_bis: '', online_tage: '30',
  verguetung_art: 'produkt' as 'produkt' | 'fee' | 'beides',
  produkte: '', fee: '', versand_bis: '', zahlung_tage: '14',
  nutzungsrechte_ads: false, zusatz: '', sprache: 'de',
})

export default function Vertraege() {
  const [list, setList] = useState<any[]>([])
  const [creators, setCreators] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [firma, setFirma] = useState({ firma_name: 'Koluré', firma_adresse: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [detail, setDetail] = useState<Vertrag | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [filter, setFilter] = useState('')

  const getToken = async () => (await sb.auth.getSession()).data.session?.access_token || ''

  const load = async () => {
    const token = await getToken()
    const h = { authorization: 'Bearer ' + token }
    const [vr, cr] = await Promise.all([
      fetch('/api/vertraege', { headers: h }).then(r => r.json()).catch(() => []),
      fetch('/api/creators?type=all', { headers: h }).then(r => r.json()).catch(() => []),
    ])
    setList(Array.isArray(vr) ? vr : [])
    setCreators(Array.isArray(cr) ? cr : [])
    setLoading(false)
  }
  useEffect(() => {
    load()
    try { const f = localStorage.getItem(FIRMA_KEY); if (f) setFirma(JSON.parse(f)) } catch {}
  }, [])

  const counts = useMemo(() => ({
    offen: list.filter(v => v.status === 'offen').length,
    angesehen: list.filter(v => v.status === 'angesehen').length,
    unterschrieben: list.filter(v => v.status === 'unterschrieben').length,
  }), [list])

  const shown = filter ? list.filter(v => v.status === filter) : list

  const pickCreator = (id: string) => {
    const c = creators.find(x => x.id === id)
    setForm(f => ({
      ...f, creator_id: id,
      creator_name: c?.name || f.creator_name,
      creator_handle: c ? (c.ig || c.tt || '') : f.creator_handle,
    }))
  }

  const create = async () => {
    setError('')
    if (!form.creator_name.trim()) { setError('Bitte Creator wählen oder Namen eingeben.'); return }
    setSaving(true)
    try {
      try { localStorage.setItem(FIRMA_KEY, JSON.stringify(firma)) } catch {}
      const num = (s: string) => s === '' ? null : Number(s)
      const showProdukt = form.verguetung_art !== 'fee'
      const showFee = form.verguetung_art !== 'produkt'
      const body = {
        ...firma,
        creator_id: form.creator_id || null, creator_name: form.creator_name.trim(), creator_handle: form.creator_handle,
        inhalte: form.inhalte, plattform: form.plattform, anzahl_videos: num(form.anzahl_videos),
        posting_bis: form.posting_bis, online_tage: num(form.online_tage),
        verguetung_art: form.verguetung_art,
        produkte: showProdukt ? form.produkte : '', produktwert: null,
        fee: showFee ? num(form.fee) : null, versand_bis: showProdukt ? form.versand_bis : '',
        zahlung_tage: num(form.zahlung_tage), nutzungsrechte_ads: form.nutzungsrechte_ads, zusatz: form.zusatz, sprache: form.sprache,
      }
      const res = await fetch(editingId ? '/api/vertraege/' + editingId : '/api/vertraege', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + await getToken() },
        body: JSON.stringify(body),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error || 'Fehler beim Anlegen'); return }
      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm())
      await load()
      setDetail(d)
    } finally { setSaving(false) }
  }

  const startEdit = (v: Vertrag) => {
    setForm({
      creator_id: v.creator_id || '', creator_name: v.creator_name || '', creator_handle: v.creator_handle || '',
      inhalte: v.inhalte || '', plattform: v.plattform || 'Instagram', anzahl_videos: String(v.anzahl_videos ?? 1),
      posting_bis: v.posting_bis || '', online_tage: String(v.online_tage ?? 30),
      verguetung_art: v.verguetung_art || 'produkt',
      produkte: v.produkte || '', fee: v.fee != null ? String(v.fee) : '', versand_bis: v.versand_bis || '',
      zahlung_tage: String(v.zahlung_tage ?? 14), nutzungsrechte_ads: !!v.nutzungsrechte_ads, zusatz: v.zusatz || '', sprache: v.sprache || 'de',
    })
    setFirma({ firma_name: v.firma_name || 'Koluré', firma_adresse: v.firma_adresse || '' })
    setEditingId(v.id!)
    setError('')
    setDetail(null)
    setShowForm(true)
  }

  const openDetail = async (id: string) => {
    setDetailLoading(true)
    setConfirmDeleteId(null)
    const res = await fetch('/api/vertraege/' + id, { headers: { authorization: 'Bearer ' + await getToken() } })
    if (res.ok) setDetail(await res.json())
    setDetailLoading(false)
  }

  const copy = async (key: string, text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(p => p === key ? null : p), 1500) } catch {}
  }

  const setStatus = async (id: string, status: 'storniert' | 'reaktivieren') => {
    setBusyId(id)
    const res = await fetch('/api/vertraege/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + await getToken() },
      body: JSON.stringify({ status }),
    })
    if (res.ok) { const d = await res.json(); setDetail(d); await load() }
    setBusyId(null)
  }

  // Zwei-Klick-Bestaetigung wie bei Outreach-Links/Celebs: erster Klick bewaffnet nur.
  const remove = async (id: string) => {
    if (confirmDeleteId !== id) { setConfirmDeleteId(id); return }
    setBusyId(id)
    const res = await fetch('/api/vertraege/' + id, { method: 'DELETE', headers: { authorization: 'Bearer ' + await getToken() } })
    if (res.ok) { setDetail(null); setConfirmDeleteId(null); await load() }
    setBusyId(null)
  }

  const inputCls = 'w-full bg-surface-3 border border-hairline rounded-apple-sm px-3 py-2 text-ink-1 text-sm focus:outline-none focus:border-accent/40'
  const labelCls = 'text-ink-3 text-xs mb-1 block font-medium'
  const showProdukt = form.verguetung_art !== 'fee'
  const showFee = form.verguetung_art !== 'produkt'

  return (
    <div className="flex min-h-screen bg-surface-0">
      <Sidebar />
      <main className="flex-1 md:ml-60 min-h-screen">
        <div className="border-b border-hairline-soft px-8 py-5 flex items-center justify-between bg-surface-0/80 backdrop-blur-xl sticky top-0 z-20">
          <div>
            <h1 className="text-ink-1 font-semibold text-lg tracking-tight">Verträge</h1>
            <p className="text-ink-3 text-xs mt-0.5">Kooperationsvereinbarungen per Link unterschreiben lassen</p>
          </div>
          <button onClick={() => { setForm(emptyForm()); setEditingId(null); setError(''); setShowForm(true) }}
            className="bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-apple-sm px-4 py-2 transition-colors">+ Neuer Vertrag</button>
        </div>

        <div className="p-8 space-y-6 max-w-4xl">
          <div className="grid grid-cols-3 gap-4">
            {([['offen', 'Offen', 'noch nicht angesehen', 'text-amber-400'], ['angesehen', 'Angesehen', 'Link geöffnet, nicht unterschrieben', 'text-blue-400'], ['unterschrieben', 'Unterschrieben', 'fertig', 'text-emerald-400']] as const).map(([k, label, sub, col]) => (
              <button key={k} onClick={() => setFilter(f => f === k ? '' : k)}
                className={`text-left bg-surface-2 rounded-apple-lg p-5 border transition-colors ${filter === k ? 'border-accent' : 'border-hairline-soft hover:border-hairline'}`}>
                <div className="text-ink-3 text-xs font-medium mb-1">{label}</div>
                <div className={`text-2xl font-semibold ${col}`}>{counts[k]}</div>
                <div className="text-ink-4 text-xs mt-0.5">{sub}</div>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-ink-4 text-sm py-10 text-center">Lädt...</div>
          ) : shown.length === 0 ? (
            <div className="text-ink-4 text-sm py-10 text-center">{list.length === 0 ? 'Noch keine Verträge. Lege oben den ersten an.' : 'Keine Verträge in diesem Status.'}</div>
          ) : (
            <div className="space-y-2">
              {shown.map(v => {
                const st = STATUS[v.status] || STATUS.offen
                return (
                  <button key={v.id} onClick={() => openDetail(v.id)}
                    className="w-full text-left flex items-center gap-4 px-4 py-3 rounded-apple-sm bg-surface-2 border border-hairline-soft hover:border-hairline transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="text-ink-1 text-sm font-medium truncate">{v.creator_name}{v.creator_handle ? <span className="text-ink-4 font-normal"> · {v.creator_handle}</span> : null}</div>
                      <div className="text-ink-4 text-xs truncate">
                        {v.anzahl_videos || 1}× {v.plattform || 'Instagram'}{v.posting_bis ? ` bis ${fmtDatum(v.posting_bis)}` : ''}
                        {' · '}{v.verguetung_art === 'fee' ? fmtEur(v.fee) : v.verguetung_art === 'beides' ? `${fmtEur(v.fee)} + Produkte` : 'Produkte'}
                      </div>
                    </div>
                    <div className="text-ink-4 text-xs flex-shrink-0 text-right hidden sm:block">
                      {v.status === 'unterschrieben' ? fmtZeit(v.unterschrieben_am) : v.status === 'angesehen' ? 'gesehen ' + fmtZeit(v.angesehen_am) : 'erstellt ' + fmtDatum(v.created_at?.slice(0, 10))}
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border flex-shrink-0 ${st.cls}`}>{st.label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <div className="bg-surface-2 rounded-apple-lg w-full max-w-xl border border-hairline max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-hairline-soft">
                <h2 className="text-ink-1 font-semibold">{editingId ? 'Vertrag bearbeiten' : 'Neuer Vertrag'}</h2>
                <button onClick={() => { setShowForm(false); setEditingId(null) }} className="text-ink-3 hover:text-ink-1 text-xl leading-none">×</button>
              </div>
              <div className="overflow-y-auto p-6 space-y-4">
                <div>
                  <label className={labelCls}>Sprache des Vertrags</label>
                  <div className="flex gap-2">
                    {SPRACHEN.map(sp => (
                      <button key={sp.code} type="button" onClick={() => setForm(f => ({ ...f, sprache: sp.code }))}
                        className={`flex-1 py-2 text-sm rounded-apple-sm border transition-colors ${form.sprache === sp.code ? 'bg-accent/15 border-accent text-ink-1' : 'border-hairline text-ink-3 hover:text-ink-1'}`}>{sp.label}</button>
                    ))}
                  </div>
                  <p className="text-ink-4 text-[10px] mt-1">Gilt für den Vertragstext und die Unterschriftsseite des Creators. Dein „Zusatz"-Text bleibt, wie du ihn schreibst.</p>
                </div>
                <div>
                  <label className={labelCls}>Creator *</label>
                  <select value={form.creator_id} onChange={e => pickCreator(e.target.value)} className={inputCls}>
                    <option value="">— wählen (oder unten Namen tippen) —</option>
                    {creators.filter(c => c.type !== 'stylist').map(c => <option key={c.id} value={c.id}>{c.name}{c.ig ? ` (${c.ig})` : ''}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <input value={form.creator_name} onChange={e => setForm(f => ({ ...f, creator_name: e.target.value }))} placeholder="Name" className={inputCls} />
                    <input value={form.creator_handle} onChange={e => setForm(f => ({ ...f, creator_handle: e.target.value }))} placeholder="@handle" className={inputCls} />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Was soll sie machen? (Kurztext, ergänzt die Absprache im Insta-Chat)</label>
                  <textarea value={form.inhalte} onChange={e => setForm(f => ({ ...f, inhalte: e.target.value }))} rows={3}
                    placeholder="z. B. 1 Reel mit dem Armband im Alltag, Link in Bio, Story-Erwähnung" className={inputCls + ' resize-none'} />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div><label className={labelCls}>Plattform</label>
                    <select value={form.plattform} onChange={e => setForm(f => ({ ...f, plattform: e.target.value }))} className={inputCls}>
                      {['Instagram', 'TikTok', 'Instagram & TikTok'].map(p => <option key={p}>{p}</option>)}
                    </select></div>
                  <div><label className={labelCls}>Anzahl Videos</label>
                    <input type="number" min={1} value={form.anzahl_videos} onChange={e => setForm(f => ({ ...f, anzahl_videos: e.target.value }))} className={inputCls} /></div>
                  <div><label className={labelCls}>Online (Tage)</label>
                    <input type="number" min={1} value={form.online_tage} onChange={e => setForm(f => ({ ...f, online_tage: e.target.value }))} className={inputCls} /></div>
                </div>

                <div><label className={labelCls}>Posten bis</label>
                  <input type="date" value={form.posting_bis} onChange={e => setForm(f => ({ ...f, posting_bis: e.target.value }))} className={inputCls} /></div>

                <div>
                  <label className={labelCls}>Vergütung</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([['produkt', 'Produkte'], ['fee', 'Fee'], ['beides', 'Beides']] as const).map(([k, l]) => (
                      <button key={k} type="button" onClick={() => setForm(f => ({ ...f, verguetung_art: k }))}
                        className={`py-2 rounded-apple-sm text-xs border transition-colors ${form.verguetung_art === k ? 'bg-accent/15 border-accent text-ink-1' : 'border-hairline text-ink-3'}`}>{l}</button>
                    ))}
                  </div>
                </div>

                {showProdukt && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2"><label className={labelCls}>Produkte</label>
                      <input value={form.produkte} onChange={e => setForm(f => ({ ...f, produkte: e.target.value }))} placeholder="z. B. 2 Armbänder (Set Gold)" className={inputCls} /></div>
                    <div><label className={labelCls}>Versand bis</label>
                      <input type="date" value={form.versand_bis} onChange={e => setForm(f => ({ ...f, versand_bis: e.target.value }))} className={inputCls} /></div>
                  </div>
                )}
                {showFee && (
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelCls}>Fee (€)</label>
                      <input type="number" min={0} value={form.fee} onChange={e => setForm(f => ({ ...f, fee: e.target.value }))} className={inputCls} /></div>
                    <div><label className={labelCls}>Zahlung innerhalb (Tage)</label>
                      <input type="number" min={1} value={form.zahlung_tage} onChange={e => setForm(f => ({ ...f, zahlung_tage: e.target.value }))} className={inputCls} /></div>
                  </div>
                )}

                <label className="flex items-center gap-2 text-sm text-ink-2">
                  <input type="checkbox" checked={form.nutzungsrechte_ads} onChange={e => setForm(f => ({ ...f, nutzungsrechte_ads: e.target.checked }))} />
                  Nutzung für Ads erlaubt (Reposten ist immer erlaubt)
                </label>

                <div><label className={labelCls}>Zusätzliche Vereinbarungen (optional)</label>
                  <textarea value={form.zusatz} onChange={e => setForm(f => ({ ...f, zusatz: e.target.value }))} rows={2} className={inputCls + ' resize-none'} /></div>

                <div className="border-t border-hairline-soft pt-4">
                  <label className={labelCls}>Deine Firmendaten (werden im Browser gemerkt)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={firma.firma_name} onChange={e => setFirma(f => ({ ...f, firma_name: e.target.value }))} placeholder="Firmenname" className={inputCls} />
                    <input value={firma.firma_adresse} onChange={e => setFirma(f => ({ ...f, firma_adresse: e.target.value }))} placeholder="Straße, PLZ Ort" className={inputCls} />
                  </div>
                </div>

                {error && <p className="text-red-400 text-xs">{error}</p>}
                <button onClick={create} disabled={saving}
                  className="w-full bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-apple-sm py-2.5 disabled:opacity-50">{saving ? 'Wird gespeichert...' : editingId ? 'Änderungen speichern' : 'Vertrag anlegen'}</button>
              </div>
            </div>
          </div>
        )}

        {(detail || detailLoading) && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDetail(null)}>
            <div className="bg-surface-2 rounded-apple-lg w-full max-w-lg border border-hairline max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              {detail && (() => {
                const v = detail
                const st = STATUS[v.status || 'offen']
                const url = linkUrl(v.token || '')
                return (
                  <>
                    <div className="flex items-start justify-between px-6 py-4 border-b border-hairline-soft">
                      <div>
                        <h2 className="text-ink-1 font-semibold">{v.creator_name}</h2>
                        <p className="text-ink-4 text-xs mt-0.5">{v.creator_handle} · erstellt {fmtDatum(v.created_at?.slice(0, 10))}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
                        <button onClick={() => setDetail(null)} className="text-ink-3 hover:text-ink-1 text-xl leading-none">×</button>
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="text-sm text-ink-2 space-y-1">
                        <div><span className="text-ink-4">Inhalt:</span> {v.anzahl_videos || 1}× {v.plattform || 'Instagram'}{v.posting_bis ? `, posten bis ${fmtDatum(v.posting_bis)}` : ''}, {v.online_tage ?? 30} Tage online</div>
                        {v.inhalte && <div><span className="text-ink-4">Absprache:</span> {v.inhalte}</div>}
                        <div><span className="text-ink-4">Vergütung:</span> {v.verguetung_art === 'fee' ? fmtEur(v.fee) : v.verguetung_art === 'beides' ? `${fmtEur(v.fee)} + ${v.produkte || 'Produkte'}` : v.produkte || 'Produkte'}{v.versand_bis ? `, Versand bis ${fmtDatum(v.versand_bis)}` : ''}</div>
                        <div><span className="text-ink-4">Ads erlaubt:</span> {v.nutzungsrechte_ads ? 'Ja' : 'Nein'}</div>
                        {v.zusatz && <div><span className="text-ink-4">Zusatz:</span> {v.zusatz}</div>}
                      </div>

                      <div className="text-xs text-ink-3 space-y-0.5 border-t border-hairline-soft pt-3">
                        <div>Angesehen: {fmtZeit(v.angesehen_am)}</div>
                        <div>Unterschrieben: {fmtZeit(v.unterschrieben_am)}</div>
                      </div>

                      {v.status === 'unterschrieben' && (
                        <div className="bg-white rounded-apple-sm p-3">
                          {v.unterschrift_bild && <img src={v.unterschrift_bild} alt="Unterschrift" className="h-24" />}
                          <div className="text-neutral-500 text-xs border-t border-neutral-300 mt-1 pt-1">{v.unterschrift_name}{v.unterschrift_adresse ? ` · ${v.unterschrift_adresse}` : ''}</div>
                        </div>
                      )}

                      {v.status !== 'unterschrieben' && v.status !== 'storniert' && (
                        <div className="space-y-2">
                          <input readOnly value={url} onFocus={e => e.currentTarget.select()} className={inputCls + ' text-xs'} />
                          <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => copy('link', url)} className="bg-surface-3 hover:bg-white/[0.08] border border-hairline text-ink-1 text-sm rounded-apple-sm py-2">{copied === 'link' ? '✓ Kopiert' : 'Link kopieren'}</button>
                            <button onClick={() => copy('msg', nachrichtVorlage(v, url))} className="bg-accent hover:bg-accent-hover text-white text-sm rounded-apple-sm py-2">{copied === 'msg' ? '✓ Kopiert' : 'Nachricht kopieren'}</button>
                          </div>
                        </div>
                      )}
                      {v.status === 'unterschrieben' && (
                        <a href={url} target="_blank" rel="noreferrer" className="block text-center bg-surface-3 hover:bg-white/[0.08] border border-hairline text-ink-1 text-sm rounded-apple-sm py-2">Vertrag ansehen / als PDF speichern</a>
                      )}

                      {v.status !== 'unterschrieben' && v.status !== 'storniert' && (
                        <button onClick={() => startEdit(v)} className="w-full bg-surface-3 hover:bg-white/[0.08] border border-hairline text-ink-1 text-sm rounded-apple-sm py-2">Vertrag bearbeiten</button>
                      )}
                      <div className="flex gap-2 pt-1">
                        {v.status === 'storniert' ? (
                          <button onClick={() => setStatus(v.id!, 'reaktivieren')} disabled={busyId === v.id} className="flex-1 border border-hairline text-ink-2 text-sm rounded-apple-sm py-2">Reaktivieren</button>
                        ) : v.status !== 'unterschrieben' ? (
                          <button onClick={() => setStatus(v.id!, 'storniert')} disabled={busyId === v.id} className="flex-1 border border-hairline text-ink-2 text-sm rounded-apple-sm py-2">Stornieren</button>
                        ) : null}
                        <button onClick={() => remove(v.id!)} disabled={busyId === v.id}
                          className={`flex-1 text-sm rounded-apple-sm py-2 transition-colors ${confirmDeleteId === v.id ? 'bg-red-600 text-white hover:bg-red-500' : 'border border-red-900/50 text-red-500 hover:bg-red-950/50'}`}>
                          {confirmDeleteId === v.id ? 'Wirklich löschen?' : 'Löschen'}
                        </button>
                      </div>
                    </div>
                  </>
                )
              })()}
              {!detail && detailLoading && <div className="p-10 text-center text-ink-4 text-sm">Lädt...</div>}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
