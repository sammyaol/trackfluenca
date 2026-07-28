'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Sidebar from '../components/Sidebar'

export default function Bestellungen() {
  const [bestellungen, setBestellungen] = useState<any[]>([])
  const [creators, setCreators] = useState<any[]>([])
  const [kampagnen, setKampagnen] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ creator_id: '', produkt: '', tracking_nummer: '', versandt_am: '', angekommen_am: '', notizen: '', status: 'Nicht versendet' })
  const [filter, setFilter] = useState('Alle')
  const [tracking, setTracking] = useState<Record<string, any>>({})
  const [trackingLoading, setTrackingLoading] = useState<string|null>(null)
  
  async function trackShipment(b: any) {
    if (!b.tracking_nummer) return
    setTrackingLoading(b.id)
    try {
      const res = await fetch('/api/tracking?number=' + encodeURIComponent(b.tracking_nummer))
      const data = await res.json()
      setTracking(prev => ({ ...prev, [b.id]: data }))
      // Status automatisch aktualisieren wenn API zugestellt sagt
      if (data.status && data.status !== b.status && !data.error) {
        await updateStatus(b.id, data.status)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setTrackingLoading(null)
    }
  }
  
  async function trackAll() {
    for (const b of bestellungen) {
      if (b.tracking_nummer && b.status !== 'Angekommen') {
        await trackShipment(b)
      }
    }
  }
  
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const getToken = async () => (await sb.auth.getSession()).data.session?.access_token

  useEffect(() => { load() }, [])
  
  async function load() {
    setLoading(true)
    const token = await getToken()
    if (!token) return
    const [b, c, k] = await Promise.all([
      fetch('/api/bestellungen', { headers: { authorization: 'Bearer ' + token } }).then(r => r.json()),
      fetch('/api/creators', { headers: { authorization: 'Bearer ' + token } }).then(r => r.json()),
      fetch('/api/kampagnen', { headers: { authorization: 'Bearer ' + token } }).then(r => r.json())
    ])
    setKampagnen(Array.isArray(k) ? k : [])
    const bestellungenArr = Array.isArray(b) ? b : []
    const creatorsArr = Array.isArray(c) ? c : []
    setCreators(creatorsArr)
    // Für jeden Creator ohne Bestellung: Platzhalter mit Status aus Creator (oder Nicht versendet)
    const merged = creatorsArr.map((cr:any) => {
      const existing = bestellungenArr.find((b:any) => b.creator_id === cr.id)
      if (existing) return existing
      return {
        id: 'virtual-' + cr.id,
        creator_id: cr.id,
        produkt: '',
        tracking_nummer: '',
        versandt_am: null,
        angekommen_am: null,
        status: cr.versand || 'Nicht versendet',
        virtual: true
      }
    })
    // + echte Bestellungen die zu gelöschten Creatorn gehören
    const orphans = bestellungenArr.filter((b:any) => !creatorsArr.find((c:any) => c.id === b.creator_id))
    setBestellungen([...merged, ...orphans])
    setLoading(false)
  }
  
  async function ensureBestellung(virtualId: string, creatorId: string) {
    // Erstelle echte Bestellung aus virtuellem Eintrag
    const token = await getToken()
    const res = await fetch('/api/bestellungen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token },
      body: JSON.stringify({ creator_id: creatorId, status: 'Nicht versendet' })
    })
    const newB = await res.json()
    setBestellungen(prev => prev.map(b => b.id === virtualId ? newB : b))
    return newB
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
    const b = bestellungen.find(b => b.id === id)
    if (!b) return
    const extra: any = { status }
    if (status === 'Versendet' && !b.versandt_am) extra.versandt_am = new Date().toISOString().split('T')[0]
    if (status === 'Angekommen' && !b.angekommen_am) extra.angekommen_am = new Date().toISOString().split('T')[0]
    if (b.virtual) {
      const newB = await ensureBestellung(id, b.creator_id)
      await fetch('/api/bestellungen/' + newB.id, { method: 'PATCH', headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token }, body: JSON.stringify(extra) })
      setBestellungen(prev => prev.map(x => x.id === newB.id ? {...x, ...extra} : x))
    } else {
      await fetch('/api/bestellungen/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token }, body: JSON.stringify(extra) })
      setBestellungen(prev => prev.map(x => x.id === id ? {...x, ...extra} : x))
    }
  }
  
  async function updateField(id: string, field: string, value: string) {
    const b = bestellungen.find(b => b.id === id)
    if (!b) return
    const token = await getToken()
    if (b.virtual) {
      const newB = await ensureBestellung(id, b.creator_id)
      await fetch('/api/bestellungen/' + newB.id, { method: 'PATCH', headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token }, body: JSON.stringify({ [field]: value }) })
      setBestellungen(prev => prev.map(x => x.id === newB.id ? {...x, [field]: value} : x))
    } else {
      await fetch('/api/bestellungen/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token }, body: JSON.stringify({ [field]: value }) })
      setBestellungen(prev => prev.map(x => x.id === id ? {...x, [field]: value} : x))
    }
  }

  async function deleteB(id: string) {
    const token = await getToken()
    await fetch('/api/bestellungen/' + id, { method: 'DELETE', headers: { authorization: 'Bearer ' + token } })
    setBestellungen(prev => prev.filter(b => b.id !== id))
  }

  const filtered = filter === 'Alle' ? bestellungen : bestellungen.filter(b => b.status === filter)
  const stats = {
    total: bestellungen.length,
    nichtVersendet: bestellungen.filter(b => (b.status || 'Nicht versendet') === 'Nicht versendet').length,
    versendet: bestellungen.filter(b => b.status === 'Versendet').length,
    angekommen: bestellungen.filter(b => b.status === 'Angekommen').length,
  }

  const kampagneVon = (b: any) => {
    const c = creators.find(c => c.id === b.creator_id)
    const k = (c?.kampagne || '').trim()
    return k || 'Nicht zugeordnet'
  }
  const gruppen: { name: string; items: any[] }[] = (() => {
    const map: Record<string, any[]> = {}
    for (const b of filtered) {
      const k = kampagneVon(b)
      if (!map[k]) map[k] = []
      map[k].push(b)
    }
    const namen = Object.keys(map).sort((a, b) => {
      if (a === 'Nicht zugeordnet') return 1
      if (b === 'Nicht zugeordnet') return -1
      return a.localeCompare(b)
    })
    return namen.map(name => ({ name, items: map[name] }))
  })()

  const farben = ['from-violet-600 to-purple-800','from-blue-600 to-cyan-800','from-amber-600 to-orange-800','from-emerald-600 to-teal-800','from-rose-600 to-pink-800']
  const farbeVon = (name: string) => {
    const idx = kampagnen.findIndex((k: any) => (k.name || '').trim() === name.trim())
    return idx >= 0 ? farben[idx % farben.length] : 'from-gray-600 to-gray-800'
  }

  return (
    <div className="flex min-h-screen bg-surface-0">
      <Sidebar />
      <main className="flex-1 md:ml-60 p-6 pb-20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-ink-1">Bestellungen</h1>
            <p className="text-ink-3 text-sm mt-1">{stats.total} Creator · {stats.nichtVersendet} offen · {stats.versendet} unterwegs · {stats.angekommen} zugestellt</p>
          </div>
          <div className="flex gap-2">
            <button onClick={trackAll} className="px-3 py-1.5 rounded-apple-sm border border-hairline text-ink-1 text-xs hover:bg-white/[0.04] transition-colors font-medium flex items-center gap-2">
              <span>↻</span> Tracking aktualisieren
            </button>
            <button onClick={() => setShowAdd(true)} className="px-3 py-1.5 rounded-apple-sm bg-accent text-ink-1 text-xs hover:bg-accent-hover transition-colors font-medium">+ Neue Bestellung</button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {([['Alle', stats.total, 'text-ink-1'], ['Nicht versendet', stats.nichtVersendet, 'text-ink-2'], ['Versendet', stats.versendet, 'text-amber-400'], ['Angekommen', stats.angekommen, 'text-emerald-400']] as [string,number,string][]).map(([label, n, color]) => (
            <button key={label} onClick={() => setFilter(label)} className={`bg-surface-0 rounded-apple-sm border p-4 text-left transition-colors ${filter === label ? 'border-accent' : 'border-hairline-soft hover:border-white/[0.12]'}`}>
              <div className="text-ink-3 text-xs mb-1">{label}</div>
              <div className={`text-2xl font-bold ${color}`}>{n}</div>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-surface-0 rounded-apple-lg border border-hairline-soft flex items-center justify-center py-20 gap-3"><span className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"/><span className="text-ink-3 text-sm">Lädt...</span></div>
        ) : gruppen.length === 0 ? (
          <div className="bg-surface-0 rounded-apple-lg border border-hairline-soft text-center py-20 text-ink-4 text-sm">Keine Bestellungen</div>
        ) : (
          <div className="space-y-6">
            {gruppen.map(gruppe => {
              const versendetN = gruppe.items.filter(b => b.status === 'Versendet' || b.status === 'Angekommen').length
              const gesamtN = gruppe.items.length
              const alleRaus = versendetN === gesamtN && gesamtN > 0
              return (
                <div key={gruppe.name} className="bg-surface-0 rounded-apple-lg border border-hairline-soft overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-hairline-soft bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${gruppe.name === 'Nicht zugeordnet' ? 'text-ink-3' : 'text-ink-1'}`}>{gruppe.name}</span>
                      <span className="text-ink-4 text-xs">· {gesamtN} Creator</span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${alleRaus ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                      {versendetN} / {gesamtN} versendet
                    </span>
                  </div>
                  <table className="w-full table-fixed">
                    <colgroup>
                      <col className="w-[22%]" /><col className="w-[14%]" /><col className="w-[18%]" /><col className="w-[12%]" /><col className="w-[12%]" /><col className="w-[14%]" /><col className="w-[8%]" />
                    </colgroup>
                    <thead><tr className="text-left text-ink-3 text-xs border-b border-hairline-soft">
                      <th className="px-5 py-2.5 font-medium">Creator</th>
                      <th className="px-5 py-2.5 font-medium">Produkt</th>
                      <th className="px-5 py-2.5 font-medium">Tracking</th>
                      <th className="px-5 py-2.5 font-medium">Versandt</th>
                      <th className="px-5 py-2.5 font-medium">Angekommen</th>
                      <th className="px-5 py-2.5 font-medium">Status</th>
                      <th className="px-5 py-2.5 font-medium">Aktion</th>
                    </tr></thead>
                    <tbody>
                      {gruppe.items.map(b => {
                  const creator = creators.find(c => c.id === b.creator_id)
                  return (
                    <tr key={b.id} className="border-b border-hairline-soft hover:bg-white/[0.02]">
                      <td className="px-5 py-3">
                        <div className="text-ink-1 text-sm font-medium">{creator?.name || '—'}</div>
                        <div className="text-ink-4 text-xs">{creator?.ig || ''}</div>
                      </td>
                      <td className="px-5 py-3">
                        <input defaultValue={b.produkt || ''} placeholder="—" onBlur={e => e.target.value !== (b.produkt||'') && updateField(b.id, 'produkt', e.target.value)} className="bg-transparent text-ink-1 text-sm w-full focus:outline-none focus:bg-white/[0.04] rounded px-1"/>
                      </td>
                      <td className="px-5 py-3">
                        <input defaultValue={b.tracking_nummer || ''} placeholder="—" onBlur={e => e.target.value !== (b.tracking_nummer||'') && updateField(b.id, 'tracking_nummer', e.target.value)} className="bg-transparent text-ink-2 text-xs font-mono w-full focus:outline-none focus:bg-white/[0.04] rounded px-1"/>
                      </td>
                      <td className="px-5 py-3 text-ink-3 text-xs">{b.versandt_am || '—'}</td>
                      <td className="px-5 py-3 text-ink-3 text-xs">{b.angekommen_am || '—'}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <select value={b.status} onChange={e => updateStatus(b.id, e.target.value)}
                            className={`text-xs px-2 py-1 rounded-full border cursor-pointer focus:outline-none ${b.status === 'Angekommen' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : b.status === 'Versendet' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-ink-3/15 text-ink-2 border-hairline/30'}`}>
                            <option value="Nicht versendet">Nicht versendet</option>
                            <option value="Versendet">Versendet</option>
                            <option value="Angekommen">Angekommen</option>
                          </select>
                          {b.tracking_nummer && (
                            <button onClick={() => trackShipment(b)} disabled={trackingLoading === b.id} className="text-ink-3 hover:text-ink-1 text-xs transition-colors" title="DHL-Status abrufen">
                              {trackingLoading === b.id ? <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin inline-block"/> : '↻'}
                            </button>
                          )}
                        </div>
                        {tracking[b.id] && !tracking[b.id].error && (
                          <div className="text-[10px] text-ink-3 mt-1">{tracking[b.id].description}</div>
                        )}
                        {tracking[b.id]?.error && (
                          <div className="text-[10px] text-red-400/70 mt-1">DHL: {tracking[b.id].error}</div>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {!b.virtual && <button onClick={() => deleteB(b.id)} className="text-red-500/50 hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-red-950/30 transition-colors">Löschen</button>}
                      </td>
                    </tr>
                  )
                      })}
                    </tbody>
                  </table>
                </div>
              )
            })}
          </div>
        )}

        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
            <div onClick={e => e.stopPropagation()} className="bg-surface-0 border border-hairline rounded-apple-lg p-6 w-full max-w-md space-y-3">
              <h2 className="text-ink-1 font-semibold">Neue Bestellung</h2>
              <div>
                <label className="text-ink-4 text-xs block mb-1">Creator</label>
                <select value={form.creator_id} onChange={e => setForm({...form, creator_id: e.target.value})} className="w-full bg-surface-0 border border-hairline rounded-apple-sm px-2 py-2 text-ink-1 text-sm">
                  <option value="">— wählen —</option>
                  {creators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-ink-4 text-xs block mb-1">Produkt</label>
                <input value={form.produkt} onChange={e => setForm({...form, produkt: e.target.value})} className="w-full bg-surface-0 border border-hairline rounded-apple-sm px-2 py-2 text-ink-1 text-sm" placeholder="z.B. Halskette Gold"/>
              </div>
              <div>
                <label className="text-ink-4 text-xs block mb-1">Tracking-Nummer</label>
                <input value={form.tracking_nummer} onChange={e => setForm({...form, tracking_nummer: e.target.value})} className="w-full bg-surface-0 border border-hairline rounded-apple-sm px-2 py-2 text-ink-1 text-sm font-mono"/>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-ink-4 text-xs block mb-1">Versandt am</label>
                  <input type="date" value={form.versandt_am} onChange={e => setForm({...form, versandt_am: e.target.value})} className="w-full bg-surface-0 border border-hairline rounded-apple-sm px-2 py-2 text-ink-1 text-sm"/>
                </div>
                <div>
                  <label className="text-ink-4 text-xs block mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-surface-0 border border-hairline rounded-apple-sm px-2 py-2 text-ink-1 text-sm">
                    <option>Nicht versendet</option>
                    <option>Versendet</option>
                    <option>Angekommen</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-ink-4 text-xs block mb-1">Notizen</label>
                <textarea value={form.notizen} onChange={e => setForm({...form, notizen: e.target.value})} rows={2} className="w-full bg-surface-0 border border-hairline rounded-apple-sm px-2 py-2 text-ink-1 text-sm resize-none"/>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={save} disabled={!form.creator_id || saving} className={`flex-1 py-2.5 rounded-apple-sm text-sm font-medium flex items-center justify-center gap-2 ${form.creator_id && !saving ? 'bg-accent text-ink-1 hover:bg-accent-hover' : 'bg-white/[0.05] text-ink-4 cursor-not-allowed'}`}>
                  {saving && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
                  {saving ? 'Speichert...' : 'Speichern'}
                </button>
                <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 rounded-apple-sm border border-hairline text-ink-2 text-sm">Abbrechen</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
