'use client'
import Sidebar from '../components/Sidebar'
import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const eur = (n: number) => (n || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const int = (n: number) => (n || 0).toLocaleString('de-DE')
const dat = (d?: string | null) => d ? new Date(d.length === 10 ? d + 'T12:00:00' : d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
const PLATTFORMEN = ['Instagram', 'TikTok', 'Instagram & TikTok']
const FORMATE = ['Reel', 'TikTok-Video', 'Story', 'Foto-Post', 'Karussell']
const emptyCreator = { name: '', ig_handle: '', tt_handle: '', rabatt_code: '', ziel_url: '', geschlecht: '', notizen: '' }
const emptyPost = { plattform: 'Instagram', format: 'Reel', datum: '', post_link: '', fee: '', produkt: '', views: '', notizen: '' }

export default function Mklusive() {
  const [data, setData] = useState<any>({ me: null, creators: [], posts: [], orders: [], members: [] })
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<any>(emptyCreator)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [selId, setSelId] = useState<string | null>(null)
  const [postForm, setPostForm] = useState<any>(emptyPost)
  const [postEditId, setPostEditId] = useState<string | null>(null)
  const [showPost, setShowPost] = useState(false)
  const [confirm, setConfirm] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [memberMail, setMemberMail] = useState('')
  const [memberMsg, setMemberMsg] = useState('')

  const getToken = async () => (await sb.auth.getSession()).data.session?.access_token || ''
  const api = async (url: string, method = 'GET', body?: any) => {
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + await getToken() }, body: body ? JSON.stringify(body) : undefined })
    const j = await r.json().catch(() => ({}))
    return { ok: r.ok, j }
  }
  const load = async () => {
    const { ok, j } = await api('/api/mklusive')
    if (ok) setData(j)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const sync = async () => {
    setSyncing(true)
    await api('/api/shopify-sync', 'POST', {})
    await load()
    setSyncing(false)
  }
  const copy = async (k: string, t: string) => { try { await navigator.clipboard.writeText(t); setCopied(k); setTimeout(() => setCopied(c => c === k ? null : c), 1500) } catch {} }
  const twoClick = (k: string, fn: () => void) => { if (confirm === k) { setConfirm(null); fn() } else setConfirm(k) }

  const creators: any[] = data.creators
  const shown = useMemo(() => creators.filter(c => !search || (c.name + ' ' + (c.ig_handle || '') + ' ' + (c.tt_handle || '') + ' ' + (c.rabatt_code || '')).toLowerCase().includes(search.toLowerCase())), [creators, search])
  const tot = useMemo(() => {
    const t = { posts: 0, kosten: 0, klicks: 0, bestellungen: 0, umsatz: 0 }
    creators.forEach(c => { t.posts += c.posts; t.kosten += c.kosten; t.klicks += c.klicks; t.bestellungen += c.bestellungen; t.umsatz += c.umsatz })
    return t
  }, [creators])
  const sel = creators.find(c => c.id === selId)
  const selPosts = (data.posts as any[]).filter(p => p.creator_id === selId)
  const selOrders = sel?.rabatt_code ? (data.orders as any[]).filter(o => o.code === sel.rabatt_code) : []

  const openAdd = () => { setForm(emptyCreator); setEditId(null); setError(''); setShowForm(true) }
  const openEdit = (c: any) => { setForm({ name: c.name, ig_handle: c.ig_handle || '', tt_handle: c.tt_handle || '', rabatt_code: c.rabatt_code || '', ziel_url: '', geschlecht: c.geschlecht || '', notizen: c.notizen || '' }); setEditId(c.id); setError(''); setShowForm(true) }
  const saveCreator = async () => {
    setError('')
    if (!form.name.trim()) { setError('Bitte einen Namen eingeben.'); return }
    setSaving(true)
    const { ok, j } = editId ? await api('/api/mklusive/creators/' + editId, 'PATCH', form) : await api('/api/mklusive/creators', 'POST', form)
    setSaving(false)
    if (!ok) { setError(j.error || 'Fehler beim Speichern'); return }
    setShowForm(false)
    await load()
    if (!editId) setSelId(j.id)
  }
  const removeCreator = async (id: string) => { await api('/api/mklusive/creators/' + id, 'DELETE'); setSelId(null); await load() }

  const openPost = (p?: any) => {
    setPostForm(p ? { plattform: p.plattform || 'Instagram', format: p.format || 'Reel', datum: p.datum || '', post_link: p.post_link || '', fee: p.fee ?? '', produkt: p.produkt ?? '', views: p.views ?? '', notizen: p.notizen || '' } : emptyPost)
    setPostEditId(p?.id || null); setShowPost(true)
  }
  const savePost = async () => {
    if (!selId) return
    const body = { ...postForm, creator_id: selId }
    const { ok } = postEditId ? await api('/api/mklusive/posts/' + postEditId, 'PATCH', body) : await api('/api/mklusive/posts', 'POST', body)
    if (ok) { setShowPost(false); setPostEditId(null); await load() }
  }
  const removePost = async (id: string) => { await api('/api/mklusive/posts/' + id, 'DELETE'); await load() }

  const addMember = async () => {
    setMemberMsg('')
    const { ok, j } = await api('/api/mklusive/members', 'POST', { email: memberMail })
    if (ok) { setMemberMail(''); setMemberMsg('Zugang freigegeben.'); await load() } else setMemberMsg(j.error || 'Fehler')
  }
  const removeMember = async (user_id: string) => { await api('/api/mklusive/members', 'DELETE', { user_id }); await load() }

  const inputCls = 'w-full bg-surface-3 border border-hairline rounded-apple-sm px-3 py-2 text-ink-1 text-sm focus:outline-none focus:border-accent/40'
  const labelCls = 'text-ink-3 text-xs mb-1 block font-medium'
  const btnDel = (active: boolean) => `text-[11px] px-2 py-1 rounded whitespace-nowrap ${active ? 'bg-red-600 text-white' : 'bg-red-950/30 text-red-400 hover:bg-red-950/50'}`

  const renderRoas = (r: number | null) => r == null ? '—' : r.toFixed(2).replace('.', ',') + 'x'

  return (
    <div className="flex min-h-screen bg-surface-0">
      <Sidebar />
      <main className="flex-1 md:ml-60 min-h-screen pb-20 md:pb-0">
        <div className="border-b border-hairline-soft px-8 py-5 flex items-center justify-between bg-surface-0/80 backdrop-blur-xl sticky top-0 z-20">
          <div>
            <h1 className="text-ink-1 font-semibold text-lg tracking-tight">Mklusive Portal</h1>
            <p className="text-ink-3 text-xs mt-0.5">Eigene Creator, Rabattcodes, Tracking-Links, Posts und Performance</p>
          </div>
          {data.me?.role && (
            <div className="flex items-center gap-2">
              <button onClick={sync} disabled={syncing} className="px-3 py-2 rounded-apple-sm border border-hairline text-ink-2 text-xs hover:text-ink-1 disabled:opacity-50">{syncing ? 'Aktualisiert…' : 'Aktualisieren'}</button>
              <button onClick={openAdd} className="bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-apple-sm px-4 py-2">+ Creator hinzufügen</button>
            </div>
          )}
        </div>

        <div className="p-8 space-y-6">
          {loading ? <div className="text-ink-4 text-sm py-10 text-center">Lädt…</div> : !data.me?.role ? (
            <div className="max-w-md mx-auto text-center py-16">
              <h2 className="text-ink-1 font-semibold mb-2">Noch nicht freigeschaltet</h2>
              <p className="text-ink-3 text-sm">Dein Account ({data.me?.email}) ist noch nicht für das Mklusive-Portal freigegeben. Bitte kurz bei Koluré melden, dann geht es los.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                {[['Creator', int(creators.length)], ['Posts', int(tot.posts)], ['Klicks', int(tot.klicks)], ['Bestellungen', int(tot.bestellungen)], ['Umsatz', eur(tot.umsatz)], ['Kosten', eur(tot.kosten)], ['ROAS', renderRoas(tot.kosten > 0 ? tot.umsatz / tot.kosten : null)]].map(([l, v]) => (
                  <div key={l} className="bg-surface-2 rounded-apple-lg p-4 border border-hairline-soft">
                    <div className="text-ink-3 text-xs font-medium mb-1">{l}</div>
                    <div className="text-xl font-semibold text-ink-1">{v}</div>
                  </div>
                ))}
              </div>

              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Creator, Handle oder Code suchen…" className={inputCls + ' max-w-sm'} />

              <div className="bg-surface-2 rounded-apple-lg border border-hairline-soft overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-ink-3 text-xs text-left border-b border-hairline-soft">
                      {['Creator', 'Rabattcode', 'Posts', 'Kosten', 'Klicks', 'Bestellungen', 'Umsatz', 'ROAS', 'Link'].map(h => <th key={h} className="px-4 py-3 font-medium whitespace-nowrap">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {shown.length === 0 && <tr><td colSpan={9} className="text-center text-ink-4 py-10">Noch keine Creator. Füge oben den ersten hinzu.</td></tr>}
                    {shown.map(c => (
                      <tr key={c.id} onClick={() => { setSelId(c.id); setShowPost(false) }} className="border-b border-hairline-soft last:border-0 hover:bg-white/[0.03] cursor-pointer">
                        <td className="px-4 py-3"><div className="text-ink-1 font-medium">{c.name}</div><div className="text-ink-4 text-xs">{[c.ig_handle, c.tt_handle].filter(Boolean).join(' · ')}</div></td>
                        <td className="px-4 py-3 text-ink-2">{c.rabatt_code || <span className="text-ink-4">—</span>}</td>
                        <td className="px-4 py-3 text-ink-2">{c.posts}</td>
                        <td className="px-4 py-3 text-ink-2">{eur(c.kosten)}</td>
                        <td className="px-4 py-3 text-ink-2">{int(c.klicks)}</td>
                        <td className="px-4 py-3 text-ink-2">{int(c.bestellungen)}</td>
                        <td className="px-4 py-3 text-emerald-400 font-medium">{eur(c.umsatz)}</td>
                        <td className="px-4 py-3 text-ink-1">{renderRoas(c.roas)}</td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          {c.link && <button onClick={() => copy('l' + c.id, c.link.url)} className="text-[11px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-ink-2 whitespace-nowrap">{copied === 'l' + c.id ? '✓ Kopiert' : 'Link kopieren'}</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-ink-4 text-xs">Klicks zählt der Tracking-Link live. Bestellungen und Umsatz kommen vom Rabattcode aus Shopify (stündlicher Abgleich, oder oben auf „Aktualisieren“). Kosten = Gage + Produktwert aller Posts, ROAS = Umsatz ÷ Kosten.</p>

              {data.me.role === 'admin' && (
                <div className="bg-surface-2 rounded-apple-lg border border-hairline-soft p-5 space-y-3">
                  <h2 className="text-ink-1 font-medium text-sm">Zugang für Mklusive</h2>
                  <p className="text-ink-4 text-xs">Die Person registriert sich selbst unter trackfluenca.com/login und bestätigt die Mail. Danach gibst du hier ihre E-Mail frei. Sie sieht ausschließlich dieses Portal.</p>
                  <div className="flex gap-2 max-w-lg">
                    <input value={memberMail} onChange={e => setMemberMail(e.target.value)} placeholder="E-Mail der Agentur-Person" className={inputCls} />
                    <button onClick={addMember} className="bg-accent hover:bg-accent-hover text-white text-sm rounded-apple-sm px-4 whitespace-nowrap">Freigeben</button>
                  </div>
                  {memberMsg && <p className="text-ink-3 text-xs">{memberMsg}</p>}
                  <div className="space-y-1">
                    {(data.members as any[]).map(mm => (
                      <div key={mm.user_id} className="flex items-center gap-2 text-sm text-ink-2">
                        <span>{mm.email}</span><span className="text-ink-4 text-xs">{mm.role === 'admin' ? 'Admin' : 'Agentur'}</span>
                        {mm.role !== 'admin' && <button onClick={() => twoClick('m' + mm.user_id, () => removeMember(mm.user_id))} className={btnDel(confirm === 'm' + mm.user_id) + ' ml-auto'}>{confirm === 'm' + mm.user_id ? 'Sicher?' : 'Zugang entfernen'}</button>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <div className="bg-surface-2 rounded-apple-lg w-full max-w-lg border border-hairline max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-hairline-soft">
                <h2 className="text-ink-1 font-semibold">{editId ? 'Creator bearbeiten' : 'Creator hinzufügen'}</h2>
                <button onClick={() => setShowForm(false)} className="text-ink-3 hover:text-ink-1 text-xl leading-none">×</button>
              </div>
              <div className="overflow-y-auto p-6 space-y-4">
                <div><label className={labelCls}>Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Instagram</label><input value={form.ig_handle} onChange={e => setForm({ ...form, ig_handle: e.target.value })} placeholder="@name" className={inputCls} /></div>
                  <div><label className={labelCls}>TikTok</label><input value={form.tt_handle} onChange={e => setForm({ ...form, tt_handle: e.target.value })} placeholder="@name" className={inputCls} /></div>
                </div>
                <div>
                  <label className={labelCls}>Rabattcode</label>
                  <input value={form.rabatt_code} onChange={e => setForm({ ...form, rabatt_code: e.target.value })} placeholder="z. B. KATJA10" className={inputCls} />
                  <p className="text-ink-4 text-[10px] mt-1">Der Code muss in Shopify angelegt sein. Bestellungen und Umsatz werden darüber automatisch gezählt.</p>
                </div>
                <div>
                  <label className={labelCls}>Zielseite des Links (optional)</label>
                  <input value={form.ziel_url} onChange={e => setForm({ ...form, ziel_url: e.target.value })} placeholder="https://kolure.de (Standard)" className={inputCls} />
                </div>
                <div><label className={labelCls}>Notizen</label><textarea rows={2} value={form.notizen} onChange={e => setForm({ ...form, notizen: e.target.value })} className={inputCls + ' resize-none'} /></div>
                {error && <p className="text-red-400 text-xs">{error}</p>}
                <button onClick={saveCreator} disabled={saving} className="w-full bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-apple-sm py-2.5 disabled:opacity-50">{saving ? 'Speichert…' : editId ? 'Speichern' : 'Creator anlegen und Link erzeugen'}</button>
              </div>
            </div>
          </div>
        )}

        {sel && (
          <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelId(null)}>
            <div className="bg-surface-2 rounded-apple-lg w-full max-w-3xl border border-hairline max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between px-6 py-4 border-b border-hairline-soft">
                <div>
                  <h2 className="text-ink-1 font-semibold text-lg">{sel.name}</h2>
                  <p className="text-ink-4 text-xs mt-0.5">{[sel.ig_handle, sel.tt_handle].filter(Boolean).join(' · ') || 'Keine Handles'}{sel.rabatt_code ? ` · Code ${sel.rabatt_code}` : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(sel)} className="text-xs px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-ink-2">Bearbeiten</button>
                  <button onClick={() => twoClick('c' + sel.id, () => removeCreator(sel.id))} className={btnDel(confirm === 'c' + sel.id)}>{confirm === 'c' + sel.id ? 'Creator + Posts wirklich löschen?' : 'Löschen'}</button>
                  <button onClick={() => setSelId(null)} className="text-ink-3 hover:text-ink-1 text-xl leading-none ml-1">×</button>
                </div>
              </div>
              <div className="overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[['Klicks', int(sel.klicks)], ['Besuche (90 Tage)', sel.sessions ? int(sel.sessions) : '—'], ['Bestellungen', int(sel.bestellungen)], ['Umsatz', eur(sel.umsatz)], ['Posts', int(sel.posts)], ['Kosten', eur(sel.kosten)], ['ROAS', renderRoas(sel.roas)], ['Kosten pro Bestellung', sel.cpa ? eur(sel.cpa) : '—']].map(([l, v]) => (
                    <div key={l} className="bg-surface-3 rounded-apple-sm p-3"><div className="text-ink-4 text-[10px] mb-0.5">{l}</div><div className="text-ink-1 font-semibold">{v}</div></div>
                  ))}
                </div>

                <div className="space-y-2">
                  <h3 className="text-ink-1 text-sm font-medium">Tracking-Link</h3>
                  {sel.link ? (
                    <>
                      <div className="flex gap-2"><input readOnly value={sel.link.url} onFocus={e => e.currentTarget.select()} className={inputCls + ' text-xs'} /><button onClick={() => copy('s', sel.link.url)} className="px-3 rounded-apple-sm bg-accent text-white text-xs whitespace-nowrap">{copied === 's' ? '✓' : 'Kopieren'}</button></div>
                      <p className="text-ink-4 text-[10px]">Zählt jeden Klick und leitet auf kolure.de weiter{sel.rabatt_code ? `, der Rabattcode ${sel.rabatt_code} wird automatisch angewendet` : ''}. Zusätzlich werden die Besucher mit UTM-Parametern markiert (für Shopify und Triple Whale).</p>
                      <details><summary className="text-ink-4 text-[11px] cursor-pointer">Direktlink ohne Weiterleitung (für Bio/Story)</summary>
                        <div className="flex gap-2 mt-1"><input readOnly value={sel.link.direct} onFocus={e => e.currentTarget.select()} className={inputCls + ' text-xs'} /><button onClick={() => copy('d', sel.link.direct)} className="px-3 rounded-apple-sm bg-white/10 text-ink-2 text-xs">{copied === 'd' ? '✓' : 'Kopieren'}</button></div>
                      </details>
                    </>
                  ) : <p className="text-ink-4 text-xs">Kein Link vorhanden.</p>}
                  {sel.rabatt_code && !sel.code_synced_at && <p className="text-amber-400 text-xs">Der Rabattcode wurde noch nicht mit Shopify abgeglichen. Oben auf „Aktualisieren“ klicken. Erscheint er danach nicht, prüfe, ob der Code in Shopify genau so existiert.</p>}
                  {sel.code_status === 'NOT_FOUND' && <p className="text-red-400 text-xs">Shopify kennt den Code „{sel.rabatt_code}“ nicht. Bitte in Shopify anlegen oder die Schreibweise prüfen.</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-ink-1 text-sm font-medium">Posts ({selPosts.length})</h3>
                    <button onClick={() => openPost()} className="text-xs px-3 py-1.5 rounded bg-accent text-white hover:bg-accent-hover">+ Post hinzufügen</button>
                  </div>
                  {showPost && (
                    <div className="border border-hairline-soft rounded-apple-sm p-4 space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div><label className={labelCls}>Plattform</label><select value={postForm.plattform} onChange={e => setPostForm({ ...postForm, plattform: e.target.value })} className={inputCls}>{PLATTFORMEN.map(x => <option key={x}>{x}</option>)}</select></div>
                        <div><label className={labelCls}>Format</label><select value={postForm.format} onChange={e => setPostForm({ ...postForm, format: e.target.value })} className={inputCls}>{FORMATE.map(x => <option key={x}>{x}</option>)}</select></div>
                        <div><label className={labelCls}>Datum</label><input type="date" value={postForm.datum} onChange={e => setPostForm({ ...postForm, datum: e.target.value })} className={inputCls} /></div>
                      </div>
                      <div><label className={labelCls}>Link zum Post</label><input value={postForm.post_link} onChange={e => setPostForm({ ...postForm, post_link: e.target.value })} placeholder="https://…" className={inputCls} /></div>
                      <div className="grid grid-cols-3 gap-3">
                        <div><label className={labelCls}>Gage (€)</label><input type="number" min={0} value={postForm.fee} onChange={e => setPostForm({ ...postForm, fee: e.target.value })} className={inputCls} /></div>
                        <div><label className={labelCls}>Produktwert (€)</label><input type="number" min={0} value={postForm.produkt} onChange={e => setPostForm({ ...postForm, produkt: e.target.value })} className={inputCls} /></div>
                        <div><label className={labelCls}>Views</label><input type="number" min={0} value={postForm.views} onChange={e => setPostForm({ ...postForm, views: e.target.value })} className={inputCls} /></div>
                      </div>
                      <div><label className={labelCls}>Notizen</label><input value={postForm.notizen} onChange={e => setPostForm({ ...postForm, notizen: e.target.value })} className={inputCls} /></div>
                      <div className="flex gap-2">
                        <button onClick={savePost} className="flex-1 bg-accent hover:bg-accent-hover text-white text-sm rounded-apple-sm py-2">{postEditId ? 'Speichern' : 'Post hinzufügen'}</button>
                        <button onClick={() => setShowPost(false)} className="border border-hairline text-ink-2 text-sm rounded-apple-sm px-4">Abbrechen</button>
                      </div>
                    </div>
                  )}
                  {selPosts.length === 0 && !showPost && <p className="text-ink-4 text-xs">Noch keine Posts.</p>}
                  {selPosts.map(p => (
                    <div key={p.id} className="flex items-center gap-3 bg-surface-3 rounded-apple-sm px-3 py-2 text-sm">
                      <div className="min-w-0 flex-1">
                        <div className="text-ink-1">{dat(p.datum)} · {p.format} · {p.plattform}</div>
                        <div className="text-ink-4 text-xs truncate">
                          {eur(Number(p.fee) || 0)} Gage{Number(p.produkt) ? ` + ${eur(Number(p.produkt))} Produkt` : ''}{p.views != null ? ` · ${int(Number(p.views))} Views` : ''}
                          {p.post_link && <> · <a href={p.post_link} target="_blank" rel="noreferrer" className="text-accent hover:underline">Post ansehen ↗</a></>}
                        </div>
                      </div>
                      <button onClick={() => openPost(p)} className="text-[11px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-ink-2">Bearbeiten</button>
                      <button onClick={() => twoClick('p' + p.id, () => removePost(p.id))} className={btnDel(confirm === 'p' + p.id)}>{confirm === 'p' + p.id ? 'Sicher?' : 'Löschen'}</button>
                    </div>
                  ))}
                </div>

                {selOrders.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-ink-1 text-sm font-medium">Letzte Bestellungen mit dem Code</h3>
                    <div className="space-y-1">
                      {selOrders.slice(0, 10).map(o => (
                        <div key={o.order_name} className="flex justify-between text-sm text-ink-2 bg-surface-3 rounded-apple-sm px-3 py-1.5"><span>{o.order_name} · {dat(o.order_date)}</span><span className="text-emerald-400">{eur(Number(o.amount))}</span></div>
                      ))}
                    </div>
                  </div>
                )}
                {sel.notizen && <div><h3 className="text-ink-1 text-sm font-medium mb-1">Notizen</h3><p className="text-ink-3 text-sm whitespace-pre-line">{sel.notizen}</p></div>}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
