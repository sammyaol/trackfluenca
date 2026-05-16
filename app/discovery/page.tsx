'use client'
import { useState } from 'react'
import Link from 'next/link'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/discovery', label: 'Discovery', icon: '◎' },
  { href: '/creator', label: 'Creator', icon: '👤' },
  { href: '/outreach', label: 'Outreach', icon: '✉' },
  { href: '/kampagnen', label: 'Kampagnen', icon: '📢' },
  { href: '/affiliate', label: 'Affiliate', icon: '%' },
  { href: '/einstellungen', label: 'Einstellungen', icon: '⚙' },
]

const results = [
  { name: 'Sophie Müller', ig: '@sophiestyle', tt: '@sophiett', follower: 125000, tier: 'Micro', er: 4.8, views: 48200, wert: 1250, match: 97, nischen: ['Schmuck', 'Fashion', 'Lifestyle'], grund: 'Perfekter Fit: Schmuck + minimalistisch, Zielgruppe 25–34 weiblich, DE' },
  { name: 'Lena Hoffmann', ig: '@lena.jewelry', tt: '', follower: 450000, tier: 'Mid-Tier', er: 3.2, views: 0, wert: 4500, match: 91, nischen: ['Schmuck', 'Lifestyle'], grund: 'Starker Schmuck-Fokus, hohe Reichweite, Zielgruppe passt' },
  { name: 'Nina Krause', ig: '@ninakrause', tt: '@ninatiktok', follower: 67000, tier: 'Micro', er: 5.1, views: 92000, wert: 670, match: 84, nischen: ['Fashion', 'Beauty', 'Lifestyle'], grund: 'Hohe TT Views, starke Engagement Rate, guter Stil-Fit' },
  { name: 'Julia Weber', ig: '@juliaweber', tt: '@juliattt', follower: 210000, tier: 'Mid-Tier', er: 2.1, views: 34000, wert: 2100, match: 79, nischen: ['Lifestyle', 'Fashion'], grund: 'Gute Reichweite, mittlere Engagement Rate' },
  { name: 'Anna Schmidt', ig: '@annaschmidt', tt: '@annatt', follower: 38000, tier: 'Nano', er: 6.4, views: 145000, wert: 380, match: 74, nischen: ['Lifestyle', 'Beauty'], grund: 'Sehr hohe TT Views, starke ER, günstige Zusammenarbeit' },
  { name: 'Maria König', ig: '@mariakoenig', tt: '', follower: 89000, tier: 'Micro', er: 2.8, views: 0, wert: 890, match: 68, nischen: ['Fashion', 'Lifestyle'], grund: 'Solide Reichweite, eher genereller Content' },
]

const tierColor: Record<string, string> = {
  'Nano': 'bg-gray-800 text-gray-300',
  'Micro': 'bg-blue-900 text-blue-300',
  'Mid-Tier': 'bg-purple-900 text-purple-300',
  'Macro': 'bg-amber-900 text-amber-300',
  'Top-Tier': 'bg-red-900 text-red-300',
}

const matchColor = (m: number) => m >= 90 ? 'text-green-400' : m >= 75 ? 'text-blue-400' : 'text-amber-400'
const matchBg = (m: number) => m >= 90 ? 'bg-green-400' : m >= 75 ? 'bg-blue-400' : 'bg-amber-400'

