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

export default function Creator() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterTier, setFilterTier] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<typeof creators[0] | null>(null)

  const filtered = creators.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.ig.includes(search) || c.code.includes(search)
    const matchStatus = filterStatus ? c.status === filterStatus : true
    const matchTier = filterTier ? c.tier === filterTier : true
    return matchSearch && matchStatus && matchTier
  })

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
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${item.href === '/creator' ? 'bg-[#7F77DD]/20 text-[#7F77DD]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
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
            <h1 className="text-white text-xl font-medium">Creator</h1>
            <p className="text-gray-500 text-sm mt-1">{creators.length} Creator insgesamt</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-xl border border-white/10 text-gray-400 text-sm hover:bg-white/5">
              CSV Export
            </button>
            <button onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-xl bg-[#7F77DD] text-white text-sm hover:bg-[#534AB7]">
              + Creator hinzufügen
            </button>
          </div>
        </div>

        <div className="flex gap-3 mb-4 flex-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Name, Handle oder Code suchen..."
            className="flex-1 min-w-48 bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#7F77DD]" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-gray-400 text-sm focus:outline-none">
            <option value="">Alle Status</option>
            {['Deal','In Verhandlung','Kontaktiert','Offen','Abgelehnt'].map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={filterTier} onChange={e => setFilterTier(e.target.value)}
            className="bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-gray-400 text-sm focus:outline-none">
            <option value="">Alle Tiers</option>
            {['Nano','Micro','Mid-Tier','Macro','Top-Tier'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div className="bg-[#1A1A1A] rounded-xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['Name','IG Handle','TT Handle','Follower','Tier','Status','Kampagne','Fee','Code','Umsatz','ROAS'].map(h => (
                    <th key={h} className="text-left text-xs text-gray-500 px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.name} onClick={() => setSelected(c)}
                    className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
                    <td className="px-4 py-3 text-white text-sm font-medium whitespace-nowrap">{c.name}</td>
                    <td className="px-4 py-3 text-gray-400 text-sm whitespace-nowrap">{c.ig}</td>
                    <td className="px-4 py-3 text-gray-400 text-sm whitespace-nowrap">{c.tt || '—'}</td>
                    <td className="px-4 py-3 text-gray-300 text-sm whitespace-nowrap">{c.follower.toLocaleString('de-DE')}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${tierColor[c.tier]}`}>{c.tier}</span></td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${statusColor[c.status]}`}>{c.status}</span></td>
                    <td className="px-4 py-3 text-gray-400 text-sm">{c.kampagne || '—'}</td>
                    <td className="px-4 py-3 text-gray-300 text-sm whitespace-nowrap">{c.fee.toLocaleString('de-DE')} €</td>
                    <td className="px-4 py-3 text-purple-400 text-xs font-mono">{c.code || '—'}</td>
                    <td className="px-4 py-3 text-gray-300 text-sm whitespace-nowrap">{c.umsatz > 0 ? `${c.umsatz.toLocaleString('de-DE')} €` : '—'}</td>
                    <td className={`px-4 py-3 text-sm font-medium ${c.roas > 0 ? roasColor(c.roas) : 'text-gray-600'}`}>{c.roas > 0 ? `${c.roas}x` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selected && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
            <div className="bg-[#1A1A1A] rounded-2xl p-6 w-full max-w-md border border-white/10" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#2C1F6B] flex items-center justify-center text-purple-300 font-medium">
                    {selected.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-white font-medium">{selected.name}</div>
                    <div className="text-gray-400 text-xs">{selected.ig} · {selected.tt || 'kein TT'}</div>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white text-xl">×</button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: 'Follower', value: selected.follower.toLocaleString('de-DE') },
                  { label: 'ROAS', value: selected.roas > 0 ? `${selected.roas}x` : '—', color: selected.roas >= 3 ? 'text-green-400' : selected.roas >= 1 ? 'text-amber-400' : 'text-gray-400' },
                  { label: 'Umsatz', value: selected.umsatz > 0 ? `${selected.umsatz.toLocaleString('de-DE')} €` : '—' },
                  { label: 'Fee', value: `${selected.fee.toLocaleString('de-DE')} €` },
                ].map(m => (
                  <div key={m.label} className="bg-[#0E0E0E] rounded-xl p-3">
                    <div className="text-gray-500 text-xs mb-1">{m.label}</div>
                    <div className={`text-lg font-medium ${m.color || 'text-white'}`}>{m.value}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between bg-[#0E0E0E] rounded-xl p-3 mb-3">
                <div className="text-gray-400 text-sm">Promo Code</div>
                <span className="text-purple-400 font-mono text-sm">{selected.code || '—'}</span>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 py-2 rounded-xl bg-[#7F77DD] text-white text-sm hover:bg-[#534AB7]">Outreach senden</button>
                <button className="flex-1 py-2 rounded-xl border border-white/10 text-gray-400 text-sm hover:bg-white/5">Bearbeiten</button>
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
            <div className="bg-[#1A1A1A] rounded-2xl p-6 w-full max-w-md border border-white/10" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-white font-medium">Creator hinzufügen</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white text-xl">×</button>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Name', placeholder: 'Sophie Müller' },
                  { label: 'IG Handle', placeholder: '@sophiestyle' },
                  { label: 'TT Handle', placeholder: '@sophiett' },
                  { label: 'IG Follower', placeholder: '125000' },
                  { label: 'Fee €', placeholder: '850' },
                  { label: 'Promo Code', placeholder: 'SOPHIE15' },
                ].map(f => (
                  <div key={f.label}>
                    <label className="text-gray-400 text-xs mb-1 block">{f.label}</label>
                    <input placeholder={f.placeholder}
                      className="w-full bg-[#0E0E0E] border border-white/10 rounded-xl px-4 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#7F77DD]" />
                  </div>
                ))}
                <button className="w-full py-3 rounded-xl bg-[#7F77DD] text-white text-sm hover:bg-[#534AB7] mt-2">
                  Creator hinzufügen
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