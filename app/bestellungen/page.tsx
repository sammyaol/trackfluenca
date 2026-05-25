'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Sidebar from '../components/Sidebar'

export default function Bestellungen() {
  const [bestellungen, setBestellungen] = useState<any[]>([])
  const [creators, setCreators] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ creator_id: '', produkt: '', tracking_nummer: '', versandt_am: '', angekommen_am: '', notizen: '', status: 'Nicht versendet' })
  const [filter, setFilter] = useState('Alle')
  
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const getToken = async () => (await sb.auth.getSession()).data.session?.access_token

  useEffect(() => { load() }, [])
  
  async function load() {
    setLoading(true)
    const token = await getToken()
    if (!token) return
    const [b, c] = await Promise.all([
      fetch('/api/bestellungen', { headers: { authorization: 'Bearer ' + token } }).then(r => r.json()),
      fetch('/api/creators', { headers: { authorization: 'Bearer ' + token } }).then(r => r.json())
    ])
    setBestellungen(Array.isArray(b) ? b : [])
    setCreators(Array.isArray(c) ? c : [])
    setLoading(false)
  }

  async function save() {
    if (saving) return
    setSaving(true)
    const token = await getToken()
    await fetch('/api/bestellungen', { method: 'POST', headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token }, body: JSON.stringify(form) })
    setShowAdd(false)
    setForm({ creator_id: '', produkt: '', tracking_nummer: '', versandt_am: '', angekommen_am: '', notizen: '', status: 'Nicht versendet' })
    setSaving(false)
    load()
  }

  async function updateStatus(id: string, status: string) {
    const token = await getToken()
    const extra: any = { status }
    if (status === 'Versendet' && !bestellungen.find(b => b.id === id)?.versandt_am) extra.versandt_am = new Date().toISOString().split('T')[0]
    if (status === 'Angekommen' && !bestellungen.find(b => b.id === id)?.angekommen_am) extra.angekommen_am = new Date().toISOString().split('T')[0]
    await fetch('/api/bestellungen/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token }, body: JSON.stringify(extra) })
    setBestellungen(prev => prev.map(b => b.id === id ? {...b, ...extra} : b))
  }

  async function deleteB(id: string) {
    const token = await getToken()
    await fetch('/api/bestellungen/' + id, { method: 'DELETE', headers: { authorization: 'Bearer ' + token } })
    setBestellungen(prev => prev.filter(b => b.id !== id))
  }

  const filtered = filter === 'Alle' ? bestellungen : bestellungen.filter(b => b.status === filter)
  const stats = {
    total: bestellungen.length,
    nichtVersendet: bestellungen.filter(b => b.status === 'Nicht versendet').length,
    versendet: bestellungen.filter(b => b.status === 'Versendet').length,
    angekommen: bestellungen.filter(b => b.status === 'Angekommen').length,
  }

  return (
    <div className="flex min-h-screen bg-[#0A0A0A]">
      <Sidebar />
      <main className="flex-1 md:ml-60 p-6 pb-20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Bestellungen</h1>
            <p className="text-gray-500 text-sm mt-1">{stats.total} Bestellungen · {stats.nichtVersendet} offen · {stats.versendet} unterwegs · {stats.angekommen} zugestellt</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="px-3 py-1.5 rounded-lg bg-[#7F77DD] text-white text-xs hover:bg-[#534AB7] transition-colors font-medium">+ Neue Bestellung</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {([['Alle', stats.total, 'text-white'], ['Nicht versendet', stats.nichtVersendet, 'text-gray-400'], ['Versendet', stats.versendet, 'text-amber-400'], ['Angekommen', stats.angekommen, 'text-emerald-400']] as [string,number,string][]).map(([label, n, color]) => (
            <button key={label} onClick={() => setFilter(label)} className={`bg-[#111] rounded-xl border p-4 text-left transition-colors ${filter === label ? 'border-[#7F77DD]' : 'border-white/[0.06] hover:border-white/[0.12]'}`}>
              <div className="text-gray-500 text-xs mb-1">{label}</div>
              <div className={`text-2xl font-bold ${color}`}>{n}</div>
            </button>
          ))}
        </div>

        <div className="bg-[#111] rounded-2xl border border-white/[0.06] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3"><span className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"/><span className="text-gray-500 text-sm">Lädt...</span></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-600 text-sm">Keine Bestellungen</div>
          ) : (
            <table className="w-full">
              <thead><tr className="text-left text-gray-500 text-xs border-b border-white/[0.04]">
                <th className="px-5 py-3 font-medium">Creator</th>
                <th className="px-5 py-3 font-medium">Produkt</th>
                <th className="px-5 py-3 font-medium">Tracking</th>
                <th className="px-5 py-3 font-medium">Versandt</th>
                <th className="px-5 py-3 font-medium">Angekommen</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Aktion</th>
              </tr></thead>
              <tbody>
                {filtered.map(b => {
                  const creator = creators.find(c => c.id === b.creator_id)
                  return (
                    <tr key={b.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="px-5 py-3">
                        <div className="text-white text-sm font-medium">{creator?.name || '—'}</div>
                        <div className="text-gray-600 text-xs">{creator?.ig || ''}</div>
                      </td>
                      <td className="px-5 py-3 text-white text-sm">{b.produkt || '—'}</td>
                      <td className="px-5 py-3 text-gray-400 text-xs font-mono">{b.tracking_nummer || '—'}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{b.versandt_am || '—'}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{b.angekommen_am || '—'}</td>
                      <td className="px-5 py-3">
                        <select value={b.status} onChange={e => updateStatus(b.id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-full border cursor-pointer focus:outline-none ${b.status === 'Angekommen' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : b.status === 'Versendet' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-gray-500/15 text-gray-400 border-gray-500/30'}`}>
                          <option value="Nicht versendet">Nicht versendet</option>
                          <option value="Versendet">Versendet</option>
                          <option value="Angekommen">Angekommen</option>
                        </select>
                      </td>
                      <td className="px-5 py-3">
                        <button onClick={() => deleteB(b.id)} className="text-red-500/50 hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-red-950/30 transition-colors">Löschen</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
            <div onClick={e => e.stopPropagation()} className="bg-[#111] border border-white/[0.08] rounded-2xl p-6 w-full max-w-md space-y-3">
              <h2 className="text-white font-semibold">Neue Bestellung</h2>
              <div>
                <label className="text-gray-600 text-xs block mb-1">Creator</label>
                <select value={form.creator_id} onChange={e => setForm({...form, creator_id: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-lg px-2 py-2 text-white text-sm">
                  <option value="">— wählen —</option>
                  {creators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-600 text-xs block mb-1">Produkt</label>
                <input value={form.produkt} onChange={e => setForm({...form, produkt: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-lg px-2 py-2 text-white text-sm" placeholder="z.B. Halskette Gold"/>
              </div>
              <div>
                <label className="text-gray-600 text-xs block mb-1">Tracking-Nummer</label>
                <input value={form.tracking_nummer} onChange={e => setForm({...form, tracking_nummer: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-lg px-2 py-2 text-white text-sm font-mono"/>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-600 text-xs block mb-1">Versandt am</label>
                  <input type="date" value={form.versandt_am} onChange={e => setForm({...form, versandt_am: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-lg px-2 py-2 text-white text-sm"/>
                </div>
                <div>
                  <label className="text-gray-600 text-xs block mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-lg px-2 py-2 text-white text-sm">
                    <option>Nicht versendet</option>
                    <option>Versendet</option>
                    <option>Angekommen</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-gray-600 text-xs block mb-1">Notizen</label>
                <textarea value={form.notizen} onChange={e => setForm({...form, notizen: e.target.value})} rows={2} className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-lg px-2 py-2 text-white text-sm resize-none"/>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={save} disabled={!form.creator_id || saving} className={`flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${form.creator_id && !saving ? 'bg-[#7F77DD] text-white hover:bg-[#534AB7]' : 'bg-white/[0.05] text-gray-600 cursor-not-allowed'}`}>
                  {saving && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
                  {saving ? 'Speichert...' : 'Speichern'}
                </button>
                <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 rounded-lg border border-white/[0.08] text-gray-400 text-sm">Abbrechen</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
