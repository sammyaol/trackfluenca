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
      if (res.ok) { setNachrichten(prev => [...prev, d]); setNeueNachricht(''); setMsgSet(prev => new Set(prev).add(selected.id)) }
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
  const [kampagnenList, setKampagnenList] = useState<string[]>([])
  useEffect(() => {
    sb.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token || ''
      const res = await fetch('/api/kampagnen', { headers: { authorization: 'Bearer ' + token } })
      const d = await res.json()
      if (Array.isArray(d)) setKampagnenList(d.map((k: any) => k.name))
    })
  }, [])
  const [bestellungen, setBestellungen] = useState<any[]>([])
  useEffect(() => {
    if (!selected?.id) { setBestellungen([]); return }
    sb.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token || ''
      const res = await fetch('/api/bestellungen', { headers: { authorization: 'Bearer ' + token } })
      const d = await res.json()
      const arr = Array.isArray(d) ? d.filter((b:any) => b.creator_id === selected.id) : []
      setBestellungen(arr)
    })
  }, [selected])
  const updateCollab = async (field: string, value: any) => {
    if (!selected?.id) return
    setSelected((p: any) => ({ ...p, [field]: value }))
    setCreators(prev => prev.map(c => c.id === selected.id ? { ...c, [field]: value } : c))
    const { data } = await sb.auth.getSession()
    const token = data.session?.access_token || ''
    await fetch('/api/creators/' + selected.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token },
      body: JSON.stringify({ [field]: value })
    })
  }
  const [arrivedSet, setArrivedSet] = useState<Set<string>>(new Set())
  const [msgSet, setMsgSet] = useState<Set<string>>(new Set())
  useEffect(() => {
    sb.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token || ''
      const res = await fetch('/api/bestellungen', { headers: { authorization: 'Bearer ' + token } })
      const best = await res.json()
      const ang = new Set<string>()
      if (Array.isArray(best)) best.forEach((b:any) => { if (b.status === 'Angekommen' && b.creator_id) ang.add(b.creator_id) })
      setArrivedSet(ang)
      const { data: akt } = await sb.from('aktivitaeten').select('creator_id')
      const ms = new Set<string>()
      if (Array.isArray(akt)) akt.forEach((a:any) => { if (a.creator_id) ms.add(a.creator_id) })
      setMsgSet(ms)
    })
  }, [])
  const prio = (c:any) => {
    if (arrivedSet.has(c.id)) return 0
    if (!msgSet.has(c.id)) return 1
    return 2
  }
  const filtered = creators.filter(c => {
    const s = search.toLowerCase()
    return !s || (c.name || '').toLowerCase().includes(s) || (c.ig || '').toLowerCase().includes(s)
  }).slice().sort((a:any,b:any) => prio(a) - prio(b))

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
                  {arrivedSet.has(c.id) ? (
                    <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 rounded-full px-2 py-0.5">&#128230; Anweisungen schicken</div>
                  ) : (!msgSet.has(c.id) ? (
                    <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-rose-400 bg-rose-500/10 rounded-full px-2 py-0.5">&#9999;&#65039; Bitte anschreiben</div>
                  ) : null)}
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
          <div className="flex-shrink-0 border-l border-white/[0.06] p-4 overflow-hidden flex flex-col" style={{width:"288px",minWidth:"288px",maxWidth:"288px"}}>
            <div className="text-white font-medium text-sm mb-4 flex-shrink-0">Collab-Infos</div>
            <div className="space-y-3 overflow-y-auto flex-1 min-h-0 pr-1">
              <div className="bg-[#141414] rounded-xl p-3 space-y-2">
                <div className="text-gray-500 text-[10px] uppercase tracking-wider">Kontakt &amp; Links</div>
                <div className="flex gap-1.5">
                  {selected.ig ? (
                    <a href={"https://instagram.com/" + (selected.ig||'').replace('@','')} target="_blank" rel="noopener noreferrer"
                      className="flex-1 text-center text-[11px] bg-[#1a1a1a] hover:bg-[#222] border border-white/[0.08] rounded-lg px-2 py-1.5 text-gray-300">Instagram &#8599;</a>
                  ) : null}
                  {selected.tt ? (
                    <a href={"https://tiktok.com/@" + (selected.tt||'').replace('@','')} target="_blank" rel="noopener noreferrer"
                      className="flex-1 text-center text-[11px] bg-[#1a1a1a] hover:bg-[#222] border border-white/[0.08] rounded-lg px-2 py-1.5 text-gray-300">TikTok &#8599;</a>
                  ) : null}
                </div>
                <div>
                  <label className="text-gray-600 text-[10px] block mb-1">Adresse</label>
                  <textarea defaultValue={selected.adresse||''} onBlur={e => updateCollab('adresse', e.target.value)} rows={2}
                    className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none resize-none" />
                </div>
                <div>
                  <label className="text-gray-600 text-[10px] block mb-1">Telefon</label>
                  <input type="text" defaultValue={selected.telefon||''} onBlur={e => updateCollab('telefon', e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="text-gray-600 text-[10px] block mb-1">E-Mail</label>
                  <input type="text" defaultValue={selected.email||''} onBlur={e => updateCollab('email', e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none" />
                </div>
              </div>
              <div className="bg-[#141414] rounded-xl p-3 space-y-2">
                <div className="text-gray-500 text-[10px] uppercase tracking-wider">Bestellung</div>
                {bestellungen.length === 0 && <div className="text-gray-600 text-xs">Keine Bestellung</div>}
                {bestellungen.map((b:any) => {
                  const st = b.status || 'Nicht versendet'
                  const farbe = st === 'Angekommen' ? 'bg-emerald-500/15 text-emerald-400' : (st === 'Nicht versendet' ? 'bg-gray-700/40 text-gray-400' : 'bg-blue-500/15 text-blue-400')
                  return (
                    <div key={b.id} className="space-y-1">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-gray-300 text-xs truncate">{b.produkt || 'Produkt'}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${farbe}`}>{st}</span>
                      </div>
                      {b.tracking_nummer && <div className="text-gray-600 text-[10px] font-mono truncate">{b.tracking_nummer}</div>}
                    </div>
                  )
                })}
                <div className="text-gray-700 text-[10px] pt-1">&rarr; im Bestellbereich bearbeiten</div>
              </div>
              <div className="bg-[#141414] rounded-xl p-3 space-y-1.5">
                <div className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Reichweite</div>
                <div className="flex justify-between text-xs"><span className="text-gray-600">IG Follower</span><span className="text-gray-300">{(selected.ig_follower||0).toLocaleString('de-DE')}</span></div>
                <div className="flex justify-between text-xs"><span className="text-gray-600">TT Follower</span><span className="text-gray-300">{(selected.tt_follower||0).toLocaleString('de-DE')}</span></div>
                <div className="flex justify-between text-xs"><span className="text-gray-600">Tier</span><span className="text-gray-300">{selected.overall_tier||'—'}</span></div>
              </div>
              {(selected.ig_gender_female || selected.ig_gender_male || selected.ig_top_age || (selected.ig_top_countries?.length)) ? (
                <div className="bg-[#141414] rounded-xl p-3 space-y-1.5">
                  <div className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Audience</div>
                  {(selected.ig_gender_female || selected.ig_gender_male) ? (
                    <div className="flex justify-between text-xs"><span className="text-gray-600">Geschlecht</span><span className="text-gray-300">&#9792; {selected.ig_gender_female||0}% &middot; &#9794; {selected.ig_gender_male||0}%</span></div>
                  ) : null}
                  {selected.ig_top_age ? <div className="flex justify-between text-xs"><span className="text-gray-600">Top-Alter</span><span className="text-gray-300">{String(selected.ig_top_age).replace('_','-')}</span></div> : null}
                  {(selected.ig_top_countries?.length) ? (
                    <div className="flex justify-between text-xs"><span className="text-gray-600">Top-Land</span><span className="text-gray-300">{selected.ig_top_countries[0]?.name} {selected.ig_top_countries[0]?.pct}%</span></div>
                  ) : null}
                  {selected.ig_real_followers ? <div className="flex justify-between text-xs"><span className="text-gray-600">Echte Follower</span><span className="text-gray-300">{selected.ig_real_followers}%</span></div> : null}
                </div>
              ) : null}
              {(selected.ig_er || selected.tt_er || selected.ig_avg_reel_views || selected.story_views) ? (
                <div className="bg-[#141414] rounded-xl p-3 space-y-1.5">
                  <div className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Engagement</div>
                  {selected.ig_er ? <div className="flex justify-between text-xs"><span className="text-gray-600">IG ER</span><span className="text-gray-300">{selected.ig_er}%</span></div> : null}
                  {selected.tt_er ? <div className="flex justify-between text-xs"><span className="text-gray-600">TT ER</span><span className="text-gray-300">{selected.tt_er}%</span></div> : null}
                  {selected.ig_avg_reel_views ? <div className="flex justify-between text-xs"><span className="text-gray-600">&Oslash; Reel Views</span><span className="text-gray-300">{(selected.ig_avg_reel_views||0).toLocaleString('de-DE')}</span></div> : null}
                  {selected.ig_avg_likes ? <div className="flex justify-between text-xs"><span className="text-gray-600">&Oslash; Likes</span><span className="text-gray-300">{(selected.ig_avg_likes||0).toLocaleString('de-DE')}</span></div> : null}
                  {selected.story_views ? <div className="flex justify-between text-xs"><span className="text-gray-600">Story Views</span><span className="text-gray-300">{(selected.story_views||0).toLocaleString('de-DE')}</span></div> : null}
                </div>
              ) : null}
              {(selected.tkp_reel || selected.tkp_story || selected.tkp_tt || selected.reel_wert || selected.story_wert || selected.tt_wert) ? (
                <div className="bg-[#141414] rounded-xl p-3 space-y-1.5">
                  <div className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">TKP &amp; Werte</div>
                  {selected.tkp_reel ? <div className="flex justify-between text-xs"><span className="text-gray-600">TKP Reel</span><span className="text-gray-300">{selected.tkp_reel} &euro;</span></div> : null}
                  {selected.tkp_story ? <div className="flex justify-between text-xs"><span className="text-gray-600">TKP Story</span><span className="text-gray-300">{selected.tkp_story} &euro;</span></div> : null}
                  {selected.tkp_tt ? <div className="flex justify-between text-xs"><span className="text-gray-600">TKP TikTok</span><span className="text-gray-300">{selected.tkp_tt} &euro;</span></div> : null}
                  {selected.reel_wert ? <div className="flex justify-between text-xs"><span className="text-gray-600">Reel-Wert</span><span className="text-gray-300">{(selected.reel_wert||0).toLocaleString('de-DE')} &euro;</span></div> : null}
                  {selected.story_wert ? <div className="flex justify-between text-xs"><span className="text-gray-600">Story-Wert</span><span className="text-gray-300">{(selected.story_wert||0).toLocaleString('de-DE')} &euro;</span></div> : null}
                  {selected.tt_wert ? <div className="flex justify-between text-xs"><span className="text-gray-600">TikTok-Wert</span><span className="text-gray-300">{(selected.tt_wert||0).toLocaleString('de-DE')} &euro;</span></div> : null}
                </div>
              ) : null}
              <div>
                <label className="text-gray-600 text-xs block mb-2">Leistungen</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Reel','Story','Post','Carousel','Video','TikTok'].map(l => {
                    const aktiv = (selected.leistungen||'').split(',').filter(Boolean).includes(l)
                    return (
                      <button key={l} onClick={() => {
                        const arr = (selected.leistungen||'').split(',').filter(Boolean)
                        const next = aktiv ? arr.filter((x:string) => x !== l) : [...arr, l]
                        updateCollab('leistungen', next.join(','))
                      }} className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${aktiv ? 'bg-[#7F77DD] border-[#7F77DD] text-white' : 'border-white/[0.1] text-gray-500 hover:text-gray-300'}`}>
                        {l}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="text-gray-600 text-xs block mb-1">Status</label>
                <select value={selected.status||'Offen'} onChange={e => updateCollab('status', e.target.value)}
                  className="w-full bg-[#141414] border border-white/[0.08] rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none">
                  <option>Offen</option><option>In Verhandlung</option><option>Deal</option><option>Abgesagt</option>
                </select>
              </div>
              <div>
                <label className="text-gray-600 text-xs block mb-1">Kampagne</label>
                <select value={selected.kampagne||''} onChange={e => updateCollab('kampagne', e.target.value)}
                  className="w-full bg-[#141414] border border-white/[0.08] rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none">
                  <option value="">—</option>
                  {kampagnenList.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-600 text-xs block mb-1">Fee €</label>
                <input type="number" defaultValue={selected.fee||0} onBlur={e => updateCollab('fee', Number(e.target.value)||0)}
                  className="w-full bg-[#141414] border border-white/[0.08] rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none" />
              </div>
              <div>
                <label className="text-gray-600 text-xs block mb-1">Promo-Code</label>
                <input type="text" defaultValue={selected.promo_code||''} onBlur={e => updateCollab('promo_code', e.target.value)}
                  className="w-full bg-[#141414] border border-white/[0.08] rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none" />
              </div>
              <div>
                <label className="text-gray-600 text-xs block mb-1">Provision</label>
                <input type="text" defaultValue={selected.affiliate_pct||'15%'} onBlur={e => updateCollab('affiliate_pct', e.target.value)}
                  className="w-full bg-[#141414] border border-white/[0.08] rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none" />
              </div>
              <div>
                <label className="text-gray-600 text-xs block mb-1">Notizen</label>
                <textarea defaultValue={selected.notizen||''} onBlur={e => updateCollab('notizen', e.target.value)} rows={4}
                  className="w-full bg-[#141414] border border-white/[0.08] rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none resize-none" />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
