'use client'
import Link from 'next/link'
import Sidebar from '../components/Sidebar'
import LoadingScreen from '../components/LoadingScreen'
import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const tierColor: Record<string, string> = {
  'Nano': 'bg-white/[0.04] text-ink-3 border border-hairline',
  'Micro': 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  'Mid-Tier': 'bg-accent-soft text-accent border border-accent/20',
  'Macro': 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  'Top-Tier': 'bg-red-500/10 text-red-400 border border-red-500/20',
}

const roasColor = (r: number) => r >= 3 ? 'text-emerald-400' : r >= 1 ? 'text-amber-400' : r > 0 ? 'text-red-400' : 'text-ink-4'

const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// Skeleton-Komponente für Loading
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-white/[0.04] rounded-apple-sm animate-pulse ${className}`} />
}

function ChartCard({ title, subtitle, children, loading, right }: any) {
  return (
    <div className="bg-surface-2/70 backdrop-blur-xl rounded-apple-lg border border-hairline p-6 shadow-apple-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-ink-1 font-medium text-sm tracking-tight">{title}</h2>
          {subtitle && <p className="text-ink-4 text-xs mt-0.5">{subtitle}</p>}
        </div>
        {right}
      </div>
      {loading ? <Skeleton className="h-32 w-full" /> : children}
    </div>
  )
}

export default function Dashboard() {
  const [creators, setCreators] = useState<any[]>([])
  const [postings, setPostings] = useState<any[]>([])
  const [snapshots, setSnapshots] = useState<any[]>([])
  const [bestellungen, setBestellungen] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [chartsLoading, setChartsLoading] = useState(true)

  useEffect(() => {
    sb.auth.getSession().then(async ({ data: s }) => {
      const token = s.session?.access_token || ''
      const headers = { authorization: 'Bearer ' + token }

      const cRes = await fetch('/api/creators', { headers }).then(r => r.json()).catch(() => [])
      const cArr = Array.isArray(cRes) ? cRes : []
      setCreators(cArr)
      setLoading(false)

      // Lade Postings, Snapshots, Bestellungen parallel
      const [allPostings, allSnaps, bestRes] = await Promise.all([
        Promise.all(cArr.map((c: any) => fetch('/api/postings?creator_id=' + c.id, { headers }).then(r => r.json()).catch(() => []))),
        Promise.all(cArr.map((c: any) => fetch('/api/snapshots?creator_id=' + c.id, { headers }).then(r => r.json()).catch(() => []))),
        fetch('/api/bestellungen', { headers }).then(r => r.json()).catch(() => [])
      ])
      setPostings(allPostings.flat())
      setSnapshots(allSnaps.flat())
      setBestellungen(Array.isArray(bestRes) ? bestRes : [])
      setChartsLoading(false)
    })
  }, [])

  // --- KPIs ---
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

  // Monats-Vergleich
  const monthCompare = useMemo(() => {
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    
    const thisU = postings.filter(p => new Date(p.created_at) >= thisMonth).reduce((s, p) => s + (p.org_umsatz || 0) + (p.ad_umsatz || 0), 0)
    const lastU = postings.filter(p => {
      const d = new Date(p.created_at)
      return d >= lastMonth && d < thisMonth
    }).reduce((s, p) => s + (p.org_umsatz || 0) + (p.ad_umsatz || 0), 0)
    
    const thisCreators = creators.filter(c => new Date(c.created_at) >= thisMonth).length
    const lastCreators = creators.filter(c => {
      const d = new Date(c.created_at)
      return d >= lastMonth && d < thisMonth
    }).length

    const umsatzChange = lastU > 0 ? Math.round((thisU - lastU) / lastU * 100) : (thisU > 0 ? 100 : 0)
    const creatorChange = lastCreators > 0 ? Math.round((thisCreators - lastCreators) / lastCreators * 100) : (thisCreators > 0 ? 100 : 0)
    
    return { thisU, lastU, thisCreators, lastCreators, umsatzChange, creatorChange }
  }, [postings, creators])

  // Umsatz-Verlauf 30 Tage
  const umsatzVerlauf = useMemo(() => {
    const days: { date: string; value: number; label: string }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      const next = new Date(d)
      next.setDate(next.getDate() + 1)
      const dailyU = postings
        .filter(p => {
          const pd = new Date(p.created_at)
          return pd >= d && pd < next
        })
        .reduce((s, p) => s + (p.org_umsatz || 0) + (p.ad_umsatz || 0), 0)
      days.push({
        date: d.toISOString().split('T')[0],
        value: dailyU,
        label: d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
      })
    }
    return days
  }, [postings])

  // Follower-Wachstum (kombiniert IG + TT, 30 Tage)
  const followerVerlauf = useMemo(() => {
    if (snapshots.length === 0) return { days: [], igMin: 0, igMax: 1, ttMin: 0, ttMax: 1 }
    const days: { date: string; ig: number; tt: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      const next = new Date(d)
      next.setDate(next.getDate() + 1)
      
      let totalIg = 0, totalTt = 0
      creators.forEach(c => {
        const snaps = snapshots.filter(s => s.creator_id === c.id && new Date(s.created_at) < next).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        if (snaps[0]) {
          totalIg += snaps[0].ig_follower || 0
          totalTt += snaps[0].tt_follower || 0
        }
      })
      days.push({ date: d.toISOString().split('T')[0], ig: totalIg, tt: totalTt })
    }
    const igVals = days.map(d => d.ig).filter(v => v > 0)
    const ttVals = days.map(d => d.tt).filter(v => v > 0)
    const igMax = Math.max(...igVals, 1)
    const igMin = Math.min(...igVals, igMax)
    const ttMax = Math.max(...ttVals, 1)
    const ttMin = Math.min(...ttVals, ttMax)
    return { days, igMin, igMax, ttMin, ttMax }
  }, [snapshots, creators])

  // Pipeline-Funnel
  const pipeline = useMemo(() => {
    const stages = [
      { label: 'Offen', status: 'Offen' },
      { label: 'Kontaktiert', status: 'Kontaktiert' },
      { label: 'Verhandlung', status: 'In Verhandlung' },
      { label: 'Deal', status: 'Deal' },
    ]
    return stages.map(s => ({
      ...s,
      count: creators.filter(c => c.status === s.status).length
    }))
  }, [creators])

  // Top Postings nach ROAS
  const topPostings = useMemo(() => {
    return postings.map(p => {
      const fee = (p.fee || 0) + (p.produkt || 0)
      const u = (p.org_umsatz || 0) + (p.ad_umsatz || 0)
      const k = fee + (p.ad_spend || 0)
      const roas = k > 0 ? Math.round(u / k * 100) / 100 : 0
      const creator = creators.find(c => c.id === p.creator_id)
      return { ...p, _roas: roas, _u: u, _creator: creator }
    }).filter(p => p._roas > 0).sort((a, b) => b._roas - a._roas).slice(0, 5)
  }, [postings, creators])

  // Bestellungen-Status
  const bestStatus = useMemo(() => {
    const status = ['Nicht versendet', 'Versendet', 'Angekommen']
    return status.map(s => ({
      label: s,
      count: bestellungen.filter(b => b.status === s).length,
      color: s === 'Angekommen' ? '#10b981' : s === 'Versendet' ? '#f59e0b' : '#6b7280'
    }))
  }, [bestellungen])

  // Plattform-Verteilung (IG vs TT)
  const platformDist = useMemo(() => {
    const ig = creators.reduce((s, c) => s + (c.ig_follower || 0), 0)
    const tt = creators.reduce((s, c) => s + (c.tt_follower || 0), 0)
    const total = ig + tt
    return { ig, tt, total, igPct: total > 0 ? Math.round(ig / total * 100) : 0, ttPct: total > 0 ? Math.round(tt / total * 100) : 0 }
  }, [creators])

  // Top Creator nach Umsatz
  const topCreators = useMemo(() => {
    return creators.map(c => {
      const cp = postings.filter(p => p.creator_id === c.id)
      const fee = cp.reduce((s, p) => s + (p.fee || 0) + (p.produkt || 0), 0)
      const u = cp.reduce((s, p) => s + (p.org_umsatz || 0) + (p.ad_umsatz || 0), 0)
      const k = fee + cp.reduce((s, p) => s + (p.ad_spend || 0), 0)
      const roas = k > 0 ? Math.round(u / k * 100) / 100 : 0
      return { ...c, _umsatz: u, _roas: roas }
    }).sort((a, b) => b._umsatz - a._umsatz).slice(0, 5)
  }, [creators, postings])

  // Aktivität
  const activities = useMemo(() => {
    const acts: any[] = []
    creators.forEach(c => acts.push({ type: 'creator', creator: c, date: c.created_at, label: 'Creator hinzugefügt' }))
    postings.forEach(p => {
      const c = creators.find(c => c.id === p.creator_id)
      if (c) acts.push({ type: 'posting', creator: c, date: p.created_at, label: 'Neues Posting', sub: p.kampagne })
    })
    return acts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8)
  }, [creators, postings])

  const dealsCount = creators.filter(c => c.status === 'Deal').length
  const inVerhandlung = creators.filter(c => c.status === 'In Verhandlung').length

  if (loading) return <LoadingScreen message="Dashboard wird geladen..." />

  const maxUmsatz = Math.max(...umsatzVerlauf.map(d => d.value), 1)

  return (
    <div className="flex min-h-screen bg-surface-0">
      <Sidebar />
      <main className="flex-1 md:ml-60 min-h-screen">
        <div className="border-b border-hairline-soft px-8 py-5 flex items-center justify-between bg-surface-0/80 backdrop-blur-xl sticky top-0 z-20">
          <div>
            <h1 className="text-ink-1 font-semibold text-lg tracking-tight">Dashboard</h1>
            <p className="text-ink-3 text-xs mt-0.5">
              {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/creator" className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-accent text-white text-xs hover:bg-accent-hover active:scale-[0.98] transition-all duration-200 ease-apple font-medium shadow-apple-sm">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Creator hinzufügen
            </Link>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Gesamt Umsatz', value: `${stats.gesU.toLocaleString('de-DE')} €`, sub: `${stats.totalOrgBest} Bestellungen`, color: 'text-emerald-400', change: monthCompare.umsatzChange, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
              { label: 'Gesamt ROAS', value: stats.gesROAS > 0 ? `${stats.gesROAS}x` : '—', sub: `Org. ${stats.orgROAS > 0 ? stats.orgROAS + 'x' : '—'}`, color: roasColor(stats.gesROAS), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> },
              { label: 'Creator', value: `${creators.length}`, sub: monthCompare.thisCreators > 0 ? `+${monthCompare.thisCreators} diesen Monat` : 'Keine neuen', color: 'text-ink-1', change: monthCompare.creatorChange, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
              { label: 'Aktive Deals', value: `${dealsCount}`, sub: `${inVerhandlung} in Verhandlung`, color: 'text-amber-400', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/></svg> },
            ].map(m => (
              <div key={m.label} className="bg-surface-2/70 backdrop-blur-xl rounded-apple-lg p-5 border border-hairline hover:border-white/[0.12] transition-colors duration-200 ease-apple shadow-apple-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-apple-sm bg-white/[0.05] flex items-center justify-center text-ink-2">{m.icon}</div>
                  {m.change !== undefined && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.change >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                      {m.change >= 0 ? '+' : ''}{m.change}%
                    </span>
                  )}
                </div>
                <div className={`text-2xl font-semibold tracking-tight ${m.color} mb-1`}>{m.value}</div>
                <div className="text-ink-3 text-xs font-medium">{m.label}</div>
                <div className="text-ink-4 text-xs mt-0.5">{m.sub}</div>
              </div>
            ))}
          </div>

          {/* Umsatz-Verlauf + Pipeline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
            <ChartCard title="Umsatz-Verlauf" subtitle="Letzte 30 Tage" loading={chartsLoading}>
              <div className="relative h-40">
                <svg viewBox="0 0 600 160" preserveAspectRatio="none" className="w-full h-full">
                  <defs>
                    <linearGradient id="gradient1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  {umsatzVerlauf.map((d, i) => {
                    const x = (i / (umsatzVerlauf.length - 1)) * 600
                    const y = 160 - (d.value / maxUmsatz) * 140
                    const nx = i < umsatzVerlauf.length - 1 ? ((i + 1) / (umsatzVerlauf.length - 1)) * 600 : x
                    const ny = i < umsatzVerlauf.length - 1 ? 160 - (umsatzVerlauf[i + 1].value / maxUmsatz) * 140 : y
                    return <line key={i} x1={x} y1={y} x2={nx} y2={ny} stroke="#10b981" strokeWidth="2"/>
                  })}
                  <path d={`M 0 160 ${umsatzVerlauf.map((d, i) => {
                    const x = (i / (umsatzVerlauf.length - 1)) * 600
                    const y = 160 - (d.value / maxUmsatz) * 140
                    return `L ${x} ${y}`
                  }).join(' ')} L 600 160 Z`} fill="url(#gradient1)"/>
                </svg>
              </div>
              <div className="flex justify-between text-xs text-ink-4 mt-2">
                <span>{umsatzVerlauf[0]?.label}</span>
                <span>{umsatzVerlauf[Math.floor(umsatzVerlauf.length / 2)]?.label}</span>
                <span>{umsatzVerlauf[umsatzVerlauf.length - 1]?.label}</span>
              </div>
            </ChartCard>
            </div>

            <ChartCard title="Sales Pipeline" subtitle={`${creators.length} Creator`} loading={chartsLoading}>
              <div className="space-y-3">
                {pipeline.map((p, i) => {
                  const max = Math.max(...pipeline.map(x => x.count), 1)
                  const colors = ['bg-ink-4', 'bg-blue-500', 'bg-amber-500', 'bg-emerald-500']
                  return (
                    <div key={p.label}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-ink-2 text-xs">{p.label}</span>
                        <span className="text-ink-1 text-xs font-semibold">{p.count}</span>
                      </div>
                      <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                        <div className={`h-full ${colors[i]} rounded-full transition-all duration-300 ease-apple`} style={{ width: `${(p.count / max) * 100}%` }}/>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ChartCard>
          </div>

          {/* Follower-Wachstum + Plattform */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartCard title="Follower-Wachstum" subtitle="IG + TikTok (getrennte Skalen)" loading={chartsLoading}>
              {followerVerlauf.days.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span className="flex items-center gap-1.5 text-pink-400"><span className="w-2 h-2 rounded-full bg-pink-500"/>Instagram</span>
                    <span className="flex items-center gap-1.5 text-cyan-400"><span className="w-2 h-2 rounded-full bg-cyan-400"/>TikTok</span>
                  </div>
                  <div className="relative h-32">
                    <svg viewBox="0 0 600 130" preserveAspectRatio="none" className="w-full h-full">
                      {(() => {
                        const igRange = Math.max(followerVerlauf.igMax - followerVerlauf.igMin, followerVerlauf.igMax * 0.0002, 1)
                        const ttRange = Math.max(followerVerlauf.ttMax - followerVerlauf.ttMin, followerVerlauf.ttMax * 0.0002, 1)
                        return followerVerlauf.days.map((d, i) => {
                          if (i === followerVerlauf.days.length - 1) return null
                          const x1 = (i / (followerVerlauf.days.length - 1)) * 600
                          const x2 = ((i + 1) / (followerVerlauf.days.length - 1)) * 600
                          const igY1 = 130 - ((d.ig - followerVerlauf.igMin) / igRange) * 110
                          const igY2 = 130 - ((followerVerlauf.days[i + 1].ig - followerVerlauf.igMin) / igRange) * 110
                          const ttY1 = 130 - ((d.tt - followerVerlauf.ttMin) / ttRange) * 110
                          const ttY2 = 130 - ((followerVerlauf.days[i + 1].tt - followerVerlauf.ttMin) / ttRange) * 110
                          return (
                            <g key={i}>
                              <line x1={x1} y1={igY1} x2={x2} y2={igY2} stroke="#ec4899" strokeWidth="2"/>
                              <line x1={x1} y1={ttY1} x2={x2} y2={ttY2} stroke="#22d3ee" strokeWidth="2" strokeDasharray="3,3"/>
                            </g>
                          )
                        })
                      })()}
                    </svg>
                  </div>
                  <div className="flex justify-between text-[10px] text-ink-4 mt-2">
                    <span>IG: {followerVerlauf.igMin.toLocaleString('de-DE')} → {followerVerlauf.igMax.toLocaleString('de-DE')}</span>
                    <span>TT: {followerVerlauf.ttMin.toLocaleString('de-DE')} → {followerVerlauf.ttMax.toLocaleString('de-DE')}</span>
                  </div>
                </>
              ) : (
                <div className="h-32 flex items-center justify-center text-ink-4 text-xs">Keine Snapshot-Daten</div>
              )}
            </ChartCard>

            <ChartCard title="Plattform-Verteilung" subtitle={`${platformDist.total.toLocaleString('de-DE')} Follower gesamt`} loading={chartsLoading}>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-pink-400 text-xs flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-pink-500"/>Instagram</span>
                    <span className="text-ink-1 text-xs font-semibold">{platformDist.ig.toLocaleString('de-DE')}</span>
                  </div>
                  <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                    <div className="h-full bg-pink-500 rounded-full" style={{ width: `${platformDist.igPct}%` }}/>
                  </div>
                  <div className="text-ink-4 text-[10px] mt-1">{platformDist.igPct}%</div>
                </div>
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-cyan-400 text-xs flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cyan-400"/>TikTok</span>
                    <span className="text-ink-1 text-xs font-semibold">{platformDist.tt.toLocaleString('de-DE')}</span>
                  </div>
                  <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${platformDist.ttPct}%` }}/>
                  </div>
                  <div className="text-ink-4 text-[10px] mt-1">{platformDist.ttPct}%</div>
                </div>
              </div>
            </ChartCard>

            <ChartCard title="Bestellungen" subtitle={`${bestellungen.length} gesamt`} loading={chartsLoading}>
              {bestellungen.length > 0 ? (
                <div className="space-y-3">
                  {bestStatus.map(s => {
                    const pct = bestellungen.length > 0 ? (s.count / bestellungen.length) * 100 : 0
                    return (
                      <div key={s.label}>
                        <div className="flex justify-between mb-1">
                          <span className="text-ink-2 text-xs flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: s.color }}/>{s.label}
                          </span>
                          <span className="text-ink-1 text-xs font-semibold">{s.count}</span>
                        </div>
                        <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ background: s.color, width: `${pct}%` }}/>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-ink-4 text-xs">Keine Bestellungen</div>
              )}
            </ChartCard>
          </div>

          {/* Monats-Vergleich */}
          <ChartCard title="Monats-Vergleich" subtitle="Diesen Monat vs. letzten Monat" loading={chartsLoading}>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-ink-3 text-xs mb-2">Umsatz</div>
                <div className="flex items-end gap-6">
                  <div>
                    <div className="text-ink-4 text-[10px]">Vorheriger Monat</div>
                    <div className="text-ink-2 text-lg font-semibold tracking-tight">{monthCompare.lastU.toLocaleString('de-DE')} €</div>
                  </div>
                  <div className="text-2xl text-ink-4">→</div>
                  <div>
                    <div className="text-ink-4 text-[10px]">Dieser Monat</div>
                    <div className="text-emerald-400 text-lg font-semibold tracking-tight">{monthCompare.thisU.toLocaleString('de-DE')} €</div>
                  </div>
                  <div className={`text-sm font-bold ${monthCompare.umsatzChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {monthCompare.umsatzChange >= 0 ? '+' : ''}{monthCompare.umsatzChange}%
                  </div>
                </div>
              </div>
              <div>
                <div className="text-ink-3 text-xs mb-2">Neue Creator</div>
                <div className="flex items-end gap-6">
                  <div>
                    <div className="text-ink-4 text-[10px]">Vorheriger Monat</div>
                    <div className="text-ink-2 text-lg font-semibold tracking-tight">{monthCompare.lastCreators}</div>
                  </div>
                  <div className="text-2xl text-ink-4">→</div>
                  <div>
                    <div className="text-ink-4 text-[10px]">Dieser Monat</div>
                    <div className="text-ink-1 text-lg font-semibold tracking-tight">{monthCompare.thisCreators}</div>
                  </div>
                  <div className={`text-sm font-bold ${monthCompare.creatorChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {monthCompare.creatorChange >= 0 ? '+' : ''}{monthCompare.creatorChange}%
                  </div>
                </div>
              </div>
            </div>
          </ChartCard>

          {/* Top Postings + Top Creator */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Top Postings" subtitle="Beste ROAS" loading={chartsLoading}>
              {topPostings.length > 0 ? (
                <div className="space-y-3">
                  {topPostings.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-apple-sm bg-surface-0/60 border border-hairline-soft">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-full bg-accent-soft flex items-center justify-center text-accent text-xs font-semibold flex-shrink-0">
                          {(p._creator?.name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-ink-1 text-xs font-medium truncate">{p._creator?.name || 'Unbekannt'}</div>
                          <div className="text-ink-4 text-[10px] truncate">{p.kampagne || 'Ohne Kampagne'} · {p.buchungstyp || ''}</div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={`text-sm font-bold ${roasColor(p._roas)}`}>{p._roas}x</div>
                        <div className="text-ink-4 text-[10px]">{p._u.toLocaleString('de-DE')} €</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-ink-4 text-xs">Noch keine Postings mit ROAS</div>
              )}
            </ChartCard>

            <ChartCard title="Top Creator" subtitle="Nach Umsatz" loading={chartsLoading} right={<Link href="/creator" className="text-accent text-xs hover:underline">Alle →</Link>}>
              {topCreators.length > 0 ? (
                <div className="space-y-2">
                  {topCreators.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-apple-sm bg-surface-0/60 border border-hairline-soft">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-full bg-accent-soft flex items-center justify-center text-accent text-xs font-semibold flex-shrink-0">
                          {(c.name || '').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-ink-1 text-xs font-medium truncate">{c.name}</div>
                          <div className="text-ink-4 text-[10px] truncate">{c.ig} · {(c.ig_follower || 0).toLocaleString('de-DE')} Follower</div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-ink-1 text-xs font-semibold">{c._umsatz > 0 ? `${c._umsatz.toLocaleString('de-DE')} €` : '—'}</div>
                        <div className={`text-[10px] ${c._roas > 0 ? roasColor(c._roas) : 'text-ink-4'}`}>{c._roas > 0 ? `${c._roas}x ROAS` : '—'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-ink-4 text-xs">Noch keine Creator</div>
              )}
            </ChartCard>
          </div>

          {/* Aktivitätsfeed */}
          <ChartCard title="Aktivität" subtitle="Letzte Ereignisse" loading={chartsLoading}>
            {activities.length > 0 ? (
              <div className="space-y-2">
                {activities.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 p-2.5 rounded-apple-sm hover:bg-white/[0.02] transition-colors duration-200">
                    <div className={`w-7 h-7 rounded-apple-sm flex items-center justify-center flex-shrink-0 ${a.type === 'creator' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                      {a.type === 'creator' ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4"/><path d="M5.5 21v-2a4 4 0 0 1 4-4h5a4 4 0 0 1 4 4v2"/></svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8M12 8v8"/></svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-ink-2 text-xs font-medium truncate">{a.label}: {a.creator.name}</div>
                      {a.sub && <div className="text-ink-4 text-[10px] truncate">{a.sub}</div>}
                    </div>
                    <div className="text-ink-4 text-[10px] flex-shrink-0">{new Date(a.date).toLocaleDateString('de-DE')}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-ink-4 text-xs">Noch keine Aktivität</div>
            )}
          </ChartCard>
        </div>
      </main>
    </div>
  )
}
