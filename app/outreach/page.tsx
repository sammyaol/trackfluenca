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
              <div className="flex-1 flex items-center justify-center text-gray-700 text-xs">
                Chat-Verlauf folgt (Etappe 2)
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
