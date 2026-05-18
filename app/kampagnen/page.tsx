'use client'
import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { createBrowserClient } from '@supabase/ssr'



const statusStyle: Record<string, string> = {
  'Aktiv': 'text-emerald-400 bg-emerald-950 border border-emerald-800/30',
  'Geplant': 'text-blue-400 bg-blue-950 border border-blue-800/30',
  'Abgeschlossen': 'text-gray-400 bg-gray-800 border border-gray-700/50',
}

const roasColor = (r: number) => r >= 3 ? 'text-emerald-400' : r >= 1 ? 'text-amber-400' : 'text-gray-600'

export default function Kampagnen() {
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<typeof kampagnen[0] | null>(null)

  const totalBudget = kampagnen.reduce((s, k) => s + k.budget, 0)
  const totalUmsatz = kampagnen.reduce((s, k) => s + k.umsatz, 0)
  const avgRoas = kampagnen.filter(k => k.roas > 0).reduce((s, k) => s + k.roas, 0) / kampagnen.filter(k => k.roas > 0).length

  return (
    <div className="flex min-h-screen bg-[#0A0A0A]">
      <Sidebar />
      <main className="flex-1 md:ml-60 min-h-screen">
        <div className="border-b border-white/[0.06] px-8 py-4 flex items-center justify-between bg-[#0A0A0A]/80 backdrop-blur sticky top-0 z-20">
          <div>
            <h1 className="text-white font-semibold text-lg">Kampagnen</h1>
            <p className="text-gray-600 text-xs mt-0.5">{kampagnen.length} Kampagnen · {kampagnen.filter(k => k.status === 'Aktiv').length} aktiv</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7F77DD] text-white text-sm hover:bg-[#534AB7] transition-colors font-medium">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Kampagne erstellen
          </button>
        </div>

        <div className="p-8">
          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Gesamt Budget', value: `${totalBudget.toLocaleString('de-DE')} €`, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
              { label: 'Gesamt Umsatz', value: `${totalUmsatz.toLocaleString('de-DE')} €`, color: 'text-emerald-400', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> },
              { label: 'Aktive Kampagnen', value: kampagnen.filter(k => k.status === 'Aktiv').length, color: 'text-blue-400', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
              { label: 'Ø ROAS', value: `${avgRoas.toFixed(1)}x`, color: 'text-emerald-400', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
            ].map(m => (
              <div key={m.label} className="bg-[#141414] rounded-2xl p-5 border border-white/[0.06]">
                <div className="w-8 h-8 rounded-xl bg-white/[0.05] flex items-center justify-center text-gray-400 mb-4">{m.icon}</div>
                <div className={`text-2xl font-semibold mb-1 ${m.color || 'text-white'}`}>{m.value}</div>
                <div className="text-gray-600 text-xs font-medium">{m.label}</div>
              </div>
            ))}
          </div>

          {/* Campaign Cards */}
          <div className="flex flex-col gap-4">
            {kampagnen.map(k => (
              <div key={k.name} onClick={() => setSelected(k)}
                className="bg-[#141414] rounded-2xl border border-white/[0.06] overflow-hidden hover:border-white/[0.12] cursor-pointer transition-all group">
                <div className="flex items-stretch">
                  {/* Color Bar */}
                  <div className={`w-1.5 bg-gradient-to-b ${k.farbe} flex-shrink-0`} />

                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-5">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-white font-semibold text-base">{k.name}</h2>
                          <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${statusStyle[k.status]}`}>{k.status}</span>
                        </div>
                        <p className="text-gray-600 text-xs">{k.start} – {k.end} · {k.creator} Creator</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${k.roas > 0 ? roasColor(k.roas) : 'text-gray-700'}`}>
                          {k.roas > 0 ? `${k.roas}x` : '—'}
                        </div>
                        <div className="text-gray-600 text-xs mt-0.5">ROAS</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[
                        { label: 'Budget', value: `${k.budget.toLocaleString('de-DE')} €` },
                        { label: 'Ausgegeben', value: `${k.ausgegeben.toLocaleString('de-DE')} €` },
                        { label: 'Umsatz', value: k.umsatz > 0 ? `${k.umsatz.toLocaleString('de-DE')} €` : '—', color: k.umsatz > 0 ? 'text-emerald-400' : '' },
                      ].map(s => (
                        <div key={s.label} className="bg-[#0A0A0A] rounded-xl p-3.5 border border-white/[0.06]">
                          <div className="text-gray-600 text-xs mb-1">{s.label}</div>
                          <div className={`text-sm font-semibold ${s.color || 'text-white'}`}>{s.value}</div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-600">Budget verbraucht</span>
                        <span className="text-gray-400 font-medium">{Math.round(k.ausgegeben / k.budget * 100)}%</span>
                      </div>
                      <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all bg-gradient-to-r ${k.farbe}`}
                          style={{ width: `${Math.min(k.ausgegeben / k.budget * 100, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail Modal */}
        {selected && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
            <div className="bg-[#141414] rounded-2xl w-full max-w-lg border border-white/[0.08]" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-white font-semibold">{selected.name}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-md ${statusStyle[selected.status]}`}>{selected.status}</span>
                  </div>
                  <p className="text-gray-600 text-xs mt-1">{selected.start} – {selected.end}</p>
                </div>
                <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center text-gray-400 hover:text-white">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: 'Budget', value: `${selected.budget.toLocaleString('de-DE')} €` },
                    { label: 'Ausgegeben', value: `${selected.ausgegeben.toLocaleString('de-DE')} €` },
                    { label: 'Umsatz', value: selected.umsatz > 0 ? `${selected.umsatz.toLocaleString('de-DE')} €` : '—', color: 'text-emerald-400' },
                    { label: 'ROAS', value: selected.roas > 0 ? `${selected.roas}x` : '—', color: roasColor(selected.roas) },
                    { label: 'Creator', value: selected.creator },
                    { label: 'Budget Rest', value: `${(selected.budget - selected.ausgegeben).toLocaleString('de-DE')} €` },
                  ].map(m => (
                    <div key={m.label} className="bg-[#0A0A0A] rounded-xl p-4 border border-white/[0.06]">
                      <div className="text-gray-600 text-xs mb-1">{m.label}</div>
                      <div className={`text-lg font-semibold ${m.color || 'text-white'}`}>{m.value}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-2.5 rounded-xl bg-[#7F77DD] text-white text-sm hover:bg-[#534AB7] transition-colors font-medium">Creator verwalten</button>
                  <button className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-gray-400 text-sm hover:bg-white/[0.04] transition-colors">Bearbeiten</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* New Campaign Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
            <div className="bg-[#141414] rounded-2xl w-full max-w-md border border-white/[0.08]" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
                <h2 className="text-white font-semibold">Neue Kampagne</h2>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center text-gray-400 hover:text-white">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="p-6 flex flex-col gap-3">
                {[{ label: 'Kampagnen-Name', placeholder: 'SS25 Launch' }, { label: 'Budget €', placeholder: '25000' }, { label: 'Startdatum', placeholder: '01.05.2026' }, { label: 'Enddatum', placeholder: '31.07.2026' }].map(f => (
                  <div key={f.label}>
                    <label className="text-gray-500 text-xs mb-1.5 block font-medium">{f.label}</label>
                    <input placeholder={f.placeholder} className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-[#7F77DD]/40" />
                  </div>
                ))}
                <button className="w-full py-3 rounded-xl bg-[#7F77DD] text-white text-sm hover:bg-[#534AB7] transition-colors font-medium mt-1">Kampagne erstellen</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}