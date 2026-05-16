'use client'
import { useState } from 'react'
import Sidebar from '../components/Sidebar'

const affiliates = [
  { name: 'Sophie Müller', initials: 'SM', code: 'SOPHIE15', provision: 15, klicks: 2840, umsatz: 12750, verdient: 1912, status: 'Aktiv', ausgezahlt: 950, grad: 'from-violet-500 to-purple-700' },
  { name: 'Jana Koch', initials: 'JK', code: 'JANA10', provision: 15, klicks: 890, umsatz: 3900, verdient: 585, status: 'Aktiv', ausgezahlt: 285, grad: 'from-blue-500 to-cyan-600' },
  { name: 'Lena Hoffmann', initials: 'LH', code: 'LENA20', provision: 12, klicks: 1420, umsatz: 8800, verdient: 1056, status: 'Ausstehend', ausgezahlt: 0, grad: 'from-emerald-500 to-teal-600' },
  { name: 'Mia Wagner', initials: 'MW', code: '', provision: 10, klicks: 0, umsatz: 0, verdient: 0, status: 'Eingeladen', ausgezahlt: 0, grad: 'from-amber-500 to-orange-600' },
]

const statusStyle: Record<string, string> = {
  'Aktiv': 'text-emerald-400 bg-emerald-950 border border-emerald-800/30',
  'Ausstehend': 'text-amber-400 bg-amber-950 border border-amber-800/30',
  'Eingeladen': 'text-blue-400 bg-blue-950 border border-blue-800/30',
}

const tierProvisions = [
  { tier: 'Nano', range: '<10k', prov: '15%', style: 'text-gray-400 bg-gray-800 border border-gray-700/50' },
  { tier: 'Micro', range: '10–50k', prov: '15%', style: 'text-blue-400 bg-blue-950 border border-blue-800/30' },
  { tier: 'Mid-Tier', range: '50–500k', prov: '12%', style: 'text-purple-400 bg-purple-950 border border-purple-800/30' },
  { tier: 'Macro', range: '500k–1M', prov: '10%', style: 'text-amber-400 bg-amber-950 border border-amber-800/30' },
  { tier: 'Top-Tier', range: '>1M', prov: '8%', style: 'text-red-400 bg-red-950 border border-red-800/30' },
]

