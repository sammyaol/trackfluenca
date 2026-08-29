'use client'
import Link from 'next/link'
import Sidebar from '../components/Sidebar'
import LoadingScreen from '../components/LoadingScreen'
import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

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

const shortLinkUrl = (code: string) => `https://kolure.trackfluenca.com/r/${code}`

export default function Tracking() {
  const [links, setLinks] = useState<any[]>([])
  const [klicksLog, setKlicksLog] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    sb.auth.getSession().then(async ({ data }) => {
      const userId = data.session?.user?.id
      if (!userId) { setLoading(false); return }
      const { data: linksData } = await sb.from('outreach_links').select('*, creators(name)').eq('user_id', userId).order('klicks', { ascending: false })
      setLinks(linksData || [])
      const { data: klicksData } = await sb.from('outreach_link_klicks').select('created_at, device').order('created_at', { ascending: true })
      setKlicksLog(klicksData || [])
      setLoading(false)
    })
  }, [])

  const stats = useMemo(() => {
    const totalClicks = links.reduce((s, l) => s + (l.klicks || 0), 0)
    const totalLinks = links.length
    const avgClicks = totalLinks > 0 ? Math.round((totalClicks / totalLinks) * 10) / 10 : 0
    const topLink = links[0]
    return { totalClicks, totalLinks, avgClicks, topLink }
  }, [links])

  const topCreators = useMemo(() => {
    const map: Record<string, { name: string; klicks: number; links: number }> = {}
    links.forEach(l => {
      const name = l.creators?.name || 'Unbekannt'
      if (!map[l.creator_id]) map[l.creator_id] = { name, klicks: 0, links: 0 }
      map[l.creator_id].klicks += l.klicks || 0
      map[l.creator_id].links += 1
    })
    return Object.values(map).sort((a, b) => b.klicks - a.klicks).slice(0, 5)
  }, [links])

  const klickVerlauf = useMemo(() => {
    const days: { date: string; value: number; label: string }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      const next = new Date(d)
      next.setDate(next.getDate() + 1)
      const count = klicksLog.filter(k => {
        const kd = new Date(k.created_at)
        return kd >= d && kd < next
      }).length
      days.push({ date: d.toISOString().split('T')[0], value: count, label: d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }) })
    }
    return days
  }, [klicksLog])

  const deviceSplit = useMemo(() => {
    const mobile = klicksLog.filter(k => k.device === 'mobile').length
    const desktop = klicksLog.filter(k => k.device === 'desktop').length
    const total = mobile + desktop
    return { mobile, desktop, total, mobilePct: total > 0 ? Math.round(mobile / total * 100) : 0, desktopPct: total > 0 ? Math.round(desktop / total * 100) : 0 }
  }, [klicksLog])

  const copyLink = async (l: any) => {
    try {
      await navigator.clipboard.writeText(shortLinkUrl(l.short_code))
      setCopiedId(l.id)
      setTimeout(() => setCopiedId(prev => prev === l.id ? null : prev), 1500)
    } catch {}
  }

  if (loading) return <LoadingScreen message="Tracking wird geladen..." />

  const maxKlick = Math.max(...klickVerlauf.map(d => d.value), 1)

  return (
    <div className="flex min-h-screen bg-surface-0">
      <Sidebar />
      <main className="flex-1 md:ml-60 min-h-screen">
        <div className="border-b border-hairline-soft px-8 py-5 flex items-center justify-between bg-surface-0/80 backdrop-blur-xl sticky top-0 z-20">
          <div>
            <h1 className="text-ink-1 font-semibold text-lg tracking-tight">Tracking</h1>
            <p className="text-ink-3 text-xs mt-0.5">Outreach-Link-Performance</p>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Gesamt-Klicks', bg: '#30D158', value: `${stats.totalClicks}`, sub: `${stats.totalLinks} aktive Links`, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 9a3 3 0 1 1 6 0c0 2-3 3-3 3"/><path d="M12 17h.01"/><circle cx="12" cy="12" r="10"/></svg> },
              { label: 'Ø Klicks / Link', bg: '#0A84FF', value: `${stats.avgClicks}`, sub: 'pro erstelltem Link', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> },
              { label: 'Top Link', bg: '#FF9F0A', value: stats.topLink ? `${stats.topLink.klicks || 0}` : '—', sub: stats.topLink ? (stats.topLink.creators?.name || 'Unbekannt') : 'Noch keine Links', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.4H22l-6 4.4 2.3 7.2L12 16.6l-6.3 4.4L8 13.8 2 9.4h7.6z"/></svg> },
              { label: 'Mobile-Anteil', bg: '#BF5AF2', value: `${deviceSplit.mobilePct}%`, sub: `${deviceSplit.total} erfasste Klicks`, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg> },
            ].map(m => (
              <div key={m.label} className="bg-surface-2/70 backdrop-blur-xl rounded-apple-lg p-5 border border-hairline hover:border-white/[0.12] transition-colors duration-200 ease-apple shadow-apple-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-apple-sm flex items-center justify-center shadow-apple-sm" style={{ background: m.bg }}>{m.icon}</div>
                </div>
                <div className="text-2xl font-semibold tracking-tight text-ink-1 mb-1">{m.value}</div>
                <div className="text-ink-3 text-xs font-medium">{m.label}</div>
                <div className="text-ink-4 text-xs mt-0.5">{m.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ChartCard title="Klick-Verlauf" subtitle="Letzte 30 Tage" loading={false}>
                <div className="relative h-40">
                  <svg viewBox="0 0 600 160" preserveAspectRatio="none" className="w-full h-full">
                    <defs>
                      <linearGradient id="gradientKlicks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0A84FF" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#0A84FF" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    {klickVerlauf.map((d, i) => {
                      if (i >= klickVerlauf.length - 1) return null
                      const x = (i / (klickVerlauf.length - 1)) * 600
                      const y = 160 - (d.value / maxKlick) * 140
                      const nx = ((i + 1) / (klickVerlauf.length - 1)) * 600
                      const ny = 160 - (klickVerlauf[i + 1].value / maxKlick) * 140
                      return <line key={i} x1={x} y1={y} x2={nx} y2={ny} stroke="#0A84FF" strokeWidth="2"/>
                    })}
                    <path d={`M 0 160 ${klickVerlauf.map((d, i) => {
                      const x = (i / (klickVerlauf.length - 1)) * 600
                      const y = 160 - (d.value / maxKlick) * 140
                      return `L ${x} ${y}`
                    }).join(' ')} L 600 160 Z`} fill="url(#gradientKlicks)"/>
                  </svg>
                </div>
                <div className="flex justify-between text-xs text-ink-4 mt-2">
                  <span>{klickVerlauf[0]?.label}</span>
                  <span>{klickVerlauf[Math.floor(klickVerlauf.length / 2)]?.label}</span>
                  <span>{klickVerlauf[klickVerlauf.length - 1]?.label}</span>
                </div>
              </ChartCard>
            </div>

            <ChartCard title="Top Creator" subtitle="Nach Klicks" loading={false}>
              {topCreators.length > 0 ? (
                <div className="space-y-3">
                  {topCreators.map((c, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="text-ink-2 text-xs font-medium truncate">{c.name}</div>
                        <div className="text-ink-4 text-[10px]">{c.links} Link{c.links === 1 ? '' : 's'}</div>
                      </div>
                      <div className="text-ink-1 text-sm font-semibold flex-shrink-0">{c.klicks}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-ink-4 text-xs">Noch keine Klicks</div>
              )}
            </ChartCard>
          </div>

          <ChartCard title="Alle Outreach-Links" subtitle={`${links.length} Links`} loading={false}>
            {links.length === 0 ? (
              <div className="h-24 flex items-center justify-center text-ink-4 text-xs">Noch keine Outreach-Links erstellt</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-ink-4 text-left border-b border-hairline-soft">
                      <th className="pb-2 font-medium">Creator</th>
                      <th className="pb-2 font-medium">Link</th>
                      <th className="pb-2 font-medium">Ziel</th>
                      <th className="pb-2 font-medium">Rabattcode</th>
                      <th className="pb-2 font-medium text-right">Klicks</th>
                      <th className="pb-2 font-medium">Erstellt</th>
                      <th className="pb-2 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {links.map(l => (
                      <tr key={l.id} className="border-b border-hairline-soft/50 hover:bg-white/[0.02]">
                        <td className="py-2.5">
                          <Link href={`/outreach?creator=${l.creator_id}`} className="text-ink-1 hover:text-accent transition-colors">{l.creators?.name || 'Unbekannt'}</Link>
                        </td>
                        <td className="py-2.5 font-mono text-ink-3">{l.short_code}</td>
                        <td className="py-2.5 text-ink-3 max-w-[220px] truncate">{l.ziel_url}</td>
                        <td className="py-2.5 text-ink-3">{l.rabatt_code || '—'}</td>
                        <td className="py-2.5 text-ink-1 font-semibold text-right">{l.klicks || 0}</td>
                        <td className="py-2.5 text-ink-4">{new Date(l.created_at).toLocaleDateString('de-DE')}</td>
                        <td className="py-2.5 text-right">
                          <button onClick={() => copyLink(l)} className="text-[11px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-ink-2">{copiedId === l.id ? '✓' : 'Kopieren'}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ChartCard>
        </div>
      </main>
    </div>
  )
}
