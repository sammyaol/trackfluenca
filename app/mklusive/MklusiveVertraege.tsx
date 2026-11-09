'use client'
// Vertragsbereich im Mklusive-Portal: Agentur schliesst im Auftrag der Marke Vereinbarungen mit Creatorn.
// Nutzt dieselbe Unterschriftsseite (/v/[token]) wie die Kooperationsvertraege, aber eigenen Vertragstext.
import { useState, useEffect, useMemo, Fragment } from 'react'
import { klauselnFuer, nachrichtVorlageAgentur, fmtDatum, fmtEur, fmtZeit, SPRACHEN, type Vertrag } from '@/lib/vertrag'

type Api = (url: string, method?: string, body?: any) => Promise<{ ok: boolean; j: any }>
type Props = { api: Api; creators: any[]; inputCls: string; labelCls: string }

const empty = () => ({
  agency_creator_id: '', creator_name: '', creator_handle: '', sprache: 'de',
  agentur_name: 'Mklusive', agentur_adresse: '', marke_name: 'Aoulmi & Spering E-Commerce GbR (Koluré)', marke_adresse: 'Theodorstraße 13, 50389 Wesseling',
  plattform: 'Instagram', anzahl_videos: 1, inhalte: '', posting_bis: '', online_tage: 160, freigabe: true, rabatt_code: '',
  verguetung_art: 'produkt' as 'produkt' | 'fee' | 'beides', produkte: '', produktwert: '', fee: '', provision: '', versand_bis: '', zahlung_tage: 14,
  nutzungsrechte_ads: false, exklusiv_wochen: '', zusatz: '',
})

const STATUS: Record<string, { label: string; cls: string }> = {
  offen: { label: 'Offen', cls: 'bg-surface-3 text-ink-3' },
  angesehen: { label: 'Angesehen', cls: 'bg-amber-500/15 text-amber-300' },
  unterschrieben: { label: 'Unterschrieben', cls: 'bg-emerald-500/15 text-emerald-300' },
  storniert: { label: 'Storniert', cls: 'bg-red-500/15 text-red-300' },
}