export default function Discovery() {
  const [branche, setBranche] = useState('Schmuck & Accessoires')
  const [plattform, setPlattform] = useState('Instagram + TikTok')
  const [nischen, setNischen] = useState(['Schmuck', 'Fashion', 'Lifestyle'])
  const [searched, setSearched] = useState(false)

  const toggleNische = (n: string) => {
    setNischen(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n])
  }

  const allNischen = ['Schmuck', 'Fashion', 'Beauty', 'Lifestyle', 'Fitness', 'Travel', 'Food', 'Luxury']

  return (
    <div className="flex min-h-screen bg-[#0E0E0E]">
      <aside className="hidden md:flex w-52 flex-col bg-[#111] border-r border-white/5 fixed h-full">
        <div className="flex items-center gap-2 px-4 py-5 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-[#2C1F6B] flex items-center justify-center text-xs">⟆</div>
          <span className="text-white font-bold text-sm">Track<span className="text-[#7F77DD] font-normal">fluenca</span></span>
        </div>
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${item.href === '/discovery' ? 'bg-[#7F77DD]/20 text-[#7F77DD]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
              <span>{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#2C1F6B] flex items-center justify-center text-xs text-purple-300">KO</div>
            <div>
              <div className="text-white text-xs font-medium">Kolure</div>
              <div className="text-gray-500 text-xs">Pro Plan</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 md:ml-52 p-4 md:p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-white text-xl font-medium">Discovery</h1>
            <span className="text-xs px-2 py-1 rounded-full bg-[#2C1F6B] text-[#7F77DD]">KI-gestützt</span>
          </div>
          <p className="text-gray-500 text-sm">Finde passende Creator basierend auf deiner Marke</p>
        </div>

        <div className="bg-[#1A1A1A] rounded-xl border border-white/5 p-5 mb-6">
          <h2 className="text-white text-sm font-medium mb-4">Marken-Profil</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Branche</label>
              <select value={branche} onChange={e => setBranche(e.target.value)}
                className="w-full bg-[#0E0E0E] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#7F77DD]">
                {['Schmuck & Accessoires','Fashion & Kleidung','Beauty & Kosmetik','Lifestyle','Fitness'].map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Zielgruppe</label>
              <select className="w-full bg-[#0E0E0E] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#7F77DD]">
                {['25–34 Jahre weiblich','18–24 Jahre weiblich','18–35 gemischt','35–44 weiblich'].map(z => <option key={z}>{z}</option>)}
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Plattform</label>
              <select value={plattform} onChange={e => setPlattform(e.target.value)}
                className="w-full bg-[#0E0E0E] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#7F77DD]">
                {['Instagram + TikTok','Nur Instagram','Nur TikTok'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="text-gray-400 text-xs mb-2 block">Nischen</label>
            <div className="flex flex-wrap gap-2">
              {allNischen.map(n => (
                <button key={n} onClick={() => toggleNische(n)}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${nischen.includes(n) ? 'bg-[#7F77DD]/20 border-[#7F77DD] text-[#7F77DD]' : 'border-white/10 text-gray-400 hover:border-white/30'}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => setSearched(true)}
            className="px-6 py-2 rounded-xl bg-[#7F77DD] text-white text-sm hover:bg-[#534AB7] transition-colors">
            Creator suchen
          </button>
        </div>

        {searched && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-white text-sm font-medium">{results.length} Creator gefunden</span>
                <span className="text-gray-500 text-xs ml-2">sortiert nach Match-Score</span>
              </div>
              <select className="bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-gray-400 text-xs focus:outline-none">
                <option>Match-Score</option>
                <option>Follower</option>
                <option>Engagement Rate</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map(c => (
                <div key={c.name} className={`bg-[#1A1A1A] rounded-xl border p-5 hover:border-[#7F77DD]/50 transition-colors ${c.match >= 90 ? 'border-blue-500/30' : 'border-white/5'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#2C1F6B] flex items-center justify-center text-purple-300 font-medium text-sm">
                        {c.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="text-white font-medium text-sm">{c.name}</div>
                        <div className="text-gray-400 text-xs">{c.ig}{c.tt ? ` · ${c.tt}` : ''}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${matchColor(c.match)}`}>{c.match}% Match</div>
                      <div className="w-16 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                        <div className={`h-full rounded-full ${matchBg(c.match)}`} style={{width: `${c.match}%`}}></div>
                      </div>
                    </div>
                  </div>

                  {c.match >= 85 && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2 mb-3">
                      <p className="text-blue-300 text-xs">✦ {c.grund}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-[#0E0E0E] rounded-lg p-2">
                      <div className="text-gray-500 text-xs">Follower</div>
                      <div className="text-white text-sm font-medium">{c.follower.toLocaleString('de-DE')}</div>
                    </div>
                    <div className="bg-[#0E0E0E] rounded-lg p-2">
                      <div className="text-gray-500 text-xs">Engagement</div>
                      <div className={`text-sm font-medium ${c.er >= 4 ? 'text-green-400' : c.er >= 2 ? 'text-amber-400' : 'text-red-400'}`}>{c.er}%</div>
                    </div>
                    {c.views > 0 && (
                      <div className="bg-[#0E0E0E] rounded-lg p-2">
                        <div className="text-gray-500 text-xs">TT Ø Views</div>
                        <div className="text-white text-sm font-medium">{c.views.toLocaleString('de-DE')}</div>
                      </div>
                    )}
                    <div className="bg-[#0E0E0E] rounded-lg p-2">
                      <div className="text-gray-500 text-xs">Post-Wert</div>
                      <div className="text-white text-sm font-medium">~{c.wert.toLocaleString('de-DE')} €</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {c.nischen.map(n => (
                      <span key={n} className="text-xs px-2 py-0.5 rounded-full bg-[#2C1F6B] text-purple-300">{n}</span>
                    ))}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${tierColor[c.tier]}`}>{c.tier}</span>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 py-2 rounded-lg bg-[#7F77DD] text-white text-xs hover:bg-[#534AB7] transition-colors">
                      + Hinzufügen
                    </button>
                    <button className="flex-1 py-2 rounded-lg border border-white/10 text-gray-400 text-xs hover:bg-white/5 transition-colors">
                      Anfragen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#111] border-t border-white/10 flex justify-around py-2 z-40">
          {navItems.slice(0, 5).map(item => (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 text-gray-500 hover:text-white px-3 py-1">
              <span className="text-lg">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </Link>
          ))}
        </nav>
      </main>
    </div>
  )
}