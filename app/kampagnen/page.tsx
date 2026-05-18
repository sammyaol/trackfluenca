'use client'
import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { createBrowserClient } from '@supabase/ssr'

const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const farben = ['from-violet-600 to-purple-800','from-blue-600 to-cyan-800','from-amber-600 to-orange-800','from-emerald-600 to-teal-800','from-rose-600 to-pink-800']
const statusStyle: Record<string, string> = {
  'Aktiv': 'text-emerald-400 bg-emerald-950 border border-emerald-800/30',
  'Geplant': 'text-blue-400 bg-blue-950 border border-blue-800/30',
  'Abgeschlossen': 'text-gray-400 bg-gray-800 border border-gray-700/50',
}
const roasColor = (r: number) => r >= 3 ? 'text-emerald-400' : r >= 1 ? 'text-amber-400' : 'text-gray-600'

export default function Kampagnen() {
  const [kampagnen, setKampagnen] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<any | null>(null)
  const [form, setForm] = useState({ name: '', status: 'Aktiv', start_datum: '', end_datum: '', budget: '', beschreibung: '' })
  const [editForm, setEditForm] = useState<any>(null)

  useEffect(() => {
    sb.auth.getSession().then(async ({data}) => {
      const token = data.session?.access_token || ''
      const res = await fetch('/api/kampagnen', { headers: { authorization: 'Bearer ' + token } })
      const d = await res.json()
      if (Array.isArray(d)) setKampagnen(d.map((k: any, i: number) => ({ ...k, farbe: farben[i % farben.length] })))
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
    <div className="flex min-h-screen bg-[#0A0A0A]">
      <Sidebar />
      <main className="flex-1 md:ml-60 min-h-screen">
        <div className="border-b border-white/[0.06] px-8 py-4 flex items-center justify-between bg-[#0A0A0A]/80 backdrop-blur sticky top-0 z-20">
          <div>
            <h1 className="text-white font-semibold text-lg">Kampagnen</h1>
            <p className="text-gray-600 text-xs mt-0.5">{kampagnen.length} Kampagnen · {kampagnen.filter(k => k.status === 'Aktiv').length} aktiv</p>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7F77DD] text-white text-sm hover:bg-[#534AB7] transition-colors font-medium">
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
              <div key={m.label} className="bg-[#141414] rounded-2xl p-5 border border-white/[0.06]">
                <div className={`text-2xl font-semibold mb-1 ${m.color || 'text-white'}`}>{m.value}</div>
                <div className="text-gray-600 text-xs font-medium">{m.label}</div>
              </div>
            ))}
          </div>
          {kampagnen.length === 0 ? (
            <div className="text-center py-20 text-gray-600">Noch keine Kampagnen. Erstelle deine erste!</div>
          ) : (
            <div className="flex flex-col gap-4">
              {kampagnen.map(k => (
                <div key={k.id} onClick={() => setSelected(k)} className="bg-[#141414] rounded-2xl border border-white/[0.06] overflow-hidden hover:border-white/[0.12] cursor-pointer transition-all">
                  <div className="flex items-stretch">
                    <div className={`w-1.5 bg-gradient-to-b ${k.farbe} flex-shrink-0`} />
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-white font-semibold">{k.name}</h2>
                            <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${statusStyle[k.status] || statusStyle['Geplant']}`}>{k.status}</span>
                          </div>
                          <p className="text-gray-600 text-xs">{k.start_datum} – {k.end_datum}</p>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${(k.roas || 0) > 0 ? roasColor(k.roas) : 'text-gray-700'}`}>{(k.roas || 0) > 0 ? `${k.roas}x` : '—'}</div>
                          <div className="text-gray-600 text-xs">ROAS</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: 'Budget', value: `${(k.budget || 0).toLocaleString('de-DE')} €` },
                          { label: 'Umsatz', value: (k.umsatz || 0) > 0 ? `${k.umsatz.toLocaleString('de-DE')} €` : '—', color: (k.umsatz || 0) > 0 ? 'text-emerald-400' : '' },
                          { label: 'Beschreibung', value: k.beschreibung || '—' },
                        ].map(s => (
                          <div key={s.label} className="bg-[#0A0A0A] rounded-xl p-3 border border-white/[0.06]">
                            <div className="text-gray-600 text-xs mb-1">{s.label}</div>
                            <div className={`text-sm font-semibold truncate ${s.color || 'text-white'}`}>{s.value}</div>
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
            <div className="bg-[#141414] rounded-2xl w-full max-w-lg border border-white/[0.08]" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-white font-semibold">{selected.name}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-md ${statusStyle[selected.status] || statusStyle['Geplant']}`}>{selected.status}</span>
                  </div>
                  <p className="text-gray-600 text-xs mt-1">{selected.start_datum} – {selected.end_datum}</p>
                </div>
                <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center text-gray-400 hover:text-white text-lg">×</button>
              </div>
              <div className="p-6 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#0A0A0A] rounded-xl p-3 border border-white/[0.06]">
                    <div className="text-gray-600 text-xs mb-1">Budget</div>
                    <div className="text-lg font-semibold text-white">{(selected.budget || 0).toLocaleString('de-DE')} €</div>
                  </div>
                  <div className="bg-[#0A0A0A] rounded-xl p-3 border border-white/[0.06]">
                    <div className="text-gray-600 text-xs mb-1">Status</div>
                    <select value={selected.status} onChange={e => updateKampagne(selected.id, {status: e.target.value})} className="bg-transparent text-white text-sm font-semibold w-full focus:outline-none">
                      {['Aktiv','Geplant','Abgeschlossen'].map(s => <option key={s} className="bg-[#1a1a1a]">{s}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-gray-600 text-xs block mb-1">Name</label>
                  <input defaultValue={selected.name} onBlur={e => updateKampagne(selected.id, {name: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-600 text-xs block mb-1">Start</label>
                    <input defaultValue={selected.start_datum} onBlur={e => updateKampagne(selected.id, {start_datum: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-gray-600 text-xs block mb-1">Ende</label>
                    <input defaultValue={selected.end_datum} onBlur={e => updateKampagne(selected.id, {end_datum: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-gray-600 text-xs block mb-1">Budget €</label>
                  <input type="number" defaultValue={selected.budget} onBlur={e => updateKampagne(selected.id, {budget: Number(e.target.value)})} className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-gray-600 text-xs block mb-1">Beschreibung</label>
                  <textarea defaultValue={selected.beschreibung} onBlur={e => updateKampagne(selected.id, {beschreibung: e.target.value})} rows={2} className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:outline-none resize-none" />
                </div>
                <button onClick={() => deleteKampagne(selected.id)} className="w-full py-2.5 rounded-xl border border-red-900/50 text-red-500 hover:bg-red-950/50 transition-colors text-sm">Löschen</button>
              </div>
            </div>
          </div>
        )}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
            <div className="bg-[#141414] rounded-2xl w-full max-w-md border border-white/[0.08]" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
                <h2 className="text-white font-semibold">Neue Kampagne</h2>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center text-gray-400 hover:text-white text-lg">×</button>
              </div>
              <div className="p-6 flex flex-col gap-3">
                <div><label className="text-gray-500 text-xs mb-1.5 block">Name *</label><input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="SS25 Launch" className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-700 focus:outline-none" /></div>
                <div><label className="text-gray-500 text-xs mb-1.5 block">Status</label><select value={form.status} onChange={e => setForm(p => ({...p, status: e.target.value}))} className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none">{['Aktiv','Geplant','Abgeschlossen'].map(s => <option key={s}>{s}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-gray-500 text-xs mb-1.5 block">Start</label><input value={form.start_datum} onChange={e => setForm(p => ({...p, start_datum: e.target.value}))} placeholder="01.05.2026" className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-700 focus:outline-none" /></div>
                  <div><label className="text-gray-500 text-xs mb-1.5 block">Ende</label><input value={form.end_datum} onChange={e => setForm(p => ({...p, end_datum: e.target.value}))} placeholder="31.07.2026" className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-700 focus:outline-none" /></div>
                </div>
                <div><label className="text-gray-500 text-xs mb-1.5 block">Budget €</label><input type="number" value={form.budget} onChange={e => setForm(p => ({...p, budget: e.target.value}))} placeholder="25000" className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-700 focus:outline-none" /></div>
                <div><label className="text-gray-500 text-xs mb-1.5 block">Beschreibung</label><textarea value={form.beschreibung} onChange={e => setForm(p => ({...p, beschreibung: e.target.value}))} rows={2} className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-700 focus:outline-none resize-none" /></div>
                <button onClick={createKampagne} disabled={!form.name} className="w-full py-3 rounded-xl bg-[#7F77DD] text-white text-sm hover:bg-[#534AB7] transition-colors font-medium disabled:opacity-50 mt-1">Kampagne erstellen</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