export default function Affiliate() {
  const [view, setView] = useState<'brand' | 'creator'>('brand')
  const [portalCreator, setPortalCreator] = useState(affiliates[0])
  const [portalTab, setPortalTab] = useState('overview')

  const totalVerdient = affiliates.reduce((s, a) => s + a.verdient, 0)
  const totalUmsatz = affiliates.reduce((s, a) => s + a.umsatz, 0)
  const totalKlicks = affiliates.reduce((s, a) => s + a.klicks, 0)

  return (
    <div className="flex min-h-screen bg-[#0A0A0A]">
      <Sidebar />
      <main className="flex-1 md:ml-60 min-h-screen">
        <div className="border-b border-white/[0.06] px-8 py-4 flex items-center justify-between bg-[#0A0A0A]/80 backdrop-blur sticky top-0 z-20">
          <div>
            <h1 className="text-white font-semibold text-lg">Affiliate</h1>
            <p className="text-gray-600 text-xs mt-0.5">Provisionen, Auszahlungen & Creator-Portal</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-[#141414] rounded-xl p-1 border border-white/[0.06]">
              <button onClick={() => setView('brand')}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === 'brand' ? 'bg-[#7F77DD] text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                Brand-Ansicht
              </button>
              <button onClick={() => setView('creator')}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === 'creator' ? 'bg-[#7F77DD] text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                Creator-Portal
              </button>
            </div>
          </div>
        </div>

        <div className="p-8">
          {view === 'brand' && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Aktive Affiliates', value: affiliates.filter(a => a.status === 'Aktiv').length, icon: '👥' },
                  { label: 'Offene Provisionen', value: `${totalVerdient.toLocaleString('de-DE')} €`, color: 'text-amber-400', icon: '⏳' },
                  { label: 'Gesamt Umsatz', value: `${totalUmsatz.toLocaleString('de-DE')} €`, color: 'text-emerald-400', icon: '💰' },
                  { label: 'Gesamt Klicks', value: totalKlicks.toLocaleString('de-DE'), icon: '🖱️' },
                ].map(m => (
                  <div key={m.label} className="bg-[#141414] rounded-2xl p-5 border border-white/[0.06]">
                    <div className="text-2xl mb-3">{m.icon}</div>
                    <div className={`text-2xl font-semibold mb-1 ${m.color || 'text-white'}`}>{m.value}</div>
                    <div className="text-gray-600 text-xs font-medium">{m.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2 bg-[#141414] rounded-2xl border border-white/[0.06] overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                    <h2 className="text-white font-semibold text-sm">Creator Übersicht</h2>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#7F77DD] text-white text-xs hover:bg-[#534AB7] transition-colors font-medium">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Creator einladen
                    </button>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {affiliates.map(a => (
                      <div key={a.name} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${a.grad} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                          {a.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm font-medium">{a.name}</div>
                          <div className="text-gray-600 text-xs font-mono">{a.code || '—'}</div>
                        </div>
                        <div className="text-center hidden md:block">
                          <div className="text-white text-sm font-medium">{a.provision}%</div>
                          <div className="text-gray-600 text-xs">Provision</div>
                        </div>
                        <div className="text-center hidden md:block">
                          <div className="text-emerald-400 text-sm font-medium">{a.umsatz > 0 ? `${a.umsatz.toLocaleString('de-DE')} €` : '—'}</div>
                          <div className="text-gray-600 text-xs">Umsatz</div>
                        </div>
                        <div className="text-center hidden md:block">
                          <div className="text-amber-400 text-sm font-medium">{a.verdient > 0 ? `${a.verdient.toLocaleString('de-DE')} €` : '—'}</div>
                          <div className="text-gray-600 text-xs">Verdient</div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-md font-medium ${statusStyle[a.status]}`}>{a.status}</span>
                        {a.status === 'Ausstehend' ? (
                          <button className="px-3 py-1.5 rounded-lg bg-emerald-700 text-emerald-100 text-xs hover:bg-emerald-600 transition-colors font-medium">
                            Auszahlen
                          </button>
                        ) : a.status === 'Aktiv' ? (
                          <button onClick={() => { setPortalCreator(a); setView('creator') }}
                            className="px-3 py-1.5 rounded-lg border border-white/[0.08] text-gray-400 text-xs hover:bg-white/[0.04] transition-colors">
                            Portal
                          </button>
                        ) : (
                          <button className="px-3 py-1.5 rounded-lg border border-white/[0.08] text-gray-400 text-xs hover:bg-white/[0.04] transition-colors">
                            Erinnern
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="bg-[#141414] rounded-2xl border border-white/[0.06] p-5">
                    <h2 className="text-white font-semibold text-sm mb-4">Provisions-Stufen</h2>
                    <div className="flex flex-col gap-2">
                      {tierProvisions.map(t => (
                        <div key={t.tier} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${t.style}`}>{t.tier}</span>
                            <span className="text-gray-600 text-xs">{t.range}</span>
                          </div>
                          <span className="text-white text-sm font-semibold">{t.prov}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#141414] rounded-2xl border border-white/[0.06] p-5">
                    <h2 className="text-white font-semibold text-sm mb-4">Einstellungen</h2>
                    {[
                      { label: 'Standard-Provision', value: '12%' },
                      { label: 'Cookie-Laufzeit', value: '30 Tage' },
                      { label: 'Mindest-Auszahlung', value: '50 €' },
                      { label: 'Turnus', value: 'Monatlich' },
                    ].map(s => (
                      <div key={s.label} className="flex justify-between items-center py-2.5 border-b border-white/[0.04] last:border-0">
                        <span className="text-gray-500 text-xs">{s.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white text-xs font-medium">{s.value}</span>
                          <button className="text-[10px] text-[#7F77DD] hover:underline">Ändern</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {view === 'creator' && (
            <div className="max-w-2xl">
              <div className={`bg-gradient-to-r ${portalCreator.grad} rounded-2xl p-6 mb-5`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-xl">
                      {portalCreator.initials}
                    </div>
                    <div>
                      <div className="text-white font-bold text-lg">Hey {portalCreator.name.split(' ')[0]}! 👋</div>
                      <div className="text-white/70 text-sm">Dein persönliches Affiliate-Portal</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white/70 text-xs">Nächste Auszahlung</div>
                    <div className="text-white font-bold text-lg">{portalCreator.verdient.toLocaleString('de-DE')} €</div>
                    <div className="text-white/60 text-xs">01.06.2026</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-1 bg-[#141414] rounded-xl p-1 border border-white/[0.06] mb-5">
                {[['overview', 'Übersicht'], ['orders', 'Bestellungen'], ['payouts', 'Auszahlungen'], ['tools', 'Links']].map(([id, label]) => (
                  <button key={id} onClick={() => setPortalTab(id)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${portalTab === id ? 'bg-[#7F77DD] text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                    {label}
                  </button>
                ))}
              </div>

              {portalTab === 'overview' && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Verdient gesamt', value: `${portalCreator.verdient.toLocaleString('de-DE')} €`, color: 'text-emerald-400' },
                      { label: 'Umsatz generiert', value: `${portalCreator.umsatz.toLocaleString('de-DE')} €` },
                      { label: 'Gesamt Klicks', value: portalCreator.klicks.toLocaleString('de-DE') },
                      { label: 'Provision', value: `${portalCreator.provision}%`, color: 'text-[#7F77DD]' },
                    ].map(m => (
                      <div key={m.label} className="bg-[#141414] rounded-xl p-4 border border-white/[0.06]">
                        <div className="text-gray-600 text-xs mb-1">{m.label}</div>
                        <div className={`text-xl font-bold ${m.color || 'text-white'}`}>{m.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#141414] rounded-xl border border-white/[0.06] p-4">
                    <div className="text-gray-500 text-xs font-medium mb-3">Dein Promo-Code</div>
                    <div className="flex items-center justify-between bg-[#0A0A0A] rounded-xl px-4 py-3 border border-white/[0.06]">
                      <span className="font-mono text-[#7F77DD] text-xl font-bold">{portalCreator.code || 'Wird zugewiesen'}</span>
                      <button className="px-3 py-1.5 rounded-lg bg-[#7F77DD]/20 text-[#7F77DD] text-xs hover:bg-[#7F77DD]/30 transition-colors font-medium">Kopieren</button>
                    </div>
                  </div>

                  <div className="bg-[#141414] rounded-xl border border-white/[0.06] p-4">
                    <div className="text-gray-500 text-xs font-medium mb-3">Tracking-Link</div>
                    <div className="flex items-center justify-between bg-[#0A0A0A] rounded-xl px-4 py-3 border border-white/[0.06]">
                      <span className="font-mono text-blue-400 text-xs">trackfluenca.io/r/{portalCreator.code?.toLowerCase()}</span>
                      <button className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs hover:bg-blue-500/20 transition-colors font-medium flex-shrink-0 ml-3">Kopieren</button>
                    </div>
                  </div>

                  <div className="bg-[#141414] rounded-xl border border-white/[0.06] p-4">
                    <div className="text-gray-500 text-xs font-medium mb-3">Provisions-Fortschritt</div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-gray-500">Angesammelt</span>
                      <span className="text-emerald-400 font-medium">{portalCreator.verdient.toLocaleString('de-DE')} €</span>
                    </div>
                    <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min((portalCreator.verdient / 2000) * 100, 100)}%` }} />
                    </div>
                    <div className="text-gray-600 text-xs mt-1.5">Mindest-Auszahlung: 50 € · Nächste: 01.06.2026</div>
                  </div>
                </div>
              )}

              {portalTab === 'payouts' && (
                <div className="bg-[#141414] rounded-xl border border-white/[0.06]">
                  <div className="px-5 py-4 border-b border-white/[0.06]">
                    <h3 className="text-white font-semibold text-sm">Auszahlungshistorie</h3>
                  </div>
                  {portalCreator.ausgezahlt > 0 ? (
                    <div className="px-5 py-4 border-b border-white/[0.04]">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">{portalCreator.ausgezahlt.toLocaleString('de-DE')} €</div>
                          <div className="text-gray-600 text-xs mt-0.5">15.05.2026 · SEPA</div>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800/30">Überwiesen</span>
                      </div>
                    </div>
                  ) : null}
                  <div className="px-5 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-blue-400 font-medium">{portalCreator.verdient.toLocaleString('de-DE')} €</div>
                        <div className="text-gray-600 text-xs mt-0.5">01.06.2026 · geplant</div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-md bg-blue-950 text-blue-400 border border-blue-800/30">Geplant</span>
                    </div>
                  </div>
                </div>
              )}

              {portalTab === 'tools' && (
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'Haupt-Link', url: `trackfluenca.io/r/${portalCreator.code?.toLowerCase()}` },
                    { label: 'Story-Link', url: `trackfluenca.io/r/${portalCreator.code?.toLowerCase()}?src=story` },
                    { label: 'TikTok Bio', url: `trackfluenca.io/r/${portalCreator.code?.toLowerCase()}?src=tt` },
                  ].map(l => (
                    <div key={l.label} className="bg-[#141414] rounded-xl border border-white/[0.06] p-4">
                      <div className="text-gray-500 text-xs font-medium mb-2">{l.label}</div>
                      <div className="flex items-center justify-between bg-[#0A0A0A] rounded-xl px-4 py-3 border border-white/[0.06]">
                        <span className="font-mono text-blue-400 text-xs truncate">{l.url}</span>
                        <button className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs flex-shrink-0 ml-3 hover:bg-blue-500/20 transition-colors">Kopieren</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {portalTab === 'orders' && (
                <div className="bg-[#141414] rounded-xl border border-white/[0.06]">
                  <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                    <h3 className="text-white font-semibold text-sm">Bestellungen via {portalCreator.code}</h3>
                    <button className="text-xs text-[#7F77DD] hover:underline">CSV Export</button>
                  </div>
                  {[
                    { id: '#4821', produkt: 'Veneziane Kette Gold', betrag: 124, provision: 18.60 },
                    { id: '#4819', produkt: 'Kugelkette Silber', betrag: 79, provision: 11.85 },
                    { id: '#4815', produkt: 'Marinerkette Gold', betrag: 95, provision: 14.25 },
                    { id: '#4810', produkt: 'Schlangenkette', betrag: 148, provision: 22.20 },
                  ].map(o => (
                    <div key={o.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.04] last:border-0">
                      <span className="text-gray-600 text-xs font-mono w-14">{o.id}</span>
                      <span className="text-gray-300 text-sm flex-1">{o.produkt}</span>
                      <span className="text-gray-400 text-sm">{o.betrag} €</span>
                      <span className="text-emerald-400 text-sm font-medium">{o.provision} €</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}