'use client'
import { useState } from 'react'
import Link from 'next/link'

const creators = [
  { name: 'Sophie Müller', ig: '@sophiestyle', tt: '@sophiett', follower: 125000, tier: 'Micro', status: 'Deal', kampagne: 'SS25', fee: 850, code: 'SOPHIE15', umsatz: 12750, roas: 15.0 },
  { name: 'Jana Koch', ig: '@janakoch', tt: '@janatt', follower: 18500, tier: 'Nano', status: 'Deal', kampagne: 'SS25', fee: 300, code: 'JANA10', umsatz: 3900, roas: 13.0 },
  { name: 'Lena Hoffmann', ig: '@lena.jewelry', tt: '', follower: 450000, tier: 'Mid-Tier', status: 'In Verhandlung', kampagne: 'AW25', fee: 2200, code: 'LENA20', umsatz: 8800, roas: 4.0 },
  { name: 'Mia Wagner', ig: '@miafashion', tt: '@miawagner', follower: 1250000, tier: 'Macro', status: 'Kontaktiert', kampagne: '', fee: 5500, code: '', umsatz: 2100, roas: 1.8 },
  { name: 'Klara Becker', ig: '@klarabecker', tt: '@klaratt', follower: 3800000, tier: 'Top-Tier', status: 'Offen', kampagne: '', fee: 15000, code: '', umsatz: 0, roas: 0 },
]

const tierColor: Record<string, string> = {
  'Nano': 'bg-gray-800 text-gray-300',
  'Micro': 'bg-blue-900 text-blue-300',
  'Mid-Tier': 'bg-purple-900 text-purple-300',
  'Macro': 'bg-amber-900 text-amber-300',
  'Top-Tier': 'bg-red-900 text-red-300',
}

const statusColor: Record<string, string> = {
  'Deal': 'bg-green-900 text-green-300',
  'In Verhandlung': 'bg-amber-900 text-amber-300',
  'Kontaktiert': 'bg-blue-900 text-blue-300',
  'Offen': 'bg-gray-800 text-gray-300',
  'Abgelehnt': 'bg-red-900 text-red-300',
}

const roasColor = (r: number) => r >= 3 ? 'text-green-400' : r >= 1 ? 'text-amber-400' : 'text-red-400'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/discovery', label: 'Discovery', icon: '◎' },
  { href: '/creator', label: 'Creator', icon: '👤' },
  { href: '/outreach', label: 'Outreach', icon: '✉' },
  { href: '/kampagnen', label: 'Kampagnen', icon: '📢' },
  { href: '/affiliate', label: 'Affiliate', icon: '%' },
  { href: '/einstellungen', label: 'Einstellungen', icon: '⚙' },
]

export default function Dashboard() {
  const totalUmsatz = creators.reduce((s, c) => s + c.umsatz, 0)
  const avgRoas = (creators.filter(c => c.roas > 0).reduce((s, c) => s + c.roas, 0) / creators.filter(c => c.roas > 0).length).toFixed(1)
  const deals = creators.filter(c => c.status === 'Deal').length

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
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white text-sm transition-colors">
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
          <h1 className="text-white text-xl font-medium">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Willkommen zurück, Kolure</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total Creator', value: creators.length, sub: '+2 diesen Monat' },
            { label: 'Gesamt ROAS', value: `${avgRoas}x`, sub: 'Ziel: 3x', color: 'text-green-400' },
            { label: 'Gesamt Umsatz', value: `${totalUmsatz.toLocaleString('de-DE')} €`, sub: 'via Promo Codes' },
            { label: 'Aktive Deals', value: deals, sub: '3 in Verhandlung', color: 'text-amber-400' },
          ].map(m => (
            <div key={m.label} className="bg-[#1A1A1A] rounded-xl p-4 border border-white/5">
              <div className="text-gray-400 text-xs mb-1">{m.label}</div>
              <div className={`text-2xl font-medium ${m.color || 'text-white'}`}>{m.value}</div>
              <div className="text-gray-500 text-xs mt-1">{m.sub}</div>
            </div>
          ))}
        </div>

        <div className="bg-[#1A1A1A] rounded-xl border border-white/5 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <h2 className="text-white text-sm font-medium">Top Creator</h2>
            <Link href="/creator" className="text-[#7F77DD] text-xs hover:underline">Alle ansehen →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['Name', 'Tier', 'Status', 'Umsatz', 'ROAS'].map(h => (
                    <th key={h} className="text-left text-xs text-gray-500 px-5 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {creators.map(c => (
                  <tr key={c.name} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="px-5 py-3 text-white text-sm font-medium">{c.name}</td>
                    <td className="px-5 py-3"><span className={`text-xs px-2 py-1 rounded-full ${tierColor[c.tier]}`}>{c.tier}</span></td>
                    <td className="px-5 py-3"><span className={`text-xs px-2 py-1 rounded-full ${statusColor[c.status]}`}>{c.status}</span></td>
                    <td className="px-5 py-3 text-sm text-gray-300">{c.umsatz > 0 ? `${c.umsatz.toLocaleString('de-DE')} €` : '—'}</td>
                    <td className={`px-5 py-3 text-sm font-medium ${c.roas > 0 ? roasColor(c.roas) : 'text-gray-600'}`}>{c.roas > 0 ? `${c.roas}x` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#111] border-t border-white/10 flex justify-around py-2 z-50">
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