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

export default function Einstellungen() {
  const [saved, setSaved] = useState(false)
  const [plan, setPlan] = useState('free')

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

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
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${item.href === '/einstellungen' ? 'bg-[#7F77DD]/20 text-[#7F77DD]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
              <span>{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#2C1F6B] flex items-center justify-center text-xs text-purple-300">KO</div>
            <div>
              <div className="text-white text-xs font-medium">Kolure</div>
              <div className="text-gray-500 text-xs">Free Plan</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 md:ml-52 p-4 md:p-8 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-white text-xl font-medium">Einstellungen</h1>
          <p className="text-gray-500 text-sm mt-1">Marke, API-Keys, Plan</p>
        </div>

        {/* Plan */}
        <div className="bg-[#1A1A1A] rounded-xl border border-white/5 p-5 mb-4">
          <h2 className="text-white text-sm font-medium mb-4">Dein Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { id: 'free', name: 'Free', price: '0 €', features: ['5 Creator', '1 Kampagne', 'Basis-Portal'] },
              { id: 'pro', name: 'Pro', price: '49 €/Mo', features: ['50 Creator', 'Unbegrenzte Kampagnen', 'Portal Branding', 'Auto-Fetch API', 'Discovery + Outreach'] },
              { id: 'business', name: 'Business', price: '149 €/Mo', features: ['Unbegrenzt', 'Multi-Brand', 'White-Label', 'Shopify Sync', 'API-Zugang'] },
            ].map(p => (
              <div key={p.id} onClick={() => setPlan(p.id)}
                className={`rounded-xl p-4 border cursor-pointer transition-colors ${plan === p.id ? 'border-[#7F77DD] bg-[#7F77DD]/10' : 'border-white/10 hover:border-white/20'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium text-sm">{p.name}</span>
                  {plan === p.id && <span className="w-2 h-2 rounded-full bg-[#7F77DD]"></span>}
                </div>
                <div className="text-[#7F77DD] font-medium mb-3">{p.price}</div>
                {p.features.map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-gray-400 py-0.5">
                    <span className="text-green-400">✓</span>{f}
                  </div>
                ))}
              </div>
            ))}
          </div>
          {plan !== 'free' && (
            <button className="mt-4 px-6 py-2 rounded-xl bg-[#7F77DD] text-white text-sm hover:bg-[#534AB7]">
              Auf {plan === 'pro' ? 'Pro' : 'Business'} upgraden
            </button>
          )}
        </div>

        {/* Brand */}
        <div className="bg-[#1A1A1A] rounded-xl border border-white/5 p-5 mb-4">
          <h2 className="text-white text-sm font-medium mb-4">Marke</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Markenname', placeholder: 'Kolure', value: 'Kolure' },
              { label: 'Währung', placeholder: 'EUR', value: 'EUR' },
              { label: 'Tracking Domain', placeholder: 'trackfluenca.io/r', value: 'trackfluenca.io/r' },
              { label: 'Website', placeholder: 'kolure.de', value: 'kolure.de' },
            ].map(f => (
              <div key={f.label}>
                <label className="text-gray-400 text-xs mb-1 block">{f.label}</label>
                <input defaultValue={f.value} placeholder={f.placeholder}
                  className="w-full bg-[#0E0E0E] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#7F77DD]" />
              </div>
            ))}
          </div>
        </div>

        {/* API */}
        <div className="bg-[#1A1A1A] rounded-xl border border-white/5 p-5 mb-4">
          <h2 className="text-white text-sm font-medium mb-1">API Integrationen</h2>
          <p className="text-gray-500 text-xs mb-4">Für automatischen Datenfetch von Instagram und TikTok</p>
          <div className="flex flex-col gap-4">
            {[
              { label: 'RapidAPI Key', placeholder: 'f4c7d7229bmsh...', sub: 'Für IG + TT Auto-Fetch · rapidapi.com' },
              { label: 'E-Mail für Outreach', placeholder: 'hello@kolure.de', sub: 'Gmail oder SMTP für automatische Anfragen' },
              { label: 'Shopify Store URL', placeholder: 'kolure.myshopify.com', sub: 'Für automatischen ROAS via Order-Sync (Business)' },
              { label: 'Stripe Secret Key', placeholder: 'sk_live_...', sub: 'Für Affiliate-Auszahlungen via Stripe' },
            ].map(f => (
              <div key={f.label}>
                <label className="text-gray-400 text-xs mb-1 block">{f.label}</label>
                <input type="password" placeholder={f.placeholder}
                  className="w-full bg-[#0E0E0E] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#7F77DD] mb-1" />
                <p className="text-gray-600 text-xs">{f.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Portal Branding */}
        <div className="bg-[#1A1A1A] rounded-xl border border-white/5 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-white text-sm font-medium">Portal Branding</h2>
              <p className="text-gray-500 text-xs mt-0.5">Logo, Farben und Design des Creator-Portals</p>
            </div>
            {plan === 'free' && (
              <span className="text-xs px-2 py-1 rounded-full bg-[#2C1F6B] text-purple-300">Ab Pro</span>
            )}
          </div>
          <div className={`${plan === 'free' ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Portal-Name</label>
                <input defaultValue="Kolure Partner-Portal" placeholder="Kolure Partner-Portal"
                  className="w-full bg-[#0E0E0E] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7F77DD]" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Primärfarbe</label>
                <div className="flex gap-2">
                  {['#7F77DD','#E24B4A','#1D9E75','#D85A30','#185FA5','#D4537E'].map(c => (
                    <div key={c} className="w-8 h-8 rounded-lg cursor-pointer border-2 border-transparent hover:border-white/30"
                      style={{background: c}}></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between py-3 border-t border-white/5">
              <div>
                <div className="text-white text-sm">"Powered by Trackfluenca" ausblenden</div>
                <div className="text-gray-500 text-xs">Im Free Plan immer sichtbar</div>
              </div>
              <div className="w-10 h-6 rounded-full bg-[#7F77DD] flex items-center justify-end pr-1 cursor-pointer">
                <div className="w-4 h-4 rounded-full bg-white"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-[#7F77DD] text-white text-sm hover:bg-[#534AB7] transition-colors">
            {saved ? '✓ Gespeichert!' : 'Einstellungen speichern'}
          </button>
          <button className="px-6 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:bg-white/5">
            Abbrechen
          </button>
        </div>

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