'use client'
import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { createBrowserClient } from '@supabase/ssr'

export default function Outreach() {
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const [creators, setCreators] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any | null>(null)
  const [search, setSearch] = useState('')
  const [nachrichten, setNachrichten] = useState<any[]>([])
  const [loadingChat, setLoadingChat] = useState(false)
  const [neueNachricht, setNeueNachricht] = useState('')
  const [chatRichtung, setChatRichtung] = useState<'raus'|'rein'>('rein')
  const [chatKanal, setChatKanal] = useState('Instagram')
  const [sendingChat, setSendingChat] = useState(false)
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
  }, [selected])
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
      if (res.ok) { setNachrichten(prev => [...prev, d]); setNeueNachricht('') }
    } finally { setSendingChat(false) }
  }

  useEffect(() => {
    let mounted = true
    sb.auth.getSession().then(async ({ data }) => {
      const userId = data.session?.user?.id
      if (!userId) { setLoading(false); return }
      const { data: rows } = await sb.from('creators').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      if (!mounted) return
      setCreators(rows || [])
      setLoading(false)
    })
    return () => { mounted = false }
  }, [])

  const initials = (name: string) => (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const filtered = creators.filter(c => {
    const s = search.toLowerCase()
    return !s || (c.name || '').toLowerCase().includes(s) || (c.ig || '').toLowerCase().includes(s)
  })

  return (
    <div className="h-screen bg-[#0A0A0A] text-white overflow-hidden">
      <Sidebar />
      <div className="md:ml-60 h-screen flex overflow-hidden">

        {/* LINKS: Chat-Liste */}
        <div className="w-80 flex-shrink-0 border-r border-white/[0.06] flex flex-col">
          <div className="p-4 border-b border-white/[0.06]">
            <h1 className="text-white font-semibold text-lg mb-3">Outreach</h1>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Suchen..."
              className="w-full bg-[#141414] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7F77DD]" />
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading && <div className="p-4 text-gray-600 text-sm">Lädt...</div>}
            {!loading && filtered.length === 0 && <div className="p-4 text-gray-600 text-sm">Keine Creator</div>}
            {filtered.map(c => (
              <button key={c.id} onClick={() => setSelected(c)}
                className={`w-full flex items-center gap-3 px-4 py-3 border-b border-white/[0.03] text-left hover:bg-white/[0.03] transition-colors ${selected?.id === c.id ? 'bg-white/[0.05]' : ''}`}>
                <div className="w-10 h-10 rounded-full bg-[#7F77DD] flex items-center justify-center text-white text-sm font-bold overflow-hidden flex-shrink-0">
                  {c.ig_image ? <img src={c.ig_image} alt="" className="w-full h-full object-cover" /> : initials(c.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-white text-sm font-medium truncate">{c.name || '—'}</div>
                  <div className="text-gray-600 text-xs truncate">{c.ig || ''}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* MITTE: Chatfeld */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
              Wähle einen Chat aus der Liste
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-white/[0.06] flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#7F77DD] flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                  {selected.ig_image ? <img src={selected.ig_image} alt="" className="w-full h-full object-cover" /> : initials(selected.name)}
                </div>
                <div>
                  <div className="text-white text-sm font-medium">{selected.name}</div>
                  <div className="text-gray-600 text-xs">{selected.ig || ''}</div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {loadingChat && <div className="text-center text-gray-600 text-xs">Lädt...</div>}
                {!loadingChat && nachrichten.length === 0 && <div className="text-center text-gray-700 text-xs mt-8">Noch keine Nachrichten. Kopiere unten den Verlauf rein.</div>}
                {nachrichten.map((m:any) => {
                  const raus = m.richtung === 'raus'
                  return (
                    <div key={m.id} className={`flex ${raus ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${raus ? 'bg-[#7F77DD] text-white' : 'bg-[#1a1a1a] text-gray-200 border border-white/[0.06]'}`}>
                        <div className="text-sm whitespace-pre-wrap break-words">{m.notiz}</div>
                        <div className={`text-[10px] mt-1 ${raus ? 'text-white/60' : 'text-gray-600'}`}>{m.kanal} · {m.datum || ''}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="p-3 border-t border-white/[0.06]">
                <div className="flex items-center gap-2 mb-2">
                  <button onClick={() => setChatRichtung('rein')} className={`text-xs px-3 py-1 rounded-lg ${chatRichtung==='rein' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}>Von Creator</button>
                  <button onClick={() => setChatRichtung('raus')} className={`text-xs px-3 py-1 rounded-lg ${chatRichtung==='raus' ? 'bg-[#7F77DD]/20 text-[#7F77DD]' : 'text-gray-500 hover:text-gray-300'}`}>Von mir</button>
                  <select value={chatKanal} onChange={e => setChatKanal(e.target.value)} className="bg-[#141414] border border-white/[0.08] rounded-lg px-2 py-1 text-xs text-gray-300 focus:outline-none ml-auto">
                    <option>Instagram</option><option>Mail</option><option>Telefon</option><option>Sonstiges</option>
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <textarea value={neueNachricht} onChange={e => setNeueNachricht(e.target.value)} rows={2} placeholder="Nachricht reinkopieren oder tippen..."
                    className="flex-1 bg-[#141414] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7F77DD] resize-none" />
                  <button onClick={sendeNachricht} disabled={sendingChat || !neueNachricht.trim()}
                    className={`px-4 py-2 rounded-xl text-sm text-white ${sendingChat||!neueNachricht.trim() ? 'bg-[#7F77DD]/40' : 'bg-[#7F77DD] hover:bg-[#534AB7]'}`}>
                    {sendingChat ? '...' : 'Hinzufügen'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* RECHTS: Info-Sidebar */}
        {selected && (
          <div className="w-72 flex-shrink-0 border-l border-white/[0.06] p-4">
            <div className="text-white font-medium text-sm mb-3">Collab-Infos</div>
            <div className="text-gray-700 text-xs">Felder folgen (Etappe 3)</div>
          </div>
        )}

      </div>
    </div>
  )
}
