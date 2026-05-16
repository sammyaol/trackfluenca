'use client'
import Link from 'next/link'
import Sidebar from '../components/Sidebar'

const creators = [
  { name: 'Sophie Müller', ig: '@sophiestyle', tt: '@sophiett', follower: 125000, tier: 'Micro', status: 'Deal', umsatz: 12750, roas: 15.0 },
  { name: 'Jana Koch', ig: '@janakoch', tt: '@janatt', follower: 18500, tier: 'Nano', status: 'Deal', umsatz: 3900, roas: 13.0 },
  { name: 'Lena Hoffmann', ig: '@lena.jewelry', tt: '', follower: 450000, tier: 'Mid-Tier', status: 'In Verhandlung', umsatz: 8800, roas: 4.0 },
  { name: 'Mia Wagner', ig: '@miafashion', tt: '@miawagner', follower: 1250000, tier: 'Macro', status: 'Kontaktiert', umsatz: 2100, roas: 1.8 },
  { name: 'Klara Becker', ig: '@klarabecker', tt: '@klaratt', follower: 3800000, tier: 'Top-Tier', status: 'Offen', umsatz: 0, roas: 0 },
]

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

const campaigns = [
  { name: 'SS25 Launch', roas: 4.2, budget: 25000, spent: 18400 },
  { name: 'AW25 Schmuck', roas: 0, budget: 18000, spent: 0 },
  { name: 'Evergreen', roas: 6.3, budget: 12000, spent: 12000 },
]