export default function MklusiveVertraege({ api, creators, inputCls, labelCls }: Props) {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [show, setShow] = useState(false)
  const [form, setForm] = useState<any>(empty())
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [showText, setShowText] = useState<string | null>(null)

  const load = async () => { const { ok, j } = await api('/api/mklusive/vertraege'); if (ok) setList(j); setLoading(false) }
  useEffect(() => { load() }, [])

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const linkFor = (v: any) => `${origin}/v/${v.token}`
  const copy = async (k: string, t: string) => { try { await navigator.clipboard.writeText(t); setCopied(k); setTimeout(() => setCopied(c => c === k ? null : c), 1500) } catch {} }
  const twoClick = (k: string, fn: () => void) => { if (confirm === k) { setConfirm(null); fn() } else { setConfirm(k); setTimeout(() => setConfirm(c => c === k ? null : c), 3000) } }

  const pickCreator = (id: string) => {
    const c = creators.find(x => x.id === id)
    setForm((f: any) => ({ ...f, agency_creator_id: id, creator_name: c ? c.name : f.creator_name, creator_handle: c ? (c.ig_handle || c.tt_handle || '') : f.creator_handle, rabatt_code: c?.rabatt_code || f.rabatt_code, plattform: c?.tt_handle && !c?.ig_handle ? 'TikTok' : f.plattform }))
  }
  const openNew = () => { setForm(empty()); setEditId(null); setError(''); setPreview(false); setShow(true) }
  const openEdit = (v: any) => {
    setForm({ ...empty(), ...Object.fromEntries(Object.entries(v).filter(([k]) => k in empty()).map(([k, val]) => [k, val == null ? '' : val])), freigabe: v.freigabe !== false, nutzungsrechte_ads: !!v.nutzungsrechte_ads })
    setEditId(v.id); setError(''); setPreview(false); setShow(true)
  }
  const body = () => {
    const b: any = { ...form }
    for (const k of ['anzahl_videos', 'online_tage', 'zahlung_tage', 'exklusiv_wochen']) b[k] = b[k] === '' ? null : Number(b[k])
    for (const k of ['produktwert', 'fee', 'provision']) b[k] = b[k] === '' ? null : Number(String(b[k]).replace(',', '.'))
    if (b.verguetung_art === 'fee') { b.produkte = null; b.produktwert = null; b.versand_bis = null }
    if (b.verguetung_art === 'produkt') { b.fee = null }
    return b
  }
  const save = async () => {
    setError('')
    if (!form.creator_name.trim()) { setError('Bitte den Namen des Creators eingeben.'); return }
    setSaving(true)
    const { ok, j } = editId ? await api('/api/mklusive/vertraege', 'PATCH', { id: editId, ...body() }) : await api('/api/mklusive/vertraege', 'POST', body())
    setSaving(false)
    if (!ok) { setError(j.error || 'Fehler beim Speichern'); return }
    setShow(false); await load(); setOpen(null)
  }
  const setStatus = async (id: string, status: string) => { await api('/api/mklusive/vertraege', 'PATCH', { id, status }); await load() }
  const remove = async (id: string) => { await api('/api/mklusive/vertraege', 'DELETE', { id }); setOpen(null); await load() }

  const shown = useMemo(() => list.filter(v => !filter || (v.creator_name + ' ' + (v.creator_handle || '')).toLowerCase().includes(filter.toLowerCase())), [list, filter])
  const previewV: Vertrag = { ...body(), bereich: 'mklusive', creator_name: form.creator_name || 'Creator' }
  const stats = { offen: list.filter(v => v.status === 'offen' || v.status === 'angesehen').length, signed: list.filter(v => v.status === 'unterschrieben').length }
  const verg = (v: any) => [v.verguetung_art !== 'fee' ? (v.produkte ? 'Produkt' : 'Produkt') : null, v.verguetung_art !== 'produkt' && v.fee ? fmtEur(v.fee) : null, v.provision ? `${v.provision} % Provision` : null].filter(Boolean).join(' · ')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Creator suchen…" className={inputCls + ' max-w-xs'} />
        <span className="text-ink-4 text-xs">{list.length} Verträge · {stats.offen} offen · {stats.signed} unterschrieben</span>
        <button onClick={openNew} className="ml-auto bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-apple-sm px-4 py-2">+ Vertrag erstellen</button>
      </div>

      <div className="bg-surface-2 rounded-apple-lg border border-hairline-soft overflow-hidden">
        {loading ? <div className="text-ink-4 text-sm py-10 text-center">Lädt…</div> : !shown.length ? (
          <div className="text-center py-14"><div className="text-ink-2 text-sm font-medium">{filter ? 'Nichts gefunden' : 'Noch keine Verträge'}</div><div className="text-ink-4 text-xs mt-1">Erstelle eine Vereinbarung, schick dem Creator den Link – unterschrieben wird direkt am Handy.</div></div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-ink-3 text-xs text-left border-b border-hairline-soft">{['Creator', 'Inhalte', 'Posting bis', 'Vergütung', 'Status', ''].map(h => <th key={h} className="px-4 py-3 font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {shown.map(v => (
                <Fragment key={v.id}>
                  <tr onClick={() => setOpen(open === v.id ? null : v.id)} className="border-b border-hairline-soft/60 hover:bg-white/[0.02] cursor-pointer">
                    <td className="px-4 py-3"><div className="text-ink-1 font-medium">{v.creator_name}</div><div className="text-ink-4 text-xs">{v.creator_handle || ''}{v.sprache && v.sprache !== 'de' ? ` · ${SPRACHEN.find(s => s.code === v.sprache)?.label}` : ''}</div></td>
                    <td className="px-4 py-3 text-ink-2 whitespace-nowrap">{v.anzahl_videos || 1}× {v.plattform || 'Instagram'}</td>
                    <td className="px-4 py-3 text-ink-2 whitespace-nowrap">{fmtDatum(v.posting_bis)}</td>
                    <td className="px-4 py-3 text-ink-2 whitespace-nowrap">{verg(v)}</td>
                    <td className="px-4 py-3"><span className={`text-[11px] px-2 py-0.5 rounded-full ${STATUS[v.status]?.cls || ''}`}>{STATUS[v.status]?.label || v.status}</span>{v.unterschrieben_am && <div className="text-ink-4 text-[10px] mt-0.5">{fmtZeit(v.unterschrieben_am)}</div>}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap"><button onClick={e => { e.stopPropagation(); copy('l' + v.id, linkFor(v)) }} className="text-xs px-2.5 py-1 rounded-full bg-accent text-[#1a1507] font-semibold">{copied === 'l' + v.id ? 'Kopiert ✓' : 'Link kopieren'}</button></td>
                  </tr>
                  {open === v.id && (
                    <tr className="border-b border-hairline-soft/60 bg-surface-3/40">
                      <td colSpan={6} className="px-4 py-4">
                        <div className="flex flex-wrap gap-2 mb-3">
                          <button onClick={() => copy('l' + v.id, linkFor(v))} className="text-xs px-3 py-1.5 rounded-full bg-accent text-[#1a1507] font-semibold">{copied === 'l' + v.id ? 'Kopiert ✓' : 'Link kopieren'}</button>
                          <button onClick={() => copy('m' + v.id, nachrichtVorlageAgentur(v, linkFor(v)))} className="text-xs px-3 py-1.5 rounded-full border border-hairline text-ink-2 hover:text-ink-1">{copied === 'm' + v.id ? 'Kopiert ✓' : 'Mit Nachricht kopieren'}</button>
                          <a href={linkFor(v)} target="_blank" rel="noreferrer" className="text-xs px-3 py-1.5 rounded-full border border-hairline text-ink-2 hover:text-ink-1">Ansehen ↗</a>
                          <a href={`https://wa.me/?text=${encodeURIComponent(nachrichtVorlageAgentur(v, linkFor(v)))}`} target="_blank" rel="noreferrer" className="text-xs px-3 py-1.5 rounded-full border border-hairline text-ink-2 hover:text-ink-1">Per WhatsApp</a>
                          {v.status !== 'unterschrieben' && <button onClick={() => openEdit(v)} className="text-xs px-3 py-1.5 rounded-full border border-hairline text-ink-2 hover:text-ink-1">Bearbeiten</button>}
                          {v.status !== 'unterschrieben' && v.status !== 'storniert' && <button onClick={() => setStatus(v.id, 'storniert')} className="text-xs px-3 py-1.5 rounded-full border border-hairline text-ink-3 hover:text-ink-1">Stornieren</button>}
                          {v.status === 'storniert' && <button onClick={() => setStatus(v.id, 'offen')} className="text-xs px-3 py-1.5 rounded-full border border-hairline text-ink-3 hover:text-ink-1">Wieder aktivieren</button>}
                          <button onClick={() => twoClick('del' + v.id, () => remove(v.id))} className={`text-xs px-3 py-1.5 rounded-full ml-auto ${confirm === 'del' + v.id ? 'bg-red-600 text-white' : 'bg-red-950/30 text-red-400 hover:bg-red-950/50'}`}>{confirm === 'del' + v.id ? 'Wirklich löschen?' : 'Löschen'}</button>
                        </div>
                        <div className="text-ink-4 text-[11px] mb-2">Link: <span className="text-ink-3 select-all">{linkFor(v)}</span>{v.angesehen_am ? ` · angesehen ${fmtZeit(v.angesehen_am)}` : ''}{v.unterschrift_name ? ` · unterschrieben von ${v.unterschrift_name}` : ''}</div>
                        <div className="text-ink-3 text-xs grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-1">
                          <span>Inhalte: <span className="text-ink-2">{v.anzahl_videos || 1}× {v.plattform || 'Instagram'}</span></span>
                          <span>Posting bis: <span className="text-ink-2">{fmtDatum(v.posting_bis)}</span></span>
                          <span>Mind. online: <span className="text-ink-2">{v.online_tage ?? 160} Tage</span></span>
                          <span>Vergütung: <span className="text-ink-2">{verg(v) || '—'}</span></span>
                          {v.rabatt_code && <span>Code: <span className="text-ink-2">{v.rabatt_code}</span></span>}
                          {v.exklusiv_wochen ? <span>Exklusivität: <span className="text-ink-2">{v.exklusiv_wochen} Wochen</span></span> : null}
                          <span>Ads-Nutzung: <span className="text-ink-2">{v.nutzungsrechte_ads ? 'ja' : 'nein'}</span></span>
                          {v.inhalte && <span className="sm:col-span-2 lg:col-span-4">Absprache: <span className="text-ink-2">{v.inhalte}</span></span>}
                        </div>
                        <button onClick={() => setShowText(showText === v.id ? null : v.id)} className="mt-2 text-[11px] text-ink-4 hover:text-ink-2">{showText === v.id ? 'Vertragstext ausblenden' : 'Vertragstext anzeigen'}</button>
                        {showText === v.id && (
                          <div className="mt-2 grid md:grid-cols-2 gap-x-8 gap-y-2 max-h-[40vh] overflow-y-auto pr-2">
                            {klauselnFuer({ ...v, bereich: 'mklusive' }).map((k, i) => (
                              <div key={i} className="text-xs"><div className="text-ink-1 font-medium mb-0.5">{i + 1}. {k.titel}</div>{k.absaetze.map((a, j) => <p key={j} className="text-ink-3 leading-relaxed mb-1">{a}</p>)}</div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {show && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto p-4 md:p-10" onClick={() => setShow(false)}>
          <div className="bg-surface-1 border border-hairline rounded-apple-lg w-full max-w-5xl p-6 md:p-8 grid md:grid-cols-[1fr_1fr] gap-8" onClick={e => e.stopPropagation()}>
            <div className="space-y-4">
              <div className="flex items-center justify-between"><h2 className="text-ink-1 font-semibold text-lg">{editId ? 'Vertrag bearbeiten' : 'Neuer Vertrag'}</h2><button onClick={() => setPreview(p => !p)} className="md:hidden text-xs text-accent">{preview ? 'Formular' : 'Vorschau'}</button></div>
              <div className={preview ? 'hidden md:block space-y-4' : 'space-y-4'}>
                <div>
                  <label className={labelCls}>Creator</label>
                  <select value={form.agency_creator_id} onChange={e => pickCreator(e.target.value)} className={inputCls}>
                    <option value="">— frei eingeben —</option>
                    {creators.map(c => <option key={c.id} value={c.id}>{c.name}{c.ig_handle ? ` (${c.ig_handle})` : ''}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Name *</label><input value={form.creator_name} onChange={e => setForm((f: any) => ({ ...f, creator_name: e.target.value }))} className={inputCls} /></div>
                  <div><label className={labelCls}>Handle</label><input value={form.creator_handle} onChange={e => setForm((f: any) => ({ ...f, creator_handle: e.target.value }))} placeholder="@name" className={inputCls} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Betreuende Agentur</label><input value={form.agentur_name} onChange={e => setForm((f: any) => ({ ...f, agentur_name: e.target.value }))} className={inputCls} /></div>
                  <div><label className={labelCls}>Agentur-Adresse</label><input value={form.agentur_adresse} onChange={e => setForm((f: any) => ({ ...f, agentur_adresse: e.target.value }))} placeholder="Straße, PLZ Ort" className={inputCls} /></div>
                  <div><label className={labelCls}>Vertragspartner (Marke)</label><input value={form.marke_name} onChange={e => setForm((f: any) => ({ ...f, marke_name: e.target.value }))} className={inputCls} /></div>
                  <div><label className={labelCls}>Marken-Adresse</label><input value={form.marke_adresse} onChange={e => setForm((f: any) => ({ ...f, marke_adresse: e.target.value }))} placeholder="Straße, PLZ Ort" className={inputCls} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className={labelCls}>Plattform</label><select value={form.plattform} onChange={e => setForm((f: any) => ({ ...f, plattform: e.target.value }))} className={inputCls}>{['Instagram', 'TikTok', 'Instagram & TikTok', 'YouTube'].map(p => <option key={p}>{p}</option>)}</select></div>
                  <div><label className={labelCls}>Anzahl Inhalte</label><input type="number" min={1} value={form.anzahl_videos} onChange={e => setForm((f: any) => ({ ...f, anzahl_videos: e.target.value }))} className={inputCls} /></div>
                  <div><label className={labelCls}>Sprache</label><select value={form.sprache} onChange={e => setForm((f: any) => ({ ...f, sprache: e.target.value }))} className={inputCls}>{SPRACHEN.map(s => <option key={s.code} value={s.code}>{s.label}</option>)}</select></div>
                </div>
                <div><label className={labelCls}>Absprache / Briefing (Zusammenfassung)</label><textarea value={form.inhalte} onChange={e => setForm((f: any) => ({ ...f, inhalte: e.target.value }))} rows={3} placeholder="z. B. 1 Reel mit Unboxing + Tragebild, Code im Text, Story mit Link-Sticker" className={inputCls} /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className={labelCls}>Posting bis</label><input type="date" value={form.posting_bis} onChange={e => setForm((f: any) => ({ ...f, posting_bis: e.target.value }))} className={inputCls} /></div>
                  <div><label className={labelCls}>Mind. online (Tage)</label><input type="number" min={1} value={form.online_tage} onChange={e => setForm((f: any) => ({ ...f, online_tage: e.target.value }))} className={inputCls} /></div>
                  <div><label className={labelCls}>Rabattcode</label><input value={form.rabatt_code} onChange={e => setForm((f: any) => ({ ...f, rabatt_code: e.target.value }))} placeholder="z. B. LENA15" className={inputCls} /></div>
                </div>
                <div>
                  <label className={labelCls}>Vergütung</label>
                  <div className="flex gap-1 mb-2">{(['produkt', 'fee', 'beides'] as const).map(a => <button key={a} onClick={() => setForm((f: any) => ({ ...f, verguetung_art: a }))} className={`text-xs px-3 py-1.5 rounded-full border ${form.verguetung_art === a ? 'bg-accent text-white border-accent' : 'border-hairline text-ink-3'}`}>{a === 'produkt' ? 'Nur Produkt' : a === 'fee' ? 'Nur Fee' : 'Produkt + Fee'}</button>)}</div>
                  <div className="grid grid-cols-2 gap-3">
                    {form.verguetung_art !== 'fee' && <><div><label className={labelCls}>Produkte</label><input value={form.produkte} onChange={e => setForm((f: any) => ({ ...f, produkte: e.target.value }))} placeholder="z. B. 2 Armbänder nach Wahl" className={inputCls} /></div><div><label className={labelCls}>Produktwert (€)</label><input value={form.produktwert} onChange={e => setForm((f: any) => ({ ...f, produktwert: e.target.value }))} className={inputCls} /></div><div><label className={labelCls}>Versand bis</label><input type="date" value={form.versand_bis} onChange={e => setForm((f: any) => ({ ...f, versand_bis: e.target.value }))} className={inputCls} /></div></>}
                    {form.verguetung_art !== 'produkt' && <><div><label className={labelCls}>Fee (€)</label><input value={form.fee} onChange={e => setForm((f: any) => ({ ...f, fee: e.target.value }))} className={inputCls} /></div><div><label className={labelCls}>Zahlung innerhalb (Tage)</label><input type="number" value={form.zahlung_tage} onChange={e => setForm((f: any) => ({ ...f, zahlung_tage: e.target.value }))} className={inputCls} /></div></>}
                    <div><label className={labelCls}>Provision (% auf Code-Umsatz, optional)</label><input value={form.provision} onChange={e => setForm((f: any) => ({ ...f, provision: e.target.value }))} placeholder="z. B. 10" className={inputCls} /></div>
                    <div><label className={labelCls}>Exklusivität (Wochen, optional)</label><input type="number" min={0} value={form.exklusiv_wochen} onChange={e => setForm((f: any) => ({ ...f, exklusiv_wochen: e.target.value }))} placeholder="0 = keine" className={inputCls} /></div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-ink-2">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={!!form.nutzungsrechte_ads} onChange={e => setForm((f: any) => ({ ...f, nutzungsrechte_ads: e.target.checked }))} />Nutzung für bezahlte Ads erlaubt</label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.freigabe !== false} onChange={e => setForm((f: any) => ({ ...f, freigabe: e.target.checked }))} />Freigabe vor Veröffentlichung</label>
                </div>
                <div><label className={labelCls}>Zusätzliche Vereinbarungen</label><textarea value={form.zusatz} onChange={e => setForm((f: any) => ({ ...f, zusatz: e.target.value }))} rows={2} className={inputCls} /></div>
                {error && <div className="text-red-400 text-sm">{error}</div>}
                <div className="flex gap-2 justify-end"><button onClick={() => setShow(false)} className="px-4 py-2 rounded-apple-sm border border-hairline text-ink-2 text-sm">Abbrechen</button><button onClick={save} disabled={saving} className="px-4 py-2 rounded-apple-sm bg-accent text-white text-sm font-medium disabled:opacity-50">{saving ? 'Speichert…' : editId ? 'Speichern' : 'Vertrag erstellen'}</button></div>
              </div>
            </div>
            <div className={(preview ? '' : 'hidden md:block ') + 'bg-white text-neutral-900 rounded-apple-md p-6 max-h-[80vh] overflow-y-auto'}>
              <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400 mb-1">Vorschau · Kooperationsvereinbarung</p>
              <h3 className="text-xl mb-4" style={{ fontFamily: 'Georgia, serif' }}>{form.creator_name || 'Creator'}</h3>
              {klauselnFuer(previewV).map((k, i) => (
                <section key={i} className="py-3 border-t border-neutral-200 first:border-t-0">
                  <h4 className="text-[14px] mb-1" style={{ fontFamily: 'Georgia, serif' }}><span className="text-neutral-300 mr-2">{String(i + 1).padStart(2, '0')}</span>{k.titel}</h4>
                  {k.absaetze.map((a, j) => <p key={j} className="text-[12.5px] leading-relaxed text-neutral-600 mb-1">{a}</p>)}
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
