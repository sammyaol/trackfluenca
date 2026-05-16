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

const affiliates = [
  { name: 'Sophie Müller', initials: 'SM', code: 'SOPHIE15', provision: 15, klicks: 2840, umsatz: 12750, verdient: 1912, status: 'Aktiv', ausgezahlt: 950 },
  { name: 'Jana Koch', initials: 'JK', code: 'JANA10', provision: 15, klicks: 890, umsatz: 3900, verdient: 585, status: 'Aktiv', ausgezahlt: 285 },
  { name: 'Lena Hoffmann', initials: 'LH', code: 'LENA20', provision: 12, klicks: 1420, umsatz: 8800, verdient: 1056, status: 'Ausstehend', ausgezahlt: 0 },
  { name: 'Mia Wagner', initials: 'MW', code: '', provision: 10, klicks: 0, umsatz: 0, verdient: 0, status: 'Eingeladen', ausgezahlt: 0 },
]

const statusColor: Record<string, string> = {
  'Aktiv': 'bg-green-900 text-green-300',
  'Ausstehend': 'bg-amber-900 text-amber-300',
  'Eingeladen': 'bg-blue-900 text-blue-300',
}

export default function Affiliate() {
  const [view, setView] = useState<'brand' | 'creator'>('brand')
  const [portalCreator, setPortalCreator] = useState(affiliates[0])

  const totalVerdient = affiliates.reduce((s, a) => s + a.verdient, 0)
  const totalUmsatz = affiliates.reduce((s, a) => s + a.umsatz, 0)
  const totalKlicks = affiliates.reduce((s, a) => s + a.klicks, 0)

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
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${item.href === '/affiliate' ? 'bg-[#7F77DD]/20 text-[#7F77DD]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
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
            <h1 className="text-white text-xl font-medium">Affiliate</h1>
            <p className="text-gray-500 text-sm mt-1">Provisionen, Auszahlungen, Creator-Portal</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-[#1A1A1A] rounded-xl p-1 border border-white/5">
              <button onClick={() => setView('brand')}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${view === 'brand' ? 'bg-[#7F77DD] text-white' : 'text-gray-400 hover:text-white'}`}>
                Brand-Ansicht
              </button>
              <button onClick={() => setView('creator')}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${view === 'creator' ? 'bg-[#7F77DD] text-white' : 'text-gray-400 hover:text-white'}`}>
                Creator-Portal
              </button>
            </div>
          </div>
        </div>

        {view === 'brand' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Aktive Affiliates', value: affiliates.filter(a => a.status === 'Aktiv').length },
                { label: 'Offene Provisionen', value: `${totalVerdient.toLocaleString('de-DE')} €`, color: 'text-amber-400' },
                { label: 'Gesamt Umsatz', value: `${totalUmsatz.toLocaleString('de-DE')} €`, color: 'text-green-400' },
                { label: 'Gesamt Klicks', value: totalKlicks.toLocaleString('de-DE') },
              ].map(m => (
                <div key={m.label} className="bg-[#1A1A1A] rounded-xl p-4 border border-white/5">
                  <div className="text-gray-400 text-xs mb-1">{m.label}</div>
                  <div className={`text-xl font-medium ${m.color || 'text-white'}`}>{m.value}</div>
                </div>
              ))}
            </div>

            <div className="bg-[#1A1A1A] rounded-xl border border-white/5 overflow-hidden mb-6">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <h2 className="text-white text-sm font-medium">Creator Übersicht</h2>
                <button className="px-3 py-1.5 rounded-lg bg-[#7F77DD] text-white text-xs hover:bg-[#534AB7]">
                  + Creator einladen
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      {['Creator','Code','Provision','Klicks','Umsatz','Verdient','Status','Aktion'].map(h => (
                        <th key={h} className="text-left text-xs text-gray-500 px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {affiliates.map(a => (
                      <tr key={a.name} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#2C1F6B] flex items-center justify-center text-purple-300 text-xs font-medium">{a.initials}</div>
                            <span className="text-white text-sm">{a.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-purple-400 text-xs">{a.code || '—'}</td>
                        <td className="px-4 py-3 text-gray-300 text-sm">{a.provision}%</td>
                        <td className="px-4 py-3 text-gray-300 text-sm">{a.klicks.toLocaleString('de-DE')}</td>
                        <td className="px-4 py-3 text-green-400 text-sm font-medium">{a.umsatz > 0 ? `${a.umsatz.toLocaleString('de-DE')} €` : '—'}</td>
                        <td className="px-4 py-3 text-amber-400 text-sm font-medium">{a.verdient > 0 ? `${a.verdient.toLocaleString('de-DE')} €` : '—'}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${statusColor[a.status]}`}>{a.status}</span></td>
                        <td className="px-4 py-3">
                          {a.status === 'Ausstehend' ? (
                            <button onClick={() => { setPortalCreator(a); setView('creator') }}
                              className="px-3 py-1 rounded-lg bg-green-700 text-green-100 text-xs hover:bg-green-600">
                              Auszahlen
                            </button>
                          ) : a.status === 'Aktiv' ? (
                            <button onClick={() => { setPortalCreator(a); setView('creator') }}
                              className="px-3 py-1 rounded-lg border border-white/10 text-gray-400 text-xs hover:bg-white/5">
                              Portal ansehen
                            </button>
                          ) : (
                            <button className="px-3 py-1 rounded-lg border border-white/10 text-gray-400 text-xs hover:bg-white/5">
                              Erinnern
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#1A1A1A] rounded-xl border border-white/5 p-5">
                <h2 className="text-white text-sm font-medium mb-4">Provisions-Stufen</h2>
                {[
                  { tier: 'Nano', range: '<10k Follower', prov: '15%', color: 'bg-gray-800 text-gray-300' },
                  { tier: 'Micro', range: '10–50k', prov: '15%', color: 'bg-blue-900 text-blue-300' },
                  { tier: 'Mid-Tier', range: '50–500k', prov: '12%', color: 'bg-purple-900 text-purple-300' },
                  { tier: 'Macro', range: '500k–1M', prov: '10%', color: 'bg-amber-900 text-amber-300' },
                  { tier: 'Top-Tier', range: '>1M', prov: '8%', color: 'bg-red-900 text-red-300' },
                ].map(t => (
                  <div key={t.tier} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${t.color}`}>{t.tier}</span>
                      <span className="text-gray-500 text-xs">{t.range}</span>
                    </div>
                    <span className="text-white text-sm font-medium">{t.prov}</span>
                  </div>
                ))}
              </div>

              <div className="bg-[#1A1A1A] rounded-xl border border-white/5 p-5">
                <h2 className="text-white text-sm font-medium mb-4">Programm-Einstellungen</h2>
                {[
                  { label: 'Standard-Provision', value: '12%' },
                  { label: 'Cookie-Laufzeit', value: '30 Tage' },
                  { label: 'Mindest-Auszahlung', value: '50 €' },
                  { label: 'Auszahlungs-Turnus', value: 'Monatlich' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                    <span className="text-gray-400 text-sm">{s.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium">{s.value}</span>
                      <button className="text-xs text-[#7F77DD] hover:underline">Ändern</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {view === 'creator' && (
          <div>
            <div className="bg-[#1A1A1A] rounded-xl border border-white/5 p-5 mb-4">
              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/5">
                <div className="w-12 h-12 rounded-full bg-[#2C1F6B] flex items-center justify-center text-purple-300 font-medium text-lg">
                  {portalCreator.initials}
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">Hey {portalCreator.name.split(' ')[0]}! 👋</div>
                  <div className="text-gray-400 text-sm">Dein persönliches Affiliate-Portal</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Nächste Auszahlung</div>
                  <div className="text-green-400 font-medium">{portalCreator.verdient.toLocaleString('de-DE')} € · 01.06.</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Verdient gesamt', value: `${portalCreator.verdient.toLocaleString('de-DE')} €`, color: 'text-green-400' },
                  { label: 'Umsatz generiert', value: `${portalCreator.umsatz.toLocaleString('de-DE')} €` },
                  { label: 'Gesamt Klicks', value: portalCreator.klicks.toLocaleString('de-DE') },
                  { label: 'Provision', value: `${portalCreator.provision}%`, color: 'text-purple-400' },
                ].map(m => (
                  <div key={m.label} className="bg-[#0E0E0E] rounded-xl p-3">
                    <div className="text-gray-500 text-xs mb-1">{m.label}</div>
                    <div className={`text-lg font-medium ${m.color || 'text-white'}`}>{m.value}</div>
                  </div>
                ))}
              </div>

              <div className="bg-[#0E0E0E] rounded-xl p-4 mb-3">
                <div className="text-gray-500 text-xs mb-2">Dein Promo-Code</div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-purple-400 text-xl font-medium">{portalCreator.code || 'Wird zugewiesen...'}</span>
                  <button className="px-3 py-1.5 rounded-lg bg-[#2C1F6B] text-purple-300 text-xs hover:bg-[#3C2F7B]">
                    Kopieren
                  </button>
                </div>
              </div>

              <div className="bg-[#0E0E0E] rounded-xl p-4 mb-3">
                <div className="text-gray-500 text-xs mb-2">Dein Tracking-Link</div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-blue-400 text-xs break-all">trackfluenca.io/r/{portalCreator.code?.toLowerCase() || 'dein-code'}</span>
                  <button className="px-3 py-1.5 rounded-lg bg-[#1A2535] text-blue-300 text-xs flex-shrink-0">
                    Kopieren
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {['Story-Link', 'TikTok Bio', 'Instagram'].map(t => (
                  <div key={t} className="bg-[#0E0E0E] rounded-xl p-3 text-center">
                    <div className="text-gray-500 text-xs mb-1">{t}</div>
                    <button className="text-[#7F77DD] text-xs hover:underline">Link kopieren</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#1A1A1A] rounded-xl border border-white/5 p-5">
              <h2 className="text-white text-sm font-medium mb-3">Auszahlungshistorie</h2>
              {portalCreator.ausgezahlt > 0 ? (
                <div className="flex items-center justify-between py-3 border-b border-white/5">
                  <div>
                    <div className="text-white text-sm font-medium">{portalCreator.ausgezahlt.toLocaleString('de-DE')} €</div>
                    <div className="text-gray-500 text-xs">15.05.2026 · SEPA</div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-900 text-green-300">Überwiesen</span>
                </div>
              ) : (
                <div className="text-gray-500 text-sm text-center py-4">Noch keine Auszahlungen</div>
              )}
              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="text-blue-400 text-sm font-medium">{portalCreator.verdient.toLocaleString('de-DE')} €</div>
                  <div className="text-gray-500 text-xs">01.06.2026 · geplant</div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-900 text-blue-300">Geplant</span>
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