export default function Dashboard() {
  const totalUmsatz = creators.reduce((s, c) => s + c.umsatz, 0)
  const avgRoas = creators.filter(c => c.roas > 0).reduce((s, c) => s + c.roas, 0) / creators.filter(c => c.roas > 0).length
  const deals = creators.filter(c => c.status === 'Deal').length

  return (
    <div className="flex min-h-screen bg-[#0A0A0A]">
      <Sidebar />

      <main className="flex-1 md:ml-60 min-h-screen">
        {/* Top bar */}
        <div className="border-b border-white/[0.06] px-8 py-4 flex items-center justify-between bg-[#0A0A0A]/80 backdrop-blur sticky top-0 z-20">
          <div>
            <h1 className="text-white font-semibold text-lg">Dashboard</h1>
            <p className="text-gray-500 text-xs mt-0.5">Freitag, 16. Mai 2026</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.08] text-gray-400 text-xs hover:bg-white/[0.04] transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export
            </button>
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
                value: `${totalUmsatz.toLocaleString('de-DE')} €`,
                sub: 'via Promo Codes',
                color: 'text-emerald-400',
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
                trend: '+24%',
              },
              {
                label: 'Gesamt ROAS',
                value: `${avgRoas.toFixed(1)}x`,
                sub: 'Ziel: 3x',
                color: 'text-emerald-400',
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
                trend: '+12%',
              },
              {
                label: 'Total Creator',
                value: `${creators.length}`,
                sub: '+2 diesen Monat',
                color: 'text-white',
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                trend: '+3',
              },
              {
                label: 'Aktive Deals',
                value: `${deals}`,
                sub: '3 in Verhandlung',
                color: 'text-amber-400',
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
                trend: '2 neu',
              },
            ].map(m => (
              <div key={m.label} className="bg-[#141414] rounded-2xl p-5 border border-white/[0.06] hover:border-white/[0.1] transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center text-gray-400">
                    {m.icon}
                  </div>
                  <span className="text-xs text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">{m.trend}</span>
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
                  <p className="text-gray-600 text-xs mt-0.5">Performance-Übersicht</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-gray-500"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>≥3x</span>
                  <span className="flex items-center gap-1.5 text-gray-500"><span className="w-2 h-2 rounded-full bg-amber-500"></span>1-3x</span>
                  <span className="flex items-center gap-1.5 text-gray-500"><span className="w-2 h-2 rounded-full bg-gray-700"></span>—</span>
                </div>
              </div>
              <div className="flex items-end gap-3 h-36">
                {campaigns.map(c => {
                  const maxRoas = 7
                  const height = c.roas > 0 ? Math.max((c.roas / maxRoas) * 100, 8) : 4
                  const color = c.roas >= 3 ? 'bg-emerald-500' : c.roas >= 1 ? 'bg-amber-500' : 'bg-white/10'
                  return (
                    <div key={c.name} className="flex-1 flex flex-col items-center gap-2">
                      <span className={`text-xs font-medium ${c.roas >= 3 ? 'text-emerald-400' : c.roas >= 1 ? 'text-amber-400' : 'text-gray-600'}`}>
                        {c.roas > 0 ? `${c.roas}x` : '—'}
                      </span>
                      <div className="w-full flex items-end" style={{height: '100px'}}>
                        <div className={`w-full rounded-t-lg ${color} transition-all`} style={{height: `${height}%`}}></div>
                      </div>
                      <span className="text-gray-500 text-xs text-center leading-tight">{c.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Status Übersicht */}
            <div className="bg-[#141414] rounded-2xl border border-white/[0.06] p-6">
              <h2 className="text-white font-medium text-sm mb-5">Status-Übersicht</h2>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Deal', count: 2, color: 'bg-emerald-500', total: 5 },
                  { label: 'Kontaktiert', count: 1, color: 'bg-blue-500', total: 5 },
                  { label: 'In Verhandlung', count: 1, color: 'bg-amber-500', total: 5 },
                  { label: 'Offen', count: 1, color: 'bg-gray-700', total: 5 },
                ].map(s => (
                  <div key={s.label}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-gray-400 text-xs">{s.label}</span>
                      <span className="text-white text-xs font-medium">{s.count}</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                      <div className={`h-full ${s.color} rounded-full`} style={{width: `${(s.count/s.total)*100}%`}}></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-5 border-t border-white/[0.06]">
                <h3 className="text-white font-medium text-xs mb-3">Tier-Verteilung</h3>
                <div className="flex flex-col gap-2">
                  {[
                    { label: 'Top-Tier', count: 1, color: 'bg-red-500' },
                    { label: 'Macro', count: 1, color: 'bg-amber-500' },
                    { label: 'Mid-Tier', count: 1, color: 'bg-purple-500' },
                    { label: 'Micro', count: 1, color: 'bg-blue-500' },
                    { label: 'Nano', count: 1, color: 'bg-gray-500' },
                  ].map(t => (
                    <div key={t.label} className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${t.color} flex-shrink-0`}></span>
                      <span className="text-gray-500 text-xs flex-1">{t.label}</span>
                      <span className="text-gray-400 text-xs">{t.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Top Creator Table */}
          <div className="bg-[#141414] rounded-2xl border border-white/[0.06] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div>
                <h2 className="text-white font-medium text-sm">Top Creator</h2>
                <p className="text-gray-600 text-xs mt-0.5">Sortiert nach ROAS</p>
              </div>
              <Link href="/creator" className="text-[#7F77DD] text-xs hover:underline flex items-center gap-1">
                Alle ansehen
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Creator', 'Follower', 'Tier', 'Status', 'Umsatz', 'ROAS'].map(h => (
                    <th key={h} className="text-left text-xs text-gray-600 px-6 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {creators.map((c, i) => (
                  <tr key={c.name} className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${i !== creators.length - 1 ? 'border-b border-white/[0.04]' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#7F77DD]/20 flex items-center justify-center text-[#7F77DD] text-xs font-semibold flex-shrink-0">
                          {c.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium">{c.name}</div>
                          <div className="text-gray-600 text-xs">{c.ig}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{c.follower.toLocaleString('de-DE')}</td>
                    <td className="px-6 py-4"><span className={`text-xs px-2 py-1 rounded-md font-medium ${tierColor[c.tier]}`}>{c.tier}</span></td>
                    <td className="px-6 py-4"><span className={`text-xs px-2 py-1 rounded-md font-medium ${statusColor[c.status]}`}>{c.status}</span></td>
                    <td className="px-6 py-4 text-gray-300 text-sm font-medium">{c.umsatz > 0 ? `${c.umsatz.toLocaleString('de-DE')} €` : <span className="text-gray-700">—</span>}</td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-semibold ${c.roas > 0 ? roasColor(c.roas) : 'text-gray-700'}`}>
                        {c.roas > 0 ? `${c.roas}x` : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
