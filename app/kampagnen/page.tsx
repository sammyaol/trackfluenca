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

const kampagnen = [
  { name: 'SS25 Launch', status: 'Aktiv', start: '01.05.2026', end: '31.07.2026', creator: 8, budget: 25000, ausgegeben: 18400, umsatz: 77280, roas: 4.2 },
  { name: 'AW25 Schmuck', status: 'Geplant', start: '01.09.2026', end: '30.11.2026', creator: 5, budget: 18000, ausgegeben: 0, umsatz: 0, roas: 0 },
  { name: 'Black Friday 2026', status: 'Geplant', start: '20.11.2026', end: '30.11.2026', creator: 3, budget: 35000, ausgegeben: 0, umsatz: 0, roas: 0 },
  { name: 'Evergreen', status: 'Abgeschlossen', start: '01.01.2026', end: '30.04.2026', creator: 4, budget: 12000, ausgegeben: 12000, umsatz: 75600, roas: 6.3 },
]

const statusColor: Record<string, string> = {
  'Aktiv': 'bg-green-900 text-green-300',
  'Geplant': 'bg-blue-900 text-blue-300',
  'Abgeschlossen': 'bg-gray-800 text-gray-400',
}

const roasColor = (r: number) => r >= 3 ? 'text-green-400' : r >= 1 ? 'text-amber-400' : 'text-gray-500'

export default function Kampagnen() {
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<typeof kampagnen[0] | null>(null)

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
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${item.href === '/kampagnen' ? 'bg-[#7F77DD]/20 text-[#7F77DD]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-xl font-medium">Kampagnen</h1>
            <p className="text-gray-500 text-sm mt-1">{kampagnen.length} Kampagnen total</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl bg-[#7F77DD] text-white text-sm hover:bg-[#534AB7]">
            + Kampagne erstellen
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Gesamt Budget', value: `${kampagnen.reduce((s,k) => s+k.budget,0).toLocaleString('de-DE')} €` },
            { label: 'Gesamt Umsatz', value: `${kampagnen.reduce((s,k) => s+k.umsatz,0).toLocaleString('de-DE')} €`, color: 'text-green-400' },
            { label: 'Aktive Kampagnen', value: kampagnen.filter(k => k.status==='Aktiv').length, color: 'text-blue-400' },
            { label: 'Ø ROAS', value: `${(kampagnen.filter(k=>k.roas>0).reduce((s,k)=>s+k.roas,0)/kampagnen.filter(k=>k.roas>0).length).toFixed(1)}x`, color: 'text-green-400' },
          ].map(m => (
            <div key={m.label} className="bg-[#1A1A1A] rounded-xl p-4 border border-white/5">
              <div className="text-gray-400 text-xs mb-1">{m.label}</div>
              <div className={`text-xl font-medium ${m.color || 'text-white'}`}>{m.value}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          {kampagnen.map(k => (
            <div key={k.name} onClick={() => setSelected(k)}
              className="bg-[#1A1A1A] rounded-xl border border-white/5 p-5 hover:border-white/10 cursor-pointer transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-white font-medium">{k.name}</h2>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColor[k.status]}`}>{k.status}</span>
                  </div>
                  <div className="text-gray-500 text-xs mt-1">{k.start} – {k.end} · {k.creator} Creator</div>
                </div>
                <div className="text-right">
                  <div className={`text-xl font-medium ${k.roas > 0 ? roasColor(k.roas) : 'text-gray-600'}`}>
                    {k.roas > 0 ? `${k.roas}x ROAS` : '—'}
                  </div>
                  <div className="text-gray-500 text-xs">{k.umsatz > 0 ? `${k.umsatz.toLocaleString('de-DE')} € Umsatz` : 'noch kein Umsatz'}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-[#0E0E0E] rounded-lg p-3">
                  <div className="text-gray-500 text-xs mb-1">Budget</div>
                  <div className="text-white text-sm font-medium">{k.budget.toLocaleString('de-DE')} €</div>
                </div>
                <div className="bg-[#0E0E0E] rounded-lg p-3">
                  <div className="text-gray-500 text-xs mb-1">Ausgegeben</div>
                  <div className="text-white text-sm font-medium">{k.ausgegeben.toLocaleString('de-DE')} €</div>
                </div>
                <div className="bg-[#0E0E0E] rounded-lg p-3">
                  <div className="text-gray-500 text-xs mb-1">Creator</div>
                  <div className="text-white text-sm font-medium">{k.creator}</div>
                </div>
              </div>

              {k.budget > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Budget verbraucht</span>
                    <span>{Math.round(k.ausgegeben/k.budget*100)}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${k.ausgegeben/k.budget > 0.8 ? 'bg-amber-400' : 'bg-[#7F77DD]'}`}
                      style={{width: `${Math.min(k.ausgegeben/k.budget*100, 100)}%`}}></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
            <div className="bg-[#1A1A1A] rounded-2xl p-6 w-full max-w-md border border-white/10" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-white font-medium">Neue Kampagne</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white text-xl">×</button>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Kampagnen-Name', placeholder: 'SS25 Launch' },
                  { label: 'Budget €', placeholder: '25000' },
                  { label: 'Startdatum', placeholder: '01.05.2026' },
                  { label: 'Enddatum', placeholder: '31.07.2026' },
                ].map(f => (
                  <div key={f.label}>
                    <label className="text-gray-400 text-xs mb-1 block">{f.label}</label>
                    <input placeholder={f.placeholder}
                      className="w-full bg-[#0E0E0E] border border-white/10 rounded-xl px-4 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#7F77DD]" />
                  </div>
                ))}
                <button className="w-full py-3 rounded-xl bg-[#7F77DD] text-white text-sm hover:bg-[#534AB7] mt-2">
                  Kampagne erstellen
                </button>
              </div>
            </div>
          </div>
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