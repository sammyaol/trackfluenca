'use client'
import { useState } from 'react'
import Sidebar from '../components/Sidebar'

export default function Einstellungen() {
  const [saved, setSaved] = useState(false)
  const [plan, setPlan] = useState('free')
  const [primaryColor, setPrimaryColor] = useState('#0A84FF')

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const colors = ['#0A84FF', '#E24B4A', '#1D9E75', '#D85A30', '#185FA5', '#D4537E']

  return (
    <div className="flex min-h-screen bg-surface-0">
      <Sidebar />
      <main className="flex-1 md:ml-60 min-h-screen">
        <div className="border-b border-hairline-soft px-8 py-4 flex items-center justify-between bg-surface-0/80 backdrop-blur sticky top-0 z-20">
          <div>
            <h1 className="text-ink-1 font-semibold text-lg">Einstellungen</h1>
            <p className="text-ink-4 text-xs mt-0.5">Marke, API-Keys, Plan & Portal-Branding</p>
          </div>
          <button onClick={save}
            className={`flex items-center gap-2 px-4 py-2 rounded-apple-sm text-sm font-medium transition-all ${saved ? 'bg-emerald-600 text-ink-1' : 'bg-accent text-ink-1 hover:bg-accent-hover'}`}>
            {saved ? (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Gespeichert!</>
            ) : (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Speichern</>
            )}
          </button>
        </div>

        <div className="p-8 max-w-4xl">
          {/* Plan */}
          <div className="mb-8">
            <h2 className="text-ink-1 font-semibold text-sm mb-1">Plan</h2>
            <p className="text-ink-4 text-xs mb-4">Wähle den passenden Plan für deine Brand</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'free', name: 'Free', price: '0 €', sub: 'Zum Testen', features: ['5 Creator', '1 Kampagne', 'Basis-Portal', 'ROAS Tracking'], locked: [] },
                { id: 'pro', name: 'Pro', price: '49 €/Mo', sub: 'Beliebteste', features: ['50 Creator', 'Alles unbegrenzt', 'Portal Branding', 'Auto-Fetch API', 'Discovery + Outreach', 'Kein "Powered by"'], locked: [], featured: true },
                { id: 'business', name: 'Business', price: '149 €/Mo', sub: 'Für Agenturen', features: ['Unbegrenzt', 'Multi-Brand', 'White-Label', 'Shopify Sync', 'API-Zugang', 'Priority Support'], locked: [] },
              ].map(p => (
                <div key={p.id} onClick={() => setPlan(p.id)}
                  className={`relative rounded-apple-lg p-5 cursor-pointer transition-all border ${plan === p.id ? 'border-accent bg-accent/5' : 'border-hairline-soft bg-surface-2 hover:border-white/[0.12]'} ${p.featured ? 'ring-1 ring-[#0A84FF]/30' : ''}`}>
                  {p.featured && <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] px-3 py-0.5 rounded-full bg-accent text-ink-1 font-medium">Beliebteste</div>}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-ink-1 font-semibold text-sm">{p.name}</div>
                      <div className="text-ink-4 text-xs mt-0.5">{p.sub}</div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${plan === p.id ? 'border-accent bg-accent' : 'border-hairline'}`}>
                      {plan === p.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                  <div className="text-accent font-bold text-xl mb-4">{p.price}</div>
                  <div className="flex flex-col gap-1.5">
                    {p.features.map(f => (
                      <div key={f} className="flex items-center gap-2">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        <span className="text-ink-2 text-xs">{f}</span>
                      </div>
                    ))}
                  </div>
                  {plan !== p.id && p.id !== 'free' && (
                    <button className="w-full mt-4 py-2 rounded-apple-sm border border-accent/40 text-accent text-xs hover:bg-accent/10 transition-colors font-medium">
                      Upgraden
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Brand */}
          <div className="bg-surface-2 rounded-apple-lg border border-hairline-soft p-6 mb-5">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-6 h-6 rounded-apple-sm bg-accent/20 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </div>
              <h2 className="text-ink-1 font-semibold text-sm">Marke</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Markenname', placeholder: 'Kolure', defaultValue: 'Kolure' },
                { label: 'Währung', placeholder: 'EUR', defaultValue: 'EUR' },
                { label: 'Tracking Domain', placeholder: 'trackfluenca.io/r', defaultValue: 'trackfluenca.io/r' },
                { label: 'Website', placeholder: 'kolure.de', defaultValue: 'kolure.de' },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-ink-3 text-xs mb-1.5 block font-medium">{f.label}</label>
                  <input defaultValue={f.defaultValue} placeholder={f.placeholder}
                    className="w-full bg-surface-0 border border-hairline rounded-apple-sm px-4 py-2.5 text-ink-1 text-sm placeholder-gray-700 focus:outline-none focus:border-accent/40 transition-colors" />
                </div>
              ))}
            </div>
          </div>

          {/* API */}
          <div className="bg-surface-2 rounded-apple-lg border border-hairline-soft p-6 mb-5">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-6 h-6 rounded-apple-sm bg-blue-500/20 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              </div>
              <h2 className="text-ink-1 font-semibold text-sm">API Integrationen</h2>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { label: 'RapidAPI Key', placeholder: 'f4c7d7229bmsh...', sub: 'Für IG + TT Auto-Fetch · rapidapi.com', color: 'text-purple-400' },
                { label: 'E-Mail für Outreach', placeholder: 'hello@kolure.de', sub: 'Gmail oder SMTP für automatische Anfragen', color: 'text-blue-400' },
                { label: 'Shopify Store URL', placeholder: 'kolure.myshopify.com', sub: 'Für automatischen ROAS via Order-Sync (Business)', color: 'text-green-400' },
                { label: 'Stripe Secret Key', placeholder: 'sk_live_...', sub: 'Für Affiliate-Auszahlungen', color: 'text-amber-400' },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-ink-3 text-xs mb-1.5 block font-medium">{f.label}</label>
                  <input type="password" placeholder={f.placeholder}
                    className="w-full bg-surface-0 border border-hairline rounded-apple-sm px-4 py-2.5 text-ink-1 text-sm placeholder-gray-700 focus:outline-none focus:border-accent/40 mb-1.5 transition-colors" />
                  <p className={`text-xs ${f.color}`}>{f.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Portal Branding */}
          <div className={`bg-surface-2 rounded-apple-lg border p-6 mb-5 transition-colors ${plan === 'free' ? 'border-hairline-soft opacity-60' : 'border-accent/20'}`}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-apple-sm bg-accent/20 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
                </div>
                <h2 className="text-ink-1 font-semibold text-sm">Portal Branding</h2>
              </div>
              {plan === 'free' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30 font-medium">Ab Pro</span>
              )}
            </div>

            <div className={`${plan === 'free' ? 'pointer-events-none' : ''}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-ink-3 text-xs mb-1.5 block font-medium">Portal-Name</label>
                  <input defaultValue="Kolure Partner-Portal" disabled={plan === 'free'}
                    className="w-full bg-surface-0 border border-hairline rounded-apple-sm px-4 py-2.5 text-ink-1 text-sm focus:outline-none focus:border-accent/40 disabled:opacity-40" />
                </div>
                <div>
                  <label className="text-ink-3 text-xs mb-2 block font-medium">Primärfarbe</label>
                  <div className="flex gap-2">
                    {colors.map(c => (
                      <button key={c} onClick={() => setPrimaryColor(c)}
                        className={`w-8 h-8 rounded-apple-sm transition-all ${primaryColor === c ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-[#141414] scale-110' : 'hover:scale-105'}`}
                        style={{ background: c }} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between py-3 border-t border-hairline-soft">
                <div>
                  <div className="text-ink-1 text-sm font-medium">"Powered by Trackfluenca" ausblenden</div>
                  <div className="text-ink-4 text-xs">Im Free Plan immer sichtbar</div>
                </div>
                <div className={`w-10 h-6 rounded-full flex items-center px-1 cursor-pointer transition-colors ${plan !== 'free' ? 'bg-accent justify-end' : 'bg-surface-3 justify-start'}`}>
                  <div className="w-4 h-4 rounded-full bg-white shadow" />
                </div>
              </div>

              {/* Live Preview */}
              <div className="mt-4">
                <label className="text-ink-3 text-xs mb-2 block font-medium">Live-Vorschau</label>
                <div className="rounded-apple-sm overflow-hidden border border-hairline">
                  <div className="px-4 py-3 flex items-center gap-3" style={{ background: primaryColor }}>
                    <div className="w-7 h-7 rounded-apple-sm bg-white/20 flex items-center justify-center text-ink-1 text-xs font-bold">KO</div>
                    <span className="text-ink-1 font-semibold text-sm">Kolure Partner-Portal</span>
                  </div>
                  <div className="bg-surface-0 p-4">
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-surface-2 rounded-apple-sm p-3 border border-hairline-soft">
                        <div className="text-ink-4 text-xs">Verdient</div>
                        <div className="text-emerald-400 font-bold">1.912 €</div>
                      </div>
                      <div className="bg-surface-2 rounded-apple-sm p-3 border border-hairline-soft">
                        <div className="text-ink-4 text-xs">Klicks</div>
                        <div className="text-ink-1 font-bold">2.840</div>
                      </div>
                    </div>
                    <div className="bg-surface-2 rounded-apple-sm px-4 py-2.5 border border-hairline-soft flex items-center justify-between">
                      <span className="font-mono font-bold" style={{ color: primaryColor }}>SOPHIE15</span>
                      <button className="text-xs px-2 py-1 rounded-md text-ink-1" style={{ background: primaryColor }}>Kopieren</button>
                    </div>
                    {plan === 'free' && (
                      <div className="text-center mt-2 text-ink-4 text-xs">Powered by Trackfluenca</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}