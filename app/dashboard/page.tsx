'use client'
import Link from 'next/link'
import Sidebar from '../components/Sidebar'
import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const tierColor: Record<string, string> = {
  'Nano': 'bg-gray-800/80 text-gray-400 border border-gray-700/50',
  'Micro': 'bg-blue-950/80 text-blue-400 border border-blue-800/30',
  'Mid-Tier': 'bg-purple-950/80 text-purple-400 border border-purple-800/30',
  'Macro': 'bg-amber-950/80 text-amber-400 border border-amber-800/30',
  'Top-Tier': 'bg-red-950/80 text-red-400 border border-red-800/30',
}

const statusColor: Record<string, string> = {
  'Deal': 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/30',
  'In Verhandlung': 'bg-amber-950/80 text-amber-400 border border-amber-800/30',
  'Kontaktiert': 'bg-blue-950/80 text-blue-400 border border-blue-800/30',
  'Offen': 'bg-gray-800/80 text-gray-400 border border-gray-700/50',
  'Abgelehnt': 'bg-red-950/80 text-red-400 border border-red-800/30',
}

const roasColor = (r: number) => r >= 3 ? 'text-emerald-400' : r >= 1 ? 'text-amber-400' : 'text-red-400'

const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function Dashboard() {
  const [creators, setCreators] = useState<any[]>([])
  const [postings, setPostings] = useState<any[]>([])
  const [kampagnen, setKampagnen] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    sb.auth.getSession().then(async ({ data: s }) => {
      const token = s.session?.access_token || ''
      const headers = { authorization: 'Bearer ' + token }
      
      const [cRes, kRes] = await Promise.all([
        fetch('/api/creators', { headers }).then(r => r.json()).catch(() => []),
        fetch('/api/kampagnen', { headers }).then(r => r.json()).catch(() => [])
      ])
      
      const cArr = Array.isArray(cRes) ? cRes : []
      setCreators(cArr)
      setKampagnen(Array.isArray(kRes) ? kRes : [])
      
      // Postings für alle Creator laden
      const allPostings = await Promise.all(
        cArr.map((c: any) => fetch('/api/postings?creator_id=' + c.id, { headers }).then(r => r.json()).catch(() => []))
      )
      setPostings(allPostings.flat())
      setLoading(false)
    })
  }, [])

  // Berechnungen aus Postings (Source of Truth)
  const stats = useMemo(() => {
    const totalFee = postings.reduce((s, p) => s + (p.fee || 0) + (p.produkt || 0), 0)
    const totalOrgU = postings.reduce((s, p) => s + (p.org_umsatz || 0), 0)
    const totalAdU = postings.reduce((s, p) => s + (p.ad_umsatz || 0), 0)
    const totalAdS = postings.reduce((s, p) => s + (p.ad_spend || 0), 0)
    const totalOrgBest = postings.reduce((s, p) => s + (p.org_bestellungen || 0), 0)
    const gesU = totalOrgU + totalAdU
    const gesK = totalFee + totalAdS
    const gesROAS = gesK > 0 ? Math.round(gesU / gesK * 100) / 100 : 0
    const orgROAS = totalFee > 0 ? Math.round(totalOrgU / totalFee * 100) / 100 : 0
    
    return { totalFee, totalOrgU, totalAdU, totalAdS, gesU, gesK, gesROAS, orgROAS, totalOrgBest }
  }, [postings])

  // Status-Verteilung dynamisch
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    creators.forEach(c => {
      const s = c.status || 'Offen'
      counts[s] = (counts[s] || 0) + 1
    })
    return Object.entries(counts).map(([label, count]) => ({ label, count, total: creators.length }))
  }, [creators])

  // Tier-Verteilung dynamisch
  const tierCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    creators.forEach(c => {
      const t = c.overall_tier || c.ig_tier || 'Nano'
      counts[t] = (counts[t] || 0) + 1
    })
    const order = ['Top-Tier', 'Macro', 'Mid-Tier', 'Micro', 'Nano']
    return order.filter(t => counts[t]).map(t => ({ label: t, count: counts[t] }))
  }, [creators])

  // Top Creator (nach ges_umsatz aus Postings)
  const topCreators = useMemo(() => {
    return creators.map(c => {
      const cp = postings.filter(p => p.creator_id === c.id)
      const fee = cp.reduce((s, p) => s + (p.fee || 0) + (p.produkt || 0), 0)
      const orgU = cp.reduce((s, p) => s + (p.org_umsatz || 0), 0)
      const adU = cp.reduce((s, p) => s + (p.ad_umsatz || 0), 0)
      const adS = cp.reduce((s, p) => s + (p.ad_spend || 0), 0)
      const gesU = orgU + adU
      const gesK = fee + adS
      const roas = gesK > 0 ? Math.round(gesU / gesK * 100) / 100 : 0
      return { ...c, _umsatz: gesU, _roas: roas }
    }).sort((a, b) => b._umsatz - a._umsatz).slice(0, 5)
  }, [creators, postings])

  // Kampagnen-Performance (aus Postings + Kampagnen)
  const campaigns = useMemo(() => {
    const byKamp: Record<string, { name: string; fee: number; gesU: number; gesK: number; count: number }> = {}
    postings.forEach(p => {
      const k = p.kampagne || 'Ohne Kampagne'
      if (!byKamp[k]) byKamp[k] = { name: k, fee: 0, gesU: 0, gesK: 0, count: 0 }
      const fee = (p.fee || 0) + (p.produkt || 0)
      byKamp[k].fee += fee
      byKamp[k].gesU += (p.org_umsatz || 0) + (p.ad_umsatz || 0)
      byKamp[k].gesK += fee + (p.ad_spend || 0)
      byKamp[k].count += 1
    })
    return Object.values(byKamp).map(k => ({
      ...k,
      roas: k.gesK > 0 ? Math.round(k.gesU / k.gesK * 100) / 100 : 0
    })).slice(0, 6)
  }, [postings])

  // Diesen Monat
  const thisMonth = useMemo(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    return creators.filter(c => new Date(c.created_at) >= monthStart).length
  }, [creators])

  // Aktivitäts-Feed (letzte 5 Aktivitäten)
  const activities = useMemo(() => {
    const acts: any[] = []
    creators.forEach(c => acts.push({ type: 'creator', creator: c, date: c.created_at, label: 'Creator hinzugefügt' }))
    postings.forEach(p => {
      const c = creators.find(c => c.id === p.creator_id)
      if (c) acts.push({ type: 'posting', creator: c, date: p.created_at, label: 'Neues Posting', sub: p.kampagne })
    })
    return acts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6)
  }, [creators, postings])

  const dealsCount = creators.filter(c => c.status === 'Deal').length
  const inVerhandlung = creators.filter(c => c.status === 'In Verhandlung').length

  if (loading) return (
    <div className="flex min-h-screen bg-[#0A0A0A]">
      <Sidebar />
      <main className="flex-1 md:ml-60 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"/>
      </main>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-[#0A0A0A]">
      <Sidebar />

      <main className="flex-1 md:ml-60 min-h-screen">
        <div className="border-b border-white/[0.06] px-8 py-4 flex items-center justify-between bg-[#0A0A0A]/80 backdrop-blur sticky top-0 z-20">
          <div>
            <h1 className="text-white font-semibold text-lg">Dashboard</h1>
            <p className="text-gray-500 text-xs mt-0.5">
              {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/creator" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#7F77DD] text-white text-xs hover:bg-[#534AB7] transition-colors font-medium">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Creator hinzufügen
            </Link>
          </div>
        </div>

        <div className="p-8">
          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: 'Gesamt Umsatz',
                value: `${stats.gesU.toLocaleString('de-DE')} €`,
                sub: `${stats.totalOrgBest} Bestellungen`,
                color: 'text-emerald-400',
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
              },
              {
                label: 'Gesamt ROAS',
                value: stats.gesROAS > 0 ? `${stats.gesROAS}x` : '—',
                sub: `Org. ${stats.orgROAS > 0 ? stats.orgROAS + 'x' : '—'}`,
                color: roasColor(stats.gesROAS),
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
              },
              {
                label: 'Creator',
                value: `${creators.length}`,
                sub: thisMonth > 0 ? `+${thisMonth} diesen Monat` : 'Keine neuen',
                color: 'text-white',
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
              },
              {
                label: 'Aktive Deals',
                value: `${dealsCount}`,
                sub: `${inVerhandlung} in Verhandlung`,
                color: 'text-amber-400',
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/></svg>,
              },
            ].map(m => (
              <div key={m.label} className="bg-[#141414] rounded-2xl p-5 border border-white/[0.06] hover:border-white/[0.1] transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center text-gray-400">{m.icon}</div>
                </div>
                <div className={`text-2xl font-semibold ${m.color} mb-1`}>{m.value}</div>
                <div className="text-gray-500 text-xs font-medium">{m.label}</div>
                <div className="text-gray-700 text-xs mt-0.5">{m.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* ROAS Chart */}
            <div className="lg:col-span-2 bg-[#141414] rounded-2xl border border-white/[0.06] p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-white font-medium text-sm">ROAS nach Kampagne</h2>
                  <p className="text-gray-600 text-xs mt-0.5">{campaigns.length > 0 ? `${campaigns.length} Kampagnen mit Postings` : 'Noch keine Postings'}</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-gray-500"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>≥3x</span>
                  <span className="flex items-center gap-1.5 text-gray-500"><span className="w-2 h-2 rounded-full bg-amber-500"></span>1-3x</span>
                  <span className="flex items-center gap-1.5 text-gray-500"><span className="w-2 h-2 rounded-full bg-red-500"></span>{'<'}1x</span>
                </div>
              </div>
              {campaigns.length > 0 ? (
                <div className="flex items-end gap-3 h-36">
                  {campaigns.map(c => {
                    const maxRoas = Math.max(...campaigns.map(x => x.roas), 5)
                    const height = c.roas > 0 ? Math.max((c.roas / maxRoas) * 100, 8) : 4
                    const color = c.roas >= 3 ? 'bg-emerald-500' : c.roas >= 1 ? 'bg-amber-500' : c.roas > 0 ? 'bg-red-500' : 'bg-white/10'
                    return (
                      <div key={c.name} className="flex-1 flex flex-col items-center gap-2">
                        <span className={`text-xs font-medium ${c.roas >= 3 ? 'text-emerald-400' : c.roas >= 1 ? 'text-amber-400' : c.roas > 0 ? 'text-red-400' : 'text-gray-600'}`}>
                          {c.roas > 0 ? `${c.roas}x` : '—'}
                        </span>
                        <div className="w-full flex items-end" style={{ height: '100px' }}>
                          <div className={`w-full rounded-t-lg ${color} transition-all`} style={{ height: `${height}%` }}></div>
                        </div>
                        <span className="text-gray-500 text-xs text-center leading-tight truncate max-w-full" title={c.name}>{c.name}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="h-36 flex items-center justify-center text-gray-600 text-xs">Noch keine Postings angelegt</div>
              )}
            </div>

            {/* Status Übersicht */}
            <div className="bg-[#141414] rounded-2xl border border-white/[0.06] p-6">
              <h2 className="text-white font-medium text-sm mb-5">Status-Übersicht</h2>
              {statusCounts.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {statusCounts.map(s => {
                    const c = s.label === 'Deal' ? 'bg-emerald-500' : s.label === 'Kontaktiert' ? 'bg-blue-500' : s.label === 'In Verhandlung' ? 'bg-amber-500' : s.label === 'Abgelehnt' ? 'bg-red-500' : 'bg-gray-700'
                    return (
                      <div key={s.label}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-gray-400 text-xs">{s.label}</span>
                          <span className="text-white text-xs font-medium">{s.count}</span>
                        </div>
                        <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                          <div className={`h-full ${c} rounded-full`} style={{ width: `${(s.count / s.total) * 100}%` }}></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-gray-600 text-xs">Noch keine Creator</div>
              )}

              {tierCounts.length > 0 && (
                <div className="mt-6 pt-5 border-t border-white/[0.06]">
                  <h3 className="text-white font-medium text-xs mb-3">Tier-Verteilung</h3>
                  <div className="flex flex-col gap-2">
                    {tierCounts.map(t => {
                      const c = t.label === 'Top-Tier' ? 'bg-red-500' : t.label === 'Macro' ? 'bg-amber-500' : t.label === 'Mid-Tier' ? 'bg-purple-500' : t.label === 'Micro' ? 'bg-blue-500' : 'bg-gray-500'
                      return (
                        <div key={t.label} className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${c} flex-shrink-0`}></span>
                          <span className="text-gray-500 text-xs flex-1">{t.label}</span>
                          <span className="text-gray-400 text-xs">{t.count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Top Creator + Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#141414] rounded-2xl border border-white/[0.06] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <div>
                  <h2 className="text-white font-medium text-sm">Top Creator</h2>
                  <p className="text-gray-600 text-xs mt-0.5">Sortiert nach Umsatz</p>
                </div>
                <Link href="/creator" className="text-[#7F77DD] text-xs hover:underline flex items-center gap-1">
                  Alle ansehen
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </Link>
              </div>
              {topCreators.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      {['Creator', 'Follower', 'Tier', 'Umsatz', 'ROAS'].map(h => (
                        <th key={h} className="text-left text-xs text-gray-600 px-6 py-3 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topCreators.map((c, i) => (
                      <tr key={c.id} className={`hover:bg-white/[0.02] transition-colors ${i !== topCreators.length - 1 ? 'border-b border-white/[0.04]' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#7F77DD]/20 flex items-center justify-center text-[#7F77DD] text-xs font-semibold flex-shrink-0">
                              {(c.name || '').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                              <div className="text-white text-sm font-medium">{c.name}</div>
                              <div className="text-gray-600 text-xs">{c.ig}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-sm">{(c.ig_follower || c.tt_follower || 0).toLocaleString('de-DE')}</td>
                        <td className="px-6 py-4"><span className={`text-xs px-2 py-1 rounded-md font-medium ${tierColor[(c.overall_tier || c.ig_tier || 'Nano')]}`}>{c.overall_tier || c.ig_tier || 'Nano'}</span></td>
                        <td className="px-6 py-4 text-gray-300 text-sm font-medium">{c._umsatz > 0 ? `${c._umsatz.toLocaleString('de-DE')} €` : <span className="text-gray-700">—</span>}</td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-semibold ${c._roas > 0 ? roasColor(c._roas) : 'text-gray-700'}`}>
                            {c._roas > 0 ? `${c._roas}x` : '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center text-gray-600 text-sm">
                  Noch keine Creator angelegt. <Link href="/creator" className="text-[#7F77DD] hover:underline">Jetzt loslegen →</Link>
                </div>
              )}
            </div>

            {/* Aktivitätsfeed */}
            <div className="bg-[#141414] rounded-2xl border border-white/[0.06] p-6">
              <h2 className="text-white font-medium text-sm mb-5">Aktivität</h2>
              {activities.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {activities.map((a, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${a.type === 'creator' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                        {a.type === 'creator' ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4"/><path d="M5.5 21v-2a4 4 0 0 1 4-4h5a4 4 0 0 1 4 4v2"/></svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8M12 8v8"/></svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-gray-300 text-xs font-medium truncate">{a.label}: {a.creator.name}</div>
                        {a.sub && <div className="text-gray-600 text-[10px] truncate">{a.sub}</div>}
                        <div className="text-gray-700 text-[10px] mt-0.5">{new Date(a.date).toLocaleDateString('de-DE')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-600 text-xs">Noch keine Aktivität</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
