'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Sidebar from '../components/Sidebar'

const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

const tierStyle: Record<string, string> = {
  'Nano': 'text-ink-2 bg-surface-3/80 border border-hairline/50',
  'Micro': 'text-blue-400 bg-blue-950/80 border border-blue-800/30',
  'Mid-Tier': 'text-purple-400 bg-purple-950/80 border border-purple-800/30',
  'Macro': 'text-amber-400 bg-amber-950/80 border border-amber-800/30',
  'Top-Tier': 'text-red-400 bg-red-950/80 border border-red-800/30',
}

export default function Discovery() {
  const [igHandle, setIgHandle] = useState('')
  const [ttHandle, setTtHandle] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const [history, setHistory] = useState<any[]>([])

  const getToken = async () => (await sb.auth.getSession()).data.session?.access_token || ''

  const search = async () => {
    if (!igHandle && !ttHandle) {
      setError('Bitte mindestens einen Handle eingeben')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    setAdded(false)

    try {
      const token = await getToken()
      const params = new URLSearchParams()
      if (igHandle) params.set('ig', igHandle.replace('@', ''))
      if (ttHandle) params.set('tt', ttHandle.replace('@', ''))
      const res = await fetch('/api/creator?' + params.toString(), {
        headers: { authorization: 'Bearer ' + token }
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        setLoading(false)
        return
      }
      setResult(data)
      setHistory(prev => [data, ...prev.filter(h => h.igHandle !== data.igHandle || h.ttHandle !== data.ttHandle)].slice(0, 10))
      setLoading(false)
    } catch (e: any) {
      setError(e.message || 'Fehler beim Suchen')
      setLoading(false)
    }
  }

  const addToCreators = async () => {
    if (!result) return
    setAdding(true)
    try {
      const token = await getToken()
      const body = {
        name: result.name || igHandle || ttHandle,
        ig: igHandle ? '@' + igHandle.replace('@', '') : '',
        tt: ttHandle ? '@' + ttHandle.replace('@', '') : '',
        ig_follower: result.igFollower || 0,
        tt_follower: result.ttFollower || 0,
        ig_er: result.igER || 0,
        tt_er: result.ttER || 0,
        ig_tier: result.igTier || result.ttTier || 'Nano',
        tt_tier: result.ttTier || '',
        overall_tier: result.overallTier || result.igTier || result.ttTier || 'Nano',
        affiliate_pct: result.affiliatePct || '15%',
        story_wert: result.storyWert || 0,
        reel_wert: result.reelWert || 0,
        tt_wert: result.ttWert || 0,
        ig_avg_likes: result.igAvgLikes || 0,
        tt_avg_video_views: result.ttAvgVideoViews || 0,
        echte_pct: result.echtePct || 0,
        status: 'Offen',
        kategorie: '',
      }
      const res = await fetch('/api/creators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token },
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error('Fehler beim Hinzufügen')
      setAdded(true)
      setAdding(false)
    } catch (e: any) {
      setError(e.message)
      setAdding(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-surface-0">
      <Sidebar />
      <main className="flex-1 md:ml-60 min-h-screen">
        <div className="border-b border-hairline-soft px-8 py-4 bg-surface-0/80 backdrop-blur sticky top-0 z-20">
          <h1 className="text-ink-1 font-semibold text-lg">Discovery</h1>
          <p className="text-ink-3 text-xs mt-0.5">Influencer finden und zur Liste hinzufügen</p>
        </div>

        <div className="p-8 space-y-6 max-w-5xl">
          {/* Such-Bereich */}
          <div className="bg-surface-2 rounded-apple-lg border border-hairline-soft p-6">
            <h2 className="text-ink-1 font-medium text-sm mb-1">Influencer suchen</h2>
            <p className="text-ink-4 text-xs mb-5">Gib einen Instagram- oder TikTok-Handle ein</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-ink-2 text-xs block mb-1.5 flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                  Instagram Handle
                </label>
                <input type="text" value={igHandle} onChange={e => setIgHandle(e.target.value)}
                  placeholder="@username"
                  onKeyDown={e => e.key === 'Enter' && search()}
                  className="w-full bg-surface-0 border border-hairline rounded-apple-sm px-3 py-2.5 text-ink-1 text-sm focus:outline-none focus:border-accent/50 transition-colors"/>
              </div>
              <div>
                <label className="text-ink-2 text-xs block mb-1.5 flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
                  TikTok Handle
                </label>
                <input type="text" value={ttHandle} onChange={e => setTtHandle(e.target.value)}
                  placeholder="@username"
                  onKeyDown={e => e.key === 'Enter' && search()}
                  className="w-full bg-surface-0 border border-hairline rounded-apple-sm px-3 py-2.5 text-ink-1 text-sm focus:outline-none focus:border-accent/50 transition-colors"/>
              </div>
            </div>

            <button onClick={search} disabled={loading || (!igHandle && !ttHandle)}
              className="w-full md:w-auto px-6 py-2.5 rounded-apple-sm bg-accent text-ink-1 text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  Suche läuft...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  Suchen
                </>
              )}
            </button>

            {error && (
              <div className="mt-4 bg-red-950/30 border border-red-500/20 rounded-apple-sm px-4 py-3">
                <p className="text-red-400 text-xs">{error}</p>
                {error.includes('quota') && (
                  <p className="text-red-400/70 text-[10px] mt-1">RapidAPI Limit erreicht. Bitte Plan upgraden oder bis nächsten Monat warten.</p>
                )}
              </div>
            )}
          </div>

          {/* Ergebnis */}
          {result && (
            <div className="bg-surface-2 rounded-apple-lg border border-hairline-soft p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#7F77DD] to-purple-700 flex items-center justify-center text-ink-1 text-xl font-bold">
                    {(result.name || igHandle || ttHandle || '?').slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-ink-1 font-semibold text-lg">{result.name || igHandle || ttHandle}</h2>
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      {igHandle && <span className="text-pink-400">@{igHandle.replace('@', '')}</span>}
                      {ttHandle && <span className="text-cyan-400">@{ttHandle.replace('@', '')}</span>}
                      {(result.overallTier || result.igTier) && (
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${tierStyle[result.overallTier || result.igTier]}`}>
                          {result.overallTier || result.igTier}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={addToCreators} disabled={adding || added}
                  className={`px-4 py-2 rounded-apple-sm text-sm font-medium transition-all flex items-center gap-2 ${added ? 'bg-emerald-600 text-ink-1' : 'bg-accent text-ink-1 hover:bg-accent-hover'} ${adding ? 'opacity-50' : ''}`}>
                  {adding ? (
                    <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Hinzufügen...</>
                  ) : added ? (
                    <>✓ Hinzugefügt</>
                  ) : (
                    <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Zu Creator hinzufügen</>
                  )}
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'IG Follower', value: (result.igFollower || 0).toLocaleString('de-DE'), show: !!result.igFollower },
                  { label: 'TT Follower', value: (result.ttFollower || 0).toLocaleString('de-DE'), show: !!result.ttFollower },
                  { label: 'IG ER', value: result.igER ? `${result.igER}%` : '—', show: !!result.igER },
                  { label: 'TT ER', value: result.ttER ? `${result.ttER}%` : '—', show: !!result.ttER },
                  { label: 'Ø Likes (IG)', value: (result.igAvgLikes || 0).toLocaleString('de-DE'), show: !!result.igAvgLikes },
                  { label: 'Ø Views (TT)', value: (result.ttAvgVideoViews || 0).toLocaleString('de-DE'), show: !!result.ttAvgVideoViews },
                  { label: 'Story Wert', value: result.storyWert ? `${result.storyWert} €` : '—', show: !!result.storyWert },
                  { label: 'Reel Wert', value: result.reelWert ? `${result.reelWert} €` : '—', show: !!result.reelWert },
                  { label: 'TT Wert', value: result.ttWert ? `${result.ttWert} €` : '—', show: !!result.ttWert },
                  { label: 'Affiliate', value: result.affiliatePct || '—', show: !!result.affiliatePct },
                  { label: 'Echte %', value: result.echtePct ? `${result.echtePct}%` : '—', show: !!result.echtePct },
                ].filter(s => s.show).map(s => (
                  <div key={s.label} className="bg-surface-0 rounded-apple-sm p-3 border border-hairline-soft">
                    <div className="text-ink-4 text-[10px] uppercase tracking-wide font-medium">{s.label}</div>
                    <div className="text-ink-1 text-sm font-semibold mt-1">{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historie */}
          {history.length > 0 && (
            <div className="bg-surface-2 rounded-apple-lg border border-hairline-soft p-6">
              <h2 className="text-ink-1 font-medium text-sm mb-1">Zuletzt gesucht</h2>
              <p className="text-ink-4 text-xs mb-4">{history.length} Suchen</p>
              <div className="space-y-2">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-apple-sm bg-surface-0 border border-hairline-soft">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-semibold">
                        {(h.name || '?').slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-ink-1 text-xs font-medium">{h.name || 'Unbekannt'}</div>
                        <div className="text-ink-4 text-[10px]">
                          {h.igFollower ? `IG: ${h.igFollower.toLocaleString('de-DE')}` : ''}
                          {h.ttFollower ? ` · TT: ${h.ttFollower.toLocaleString('de-DE')}` : ''}
                        </div>
                      </div>
                    </div>
                    {(h.overallTier || h.igTier) && (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${tierStyle[h.overallTier || h.igTier]}`}>
                        {h.overallTier || h.igTier}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!result && history.length === 0 && !loading && (
            <div className="bg-surface-2 rounded-apple-lg border border-hairline-soft p-12 text-center">
              <div className="w-16 h-16 rounded-apple-lg bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7F77DD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <h3 className="text-ink-1 text-sm font-medium mb-1">Influencer entdecken</h3>
              <p className="text-ink-4 text-xs max-w-sm mx-auto">Gib einen Handle ein und lade echte Daten direkt zu deiner Liste — Follower, Engagement, Tier, Werte und mehr.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
