'use client'
import { useState } from 'react'
import Sidebar from '../components/Sidebar'

const results = [
  { name: 'Sophie Müller', ig: '@sophiestyle', tt: '@sophiett', igF: 125000, ttF: 98000, tier: 'Micro', er: 4.8, views: 48200, wert: 1250, match: 97, nischen: ['Schmuck', 'Fashion', 'Lifestyle'], grund: 'Perfekter Fit: Schmuck + minimalistisch, Zielgruppe 25–34 weiblich, DE', added: false },
  { name: 'Lena Hoffmann', ig: '@lena.jewelry', tt: '', igF: 450000, ttF: 0, tier: 'Mid-Tier', er: 3.2, views: 0, wert: 4500, match: 91, nischen: ['Schmuck', 'Lifestyle'], grund: 'Starker Schmuck-Fokus, hohe Reichweite, Zielgruppe passt', added: false },
  { name: 'Nina Krause', ig: '@ninakrause', tt: '@ninatiktok', igF: 67000, ttF: 92000, tier: 'Micro', er: 5.1, views: 92000, wert: 670, match: 84, nischen: ['Fashion', 'Beauty', 'Lifestyle'], grund: 'Hohe TT Views, starke Engagement Rate', added: false },
  { name: 'Julia Weber', ig: '@juliaweber', tt: '@juliattt', igF: 210000, ttF: 34000, tier: 'Mid-Tier', er: 2.1, views: 34000, wert: 2100, match: 79, nischen: ['Lifestyle', 'Fashion'], grund: 'Gute Reichweite, mittlere Engagement Rate', added: false },
  { name: 'Anna Schmidt', ig: '@annaschmidt', tt: '@annatt', igF: 38000, ttF: 145000, tier: 'Nano', er: 6.4, views: 145000, wert: 380, match: 74, nischen: ['Lifestyle', 'Beauty'], grund: 'Sehr hohe TT Views, starke ER', added: false },
  { name: 'Maria König', ig: '@mariakoenig', tt: '', igF: 89000, ttF: 0, tier: 'Micro', er: 2.8, views: 0, wert: 890, match: 68, nischen: ['Fashion', 'Lifestyle'], grund: 'Solide Reichweite, eher genereller Content', added: false },
]

const tierStyle: Record<string, string> = {
  'Nano': 'text-gray-400 bg-gray-800 border border-gray-700/50',
  'Micro': 'text-blue-400 bg-blue-950 border border-blue-800/30',
  'Mid-Tier': 'text-purple-400 bg-purple-950 border border-purple-800/30',
  'Macro': 'text-amber-400 bg-amber-950 border border-amber-800/30',
  'Top-Tier': 'text-red-400 bg-red-950 border border-red-800/30',
}

const avatarColors = [
  'from-violet-500 to-purple-700',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-indigo-500 to-blue-600',
]

function MatchRing({ match }: { match: number }) {
  const r = 22
  const circ = 2 * Math.PI * r
  const dash = (match / 100) * circ
  const color = match >= 90 ? '#10b981' : match >= 75 ? '#3b82f6' : '#f59e0b'
  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="3.5"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span style={{ color }} className="text-xs font-bold leading-none">{match}%</span>
      </div>
    </div>
  )
}

function MiniBar({ value, max, color }: { value: number, max: number, color: string }) {
  return (
    <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden w-full">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min((value / max) * 100, 100)}%` }} />
    </div>
  )
}

