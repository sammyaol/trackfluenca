'use client'
import { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import { createBrowserClient } from '@supabase/ssr'

const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const farben = ['from-violet-600 to-purple-800','from-blue-600 to-cyan-800','from-amber-600 to-orange-800','from-emerald-600 to-teal-800','from-rose-600 to-pink-800']
const statusStyle: Record<string, string> = {
  'Aktiv': 'text-emerald-400 bg-emerald-950 border border-emerald-800/30',
  'Geplant': 'text-blue-400 bg-blue-950 border border-blue-800/30',
  'Abgeschlossen': 'text-ink-2 bg-surface-3 border border-hairline/50',
}
const roasColor = (r: number) => r >= 3 ? 'text-emerald-400' : r >= 1 ? 'text-amber-400' : 'text-ink-4'

export default function Kampagnen() {
  const [kampagnen, setKampagnen] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<any | null>(null)
  const [form, setForm] = useState({ name: '', status: 'Aktiv', start_datum: '', end_datum: '', budget: '', beschreibung: '' })
  const [editForm, setEditForm] = useState<any>(null)
  const creatorInputRef = useRef<HTMLInputElement>(null)
  const [allCreators, setAllCreators] = useState<any[]>([])
  const [showCreatorDropdown, setShowCreatorDropdown] = useState(false)

  useEffect(() => {
    sb.auth.getSession().then(async ({data}) => {
      const token = data.session?.access_token || ''
      const cr = await fetch('/api/creators', { headers: { authorization: 'Bearer ' + token } })
      const crData = await cr.json()
      if (Array.isArray(crData)) setAllCreators(crData)
      setLoading(true)
      const res = await fetch('/api/kampagnen', { headers: { authorization: 'Bearer ' + token } })
      const d = await res.json()
      if (Array.isArray(d)) setKampagnen(d.map((k: any, i: number) => ({ ...k, creators: Array.isArray(k.creators) ? k.creators : [], farbe: farben[i % farben.length] })))
      setLoading(false)
    })
  }, [])

  const createKampagne = async () => {
    if (!form.name) return
    const { data: s } = await sb.auth.getSession()
    const token = s.session?.access_token || ''
    const res = await fetch('/api/kampagnen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token },
      body: JSON.stringify({ name: form.name, status: form.status, start_datum: form.start_datum, end_datum: form.end_datum, budget: Number(form.budget) || 0, beschreibung: form.beschreibung })
    })
    const d = await res.json()
    if (d.id) setKampagnen(prev => [{ ...d, farbe: farben[prev.length % farben.length] }, ...prev])
    setShowModal(false)
    setForm({ name: '', status: 'Aktiv', start_datum: '', end_datum: '', budget: '', beschreibung: '' })
  }

  const deleteKampagne = async (id: string) => {
    const { data: s } = await sb.auth.getSession()
    const token = s.session?.access_token || ''
    await fetch(`/api/kampagnen/${id}`, { method: 'DELETE', headers: { authorization: 'Bearer ' + token } })
    setKampagnen(prev => prev.filter(k => k.id !== id))
    setSelected(null)
  }

  const updateKampagne = async (id: string, fields: any) => {
    const { data: s } = await sb.auth.getSession()
    const token = s.session?.access_token || ''
    await fetch(`/api/kampagnen/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token },
      body: JSON.stringify(fields)
    })
    setKampagnen(prev => prev.map(k => k.id === id ? { ...k, ...fields } : k))
    setSelected((prev: any) => prev ? { ...prev, ...fields } : prev)
  }

  const totalBudget = kampagnen.reduce((s, k) => s + (k.budget || 0), 0)
  const totalUmsatz = kampagnen.reduce((s, k) => s + (k.umsatz || 0), 0)
  const roasArr = kampagnen.filter(k => (k.roas || 0) > 0)
  const avgRoas = roasArr.length ? roasArr.reduce((s, k) => s + (k.roas || 0), 0) / roasArr.length : 0

  return (
    <div className="flex min-h-screen bg-surface-0">
      <Sidebar />
      <main className="flex-1 md:ml-60 min-h-screen">
        <div className="border-b border-hairline-soft px-8 py-4 flex items-center justify-between bg-surface-0/80 backdrop-blur sticky top-0 z-20">
          <div>
            <h1 className="text-ink-1 font-semibold text-lg">Kampagnen</h1>
            <p className="text-ink-4 text-xs mt-0.5">{kampagnen.length} Kampagnen · {kampagnen.filter(k => k.status === 'Aktiv').length} aktiv</p>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-apple-sm bg-accent text-ink-1 text-sm hover:bg-accent-hover shadow-[0_6px_20px_-4px_rgba(10,132,255,0.55)] transition-colors font-medium">
            + Kampagne erstellen
          </button>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Gesamt Budget', value: `${totalBudget.toLocaleString('de-DE')} €` },
              { label: 'Gesamt Umsatz', value: `${totalUmsatz.toLocaleString('de-DE')} €`, color: 'text-emerald-400' },
              { label: 'Aktive Kampagnen', value: kampagnen.filter(k => k.status === 'Aktiv').length, color: 'text-blue-400' },
              { label: 'Ø ROAS', value: `${avgRoas.toFixed(1)}x`, color: 'text-emerald-400' },
            ].map(m => (
              <div key={m.label} className="bg-surface-2 rounded-apple-lg p-5 border border-hairline-soft">
                <div className={`text-2xl font-semibold mb-1 ${m.color || 'text-ink-1'}`}>{m.value}</div>
                <div className="text-ink-4 text-xs font-medium">{m.label}</div>
              </div>
            ))}
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
              <span className="text-ink-3 text-sm">Kampagnen werden geladen...</span>
            </div>
          ) : kampagnen.length === 0 ? (
            <div className="text-center py-20 text-ink-4">Noch keine Kampagnen. Erstelle deine erste!</div>
          ) : (
            <div className="flex flex-col gap-4">
              {kampagnen.map(k => (
                <div key={k.id} onClick={() => setSelected(k)} className="bg-surface-2 rounded-apple-lg border border-hairline-soft overflow-hidden hover:border-white/[0.12] cursor-pointer transition-all">
                  <div className="flex items-stretch">
                    <div className={`w-1.5 bg-gradient-to-b ${k.farbe} flex-shrink-0`} />
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-ink-1 font-semibold">{k.name}</h2>
                            <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${statusStyle[k.status] || statusStyle['Geplant']}`}>{k.status}</span>
                          </div>
                          <p className="text-ink-4 text-xs">{k.start_datum} – {k.end_datum}</p>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${(k.roas || 0) > 0 ? roasColor(k.roas) : 'text-ink-4'}`}>{(k.roas || 0) > 0 ? `${k.roas}x` : '—'}</div>
                          <div className="text-ink-4 text-xs">ROAS</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: 'Budget', value: `${(k.budget || 0).toLocaleString('de-DE')} €` },
                          { label: 'Umsatz', value: (k.umsatz || 0) > 0 ? `${k.umsatz.toLocaleString('de-DE')} €` : '—', color: (k.umsatz || 0) > 0 ? 'text-emerald-400' : '' },
                          { label: 'Beschreibung', value: k.beschreibung || '—' },
                        ].map(s => (
                          <div key={s.label} className="bg-surface-0 rounded-apple-sm p-3 border border-hairline-soft">
                            <div className="text-ink-4 text-xs mb-1">{s.label}</div>
                            <div className={`text-sm font-semibold truncate ${s.color || 'text-ink-1'}`}>{s.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {selected && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
            <div className="bg-surface-2 rounded-apple-lg w-full max-w-lg border border-hairline" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-5 border-b border-hairline-soft">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-ink-1 font-semibold">{selected.name}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-md ${statusStyle[selected.status] || statusStyle['Geplant']}`}>{selected.status}</span>
                  </div>
                  <p className="text-ink-4 text-xs mt-1">{selected.start_datum} – {selected.end_datum}</p>
                </div>
                <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-apple-sm bg-white/[0.05] flex items-center justify-center text-ink-2 hover:text-ink-1 text-lg">×</button>
              </div>
              <div className="p-6 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-0 rounded-apple-sm p-3 border border-hairline-soft">
                    <div className="text-ink-4 text-xs mb-1">Budget</div>
                    <div className="text-lg font-semibold text-ink-1">{(selected.budget || 0).toLocaleString('de-DE')} €</div>
                  </div>
                  <div className="bg-surface-0 rounded-apple-sm p-3 border border-hairline-soft">
                    <div className="text-ink-4 text-xs mb-1">Status</div>
                    <select value={selected.status} onChange={e => updateKampagne(selected.id, {status: e.target.value})} className="bg-transparent text-ink-1 text-sm font-semibold w-full focus:outline-none">
                      {['Aktiv','Geplant','Abgeschlossen'].map(s => <option key={s} className="bg-surface-3">{s}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-ink-4 text-xs block mb-1">Name</label>
                  <input defaultValue={selected.name} onBlur={e => updateKampagne(selected.id, {name: e.target.value})} className="w-full bg-surface-0 border border-hairline rounded-apple-sm px-3 py-2 text-ink-1 text-sm focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-ink-4 text-xs block mb-1">Start</label>
                    <input defaultValue={selected.start_datum} onBlur={e => updateKampagne(selected.id, {start_datum: e.target.value})} className="w-full bg-surface-0 border border-hairline rounded-apple-sm px-3 py-2 text-ink-1 text-sm focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-ink-4 text-xs block mb-1">Ende</label>
                    <input defaultValue={selected.end_datum} onBlur={e => updateKampagne(selected.id, {end_datum: e.target.value})} className="w-full bg-surface-0 border border-hairline rounded-apple-sm px-3 py-2 text-ink-1 text-sm focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-ink-4 text-xs block mb-1">Budget €</label>
                  <input type="number" defaultValue={selected.budget} onBlur={e => updateKampagne(selected.id, {budget: Number(e.target.value)})} className="w-full bg-surface-0 border border-hairline rounded-apple-sm px-3 py-2 text-ink-1 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-ink-4 text-xs block mb-1">Beschreibung</label>
                  <textarea defaultValue={selected.beschreibung} onBlur={e => updateKampagne(selected.id, {beschreibung: e.target.value})} rows={2} className="w-full bg-surface-0 border border-hairline rounded-apple-sm px-3 py-2 text-ink-1 text-sm focus:outline-none resize-none" />
                </div>
                {/* Creator-Bereich */}
                <div>
                  <label className="text-ink-4 text-xs block mb-2">Creator in dieser Kampagne</label>
                  <div className="space-y-2">
                    {allCreators.filter((c:any) => (c.kampagne || '') === selected.name).length === 0 ? (
                      <div className="text-ink-4 text-xs">Noch keine Creator zugeordnet. Zuordnung erfolgt in der Creator-Tabelle (Spalte Kampagne).</div>
                    ) : allCreators.filter((c:any) => (c.kampagne || '') === selected.name).map((c:any) => (
                      <div key={c.id} className="flex items-center gap-3 bg-surface-0 rounded-apple-sm px-3 py-2 border border-hairline-soft">
                        {c.ig_image ? (
                          <img src={c.ig_image} className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs text-accent">{c.name?.[0]?.toUpperCase()}</div>
                        )}
                        <span className="text-ink-1 text-xs">{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSelected(null)} className="flex-1 py-2.5 rounded-apple-sm border border-white/20 text-ink-1 text-sm hover:bg-white/[0.06] transition-colors">
                    Schließen
                  </button>
                  <button onClick={() => deleteKampagne(selected.id)} className="flex-1 py-2.5 rounded-apple-sm border border-red-900/50 text-red-500 hover:bg-red-950/50 transition-colors text-sm">Löschen</button>
                </div>
              </div>
            </div>
          </div>
        )}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
            <div className="bg-surface-2 rounded-apple-lg w-full max-w-md border border-hairline" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-5 border-b border-hairline-soft">
                <h2 className="text-ink-1 font-semibold">Neue Kampagne</h2>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-apple-sm bg-white/[0.05] flex items-center justify-center text-ink-2 hover:text-ink-1 text-lg">×</button>
              </div>
              <div className="p-6 flex flex-col gap-3">
                <div><label className="text-ink-3 text-xs mb-1.5 block">Name *</label><input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="SS25 Launch" className="w-full bg-surface-0 border border-hairline rounded-apple-sm px-4 py-2.5 text-ink-1 text-sm placeholder-gray-700 focus:outline-none" /></div>
                <div><label className="text-ink-3 text-xs mb-1.5 block">Status</label><select value={form.status} onChange={e => setForm(p => ({...p, status: e.target.value}))} className="w-full bg-surface-0 border border-hairline rounded-apple-sm px-4 py-2.5 text-ink-1 text-sm focus:outline-none">{['Aktiv','Geplant','Abgeschlossen'].map(s => <option key={s}>{s}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-ink-3 text-xs mb-1.5 block">Start</label><input value={form.start_datum} onChange={e => setForm(p => ({...p, start_datum: e.target.value}))} placeholder="01.05.2026" className="w-full bg-surface-0 border border-hairline rounded-apple-sm px-4 py-2.5 text-ink-1 text-sm placeholder-gray-700 focus:outline-none" /></div>
                  <div><label className="text-ink-3 text-xs mb-1.5 block">Ende</label><input value={form.end_datum} onChange={e => setForm(p => ({...p, end_datum: e.target.value}))} placeholder="31.07.2026" className="w-full bg-surface-0 border border-hairline rounded-apple-sm px-4 py-2.5 text-ink-1 text-sm placeholder-gray-700 focus:outline-none" /></div>
                </div>
                <div><label className="text-ink-3 text-xs mb-1.5 block">Budget €</label><input type="number" value={form.budget} onChange={e => setForm(p => ({...p, budget: e.target.value}))} placeholder="25000" className="w-full bg-surface-0 border border-hairline rounded-apple-sm px-4 py-2.5 text-ink-1 text-sm placeholder-gray-700 focus:outline-none" /></div>
                <div><label className="text-ink-3 text-xs mb-1.5 block">Beschreibung</label><textarea value={form.beschreibung} onChange={e => setForm(p => ({...p, beschreibung: e.target.value}))} rows={2} className="w-full bg-surface-0 border border-hairline rounded-apple-sm px-4 py-2.5 text-ink-1 text-sm placeholder-gray-700 focus:outline-none resize-none" /></div>
                <button onClick={createKampagne} disabled={!form.name} className="w-full py-3 rounded-apple-sm bg-accent text-ink-1 text-sm hover:bg-accent-hover shadow-[0_6px_20px_-4px_rgba(10,132,255,0.55)] transition-colors font-medium disabled:opacity-50 mt-1">Kampagne erstellen</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