export default function Discovery() {
  const [searched, setSearched] = useState(false)
  const [nischen, setNischen] = useState(['Schmuck', 'Fashion', 'Lifestyle'])
  const [added, setAdded] = useState<string[]>([])
  const allNischen = ['Schmuck', 'Fashion', 'Beauty', 'Lifestyle', 'Fitness', 'Travel', 'Food', 'Luxury']

  return (
    <div className="flex min-h-screen bg-[#0A0A0A]">
      <Sidebar />
      <main className="flex-1 md:ml-60 min-h-screen">

        {/* Topbar */}
        <div className="border-b border-white/[0.06] px-8 py-4 flex items-center justify-between bg-[#0A0A0A]/80 backdrop-blur sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-white font-semibold text-lg">Discovery</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#7F77DD]/20 text-[#7F77DD] border border-[#7F77DD]/20 font-medium">KI-gestützt</span>
            </div>
            <p className="text-gray-600 text-xs mt-0.5">Finde passende Creator basierend auf deinem Markenprofil</p>
          </div>
          {searched && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="text-emerald-400 font-medium">{results.length} Matches</span>
              <span>·</span>
              <span>{added.length} hinzugefügt</span>
            </div>
          )}
        </div>

        <div className="p-8">
          {/* Filter Card */}
          <div className="bg-[#141414] rounded-2xl border border-white/[0.06] p-6 mb-8">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-6 h-6 rounded-lg bg-[#7F77DD]/20 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7F77DD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
              </div>
              <h2 className="text-white text-sm font-semibold">Dein Markenprofil</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
              {[
                { label: 'Branche', options: ['Schmuck & Accessoires', 'Fashion & Kleidung', 'Beauty & Kosmetik', 'Lifestyle', 'Fitness'] },
                { label: 'Zielgruppe', options: ['25–34 Jahre weiblich', '18–24 Jahre weiblich', '18–35 gemischt', '35–44 weiblich'] },
                { label: 'Plattform', options: ['Instagram + TikTok', 'Nur Instagram', 'Nur TikTok'] },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-gray-500 text-xs mb-1.5 block font-medium">{f.label}</label>
                  <select className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#7F77DD]/40 transition-colors">
                    {f.options.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
              <div>
                <label className="text-gray-500 text-xs mb-1.5 block font-medium">Follower von</label>
                <select className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none">
                  {['10.000', '50.000', '100.000', '500.000'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-500 text-xs mb-1.5 block font-medium">Follower bis</label>
                <select className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none">
                  {['100.000', '500.000', '1.000.000', 'Unbegrenzt'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-500 text-xs mb-1.5 block font-medium">Preissegment</label>
                <select className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none">
                  {['Mid-Range (50–150€)', 'Günstig (<50€)', 'Premium (150–500€)', 'Luxury (500€+)'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>

            <div className="mb-5">
              <label className="text-gray-500 text-xs mb-2 block font-medium">Nischen</label>
              <div className="flex flex-wrap gap-2">
                {allNischen.map(n => (
                  <button key={n} onClick={() => setNischen(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n])}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${nischen.includes(n) ? 'bg-[#7F77DD]/20 border-[#7F77DD]/40 text-[#7F77DD]' : 'border-white/[0.08] text-gray-500 hover:border-white/20 hover:text-gray-300'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setSearched(true)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#7F77DD] text-white text-sm hover:bg-[#534AB7] transition-colors font-medium">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              Creator suchen
            </button>
          </div>

          {searched && (
            <>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <h2 className="text-white font-semibold">{results.length} Creator gefunden</h2>
                  <span className="text-gray-600 text-xs">sortiert nach Match-Score</span>
                </div>
                <select className="bg-[#141414] border border-white/[0.08] rounded-xl px-3 py-2 text-gray-400 text-xs focus:outline-none">
                  <option>Match-Score</option>
                  <option>Follower</option>
                  <option>Engagement Rate</option>
                  <option>Post-Wert</option>
                </select>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {results.map((c, idx) => {
                  const isAdded = added.includes(c.name)
                  return (
                    <div key={c.name} className={`bg-[#141414] rounded-2xl border transition-all ${c.match >= 90 ? 'border-emerald-500/20' : c.match >= 80 ? 'border-blue-500/15' : 'border-white/[0.06]'} hover:border-white/[0.12]`}>
                      {/* Header */}
                      <div className="p-5 pb-4">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                            {c.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-white font-semibold text-sm">{c.name}</span>
                              {c.match >= 90 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium">Top Match</span>}
                            </div>
                            <div className="text-gray-600 text-xs">{c.ig}{c.tt ? ` · ${c.tt}` : ''}</div>
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${tierStyle[c.tier]}`}>{c.tier}</span>
                              {c.nischen.map(n => (
                                <span key={n} className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.05] text-gray-500 border border-white/[0.06]">{n}</span>
                              ))}
                            </div>
                          </div>
                          <MatchRing match={c.match} />
                        </div>

                        {c.match >= 85 && (
                          <div className="mt-3 bg-white/[0.03] rounded-xl px-3 py-2.5 border border-white/[0.06]">
                            <p className="text-gray-400 text-xs leading-relaxed">✦ {c.grund}</p>
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="px-5 pb-4 grid grid-cols-2 gap-3">
                        <div className="bg-[#0A0A0A] rounded-xl p-3 border border-white/[0.06]">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-600 text-[10px] font-medium uppercase tracking-wider">IG Follower</span>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f472b6" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/></svg>
                          </div>
                          <div className="text-white text-sm font-semibold mb-1.5">{c.igF.toLocaleString('de-DE')}</div>
                          <MiniBar value={c.igF} max={500000} color="bg-pink-500" />
                        </div>
                        <div className="bg-[#0A0A0A] rounded-xl p-3 border border-white/[0.06]">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-600 text-[10px] font-medium uppercase tracking-wider">Engagement</span>
                            <span className={`text-[10px] font-semibold ${c.er >= 4 ? 'text-emerald-400' : c.er >= 2 ? 'text-amber-400' : 'text-red-400'}`}>{c.er >= 4 ? 'Hoch' : c.er >= 2 ? 'Mittel' : 'Niedrig'}</span>
                          </div>
                          <div className={`text-sm font-semibold mb-1.5 ${c.er >= 4 ? 'text-emerald-400' : c.er >= 2 ? 'text-amber-400' : 'text-red-400'}`}>{c.er}%</div>
                          <MiniBar value={c.er} max={10} color={c.er >= 4 ? 'bg-emerald-500' : c.er >= 2 ? 'bg-amber-500' : 'bg-red-500'} />
                        </div>
                        {c.views > 0 && (
                          <div className="bg-[#0A0A0A] rounded-xl p-3 border border-white/[0.06]">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-gray-600 text-[10px] font-medium uppercase tracking-wider">TT Ø Views</span>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9a8.16 8.16 0 0 0 4.77 1.52V7.07a4.85 4.85 0 0 1-1-.38z"/></svg>
                            </div>
                            <div className="text-white text-sm font-semibold mb-1.5">{c.views.toLocaleString('de-DE')}</div>
                            <MiniBar value={c.views} max={200000} color="bg-white/40" />
                          </div>
                        )}
                        <div className="bg-[#0A0A0A] rounded-xl p-3 border border-white/[0.06]">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-600 text-[10px] font-medium uppercase tracking-wider">Post-Wert</span>
                            <span className="text-[10px] text-gray-600">~</span>
                          </div>
                          <div className="text-[#7F77DD] text-sm font-semibold mb-1.5">{c.wert.toLocaleString('de-DE')} €</div>
                          <MiniBar value={c.wert} max={5000} color="bg-[#7F77DD]" />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="px-5 pb-5 flex gap-2">
                        <button
                          onClick={() => setAdded(prev => isAdded ? prev.filter(n => n !== c.name) : [...prev, c.name])}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${isAdded ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-[#7F77DD] text-white hover:bg-[#534AB7]'}`}>
                          {isAdded ? (
                            <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Hinzugefügt</>
                          ) : (
                            <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Hinzufügen</>
                          )}
                        </button>
                        <button className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-gray-400 text-xs hover:bg-white/[0.04] hover:text-white transition-all font-medium flex items-center justify-center gap-1.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                          Anfragen
                        </button>
                        <button className="w-10 h-10 rounded-xl border border-white/[0.08] text-gray-600 hover:text-white hover:bg-white/[0.04] transition-all flex items-center justify-center flex-shrink-0">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}