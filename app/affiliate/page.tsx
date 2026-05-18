'use client'
import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { createBrowserClient } from '@supabase/ssr'

const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const grads = ['from-violet-500 to-purple-700','from-blue-500 to-cyan-600','from-emerald-500 to-teal-600','from-amber-500 to-orange-600','from-rose-500 to-pink-600']
const statusStyle: Record<string, string> = {
  'Aktiv': 'text-emerald-400 bg-emerald-950 border border-emerald-800/30',
  'Ausstehend': 'text-amber-400 bg-amber-950 border border-amber-800/30',
  'Eingeladen': 'text-blue-400 bg-blue-950 border border-blue-800/30',
}

export default function Affiliate() {
  const [affiliates, setAffiliates] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ creator_name: '', promo_code: '', provision_pct: '15' })

  useEffect(() => {
    sb.auth.getSession().then(async ({data}) => {
      const token = data.session?.access_token || ''
      const res = await fetch('/api/affiliate', { headers: { authorization: 'Bearer ' + token } })
      const d = await res.json()
      if (Array.isArray(d)) setAffiliates(d.map((a: any, i: number) => ({ ...a, grad: grads[i % grads.length] })))
    })
  }, [])

  const createAffiliate = async () => {
    if (!form.creator_name) return
    const { data: s } = await sb.auth.getSession()
    const token = s.session?.access_token || ''
    const res = await fetch('/api/affiliate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token },
      body: JSON.stringify({ creator_name: form.creator_name, promo_code: form.promo_code, provision_pct: Number(form.provision_pct) || 15 })
    })
    const d = await res.json()
    if (d.id) setAffiliates(prev => [{ ...d, grad: grads[prev.length % grads.length] }, ...prev])
    setShowModal(false)
    setForm({ creator_name: '', promo_code: '', provision_pct: '15' })
  }

  const toggleAuszahlen = async (a: any) => {
    const { data: s } = await sb.auth.getSession()
    const token = s.session?.access_token || ''
    await fetch(`/api/affiliate/${a.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token },
      body: JSON.stringify({ ausgezahlt: !a.ausgezahlt })
    })
    setAffiliates(prev => prev.map(x => x.id === a.id ? { ...x, ausgezahlt: !x.ausgezahlt } : x))
  }

  const totalUmsatz = affiliates.reduce((s, a) => s + (a.umsatz || 0), 0)
  const totalVerdient = affiliates.reduce((s, a) => s + (a.verdient || 0), 0)
  const totalAusstehend = affiliates.reduce((s, a) => s + (!a.ausgezahlt ? (a.verdient || 0) : 0), 0)

  return (
    <div className="flex min-h-screen bg-[#0A0A0A]">
      <Sidebar />
      <main className="flex-1 md:ml-60 min-h-screen">
        <div className="border-b border-white/[0.06] px-8 py-4 flex items-center justify-between bg-[#0A0A0A]/80 backdrop-blur sticky top-0 z-20">
          <div>
            <h1 className="text-white font-semibold text-lg">Affiliate</h1>
            <p className="text-gray-600 text-xs mt-0.5">{affiliates.length} Creator · {affiliates.filter(a => !a.ausgezahlt && (a.verdient || 0) > 0).length} ausstehend</p>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7F77DD] text-white text-sm hover:bg-[#534AB7] transition-colors font-medium">
            + Creator hinzufügen
          </button>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Gesamt Umsatz', value: `${totalUmsatz.toLocaleString('de-DE')} €`, color: 'text-emerald-400' },
              { label: 'Gesamt Provision', value: `${totalVerdient.toLocaleString('de-DE')} €`, color: 'text-purple-400' },
              { label: 'Ausstehend', value: `${totalAusstehend.toLocaleString('de-DE')} €`, color: 'text-amber-400' },
            ].map(m => (
              <div key={m.label} className="bg-[#141414] rounded-2xl p-5 border border-white/[0.06]">
                <div className={`text-2xl font-semibold mb-1 ${m.color}`}>{m.value}</div>
                <div className="text-gray-600 text-xs">{m.label}</div>
              </div>
            ))}
          </div>
          {affiliates.length === 0 ? (
            <div className="text-center py-20 text-gray-600">Noch keine Affiliate-Creator. Füge deinen ersten hinzu!</div>
          ) : (
            <div className="bg-[#141414] rounded-2xl border border-white/[0.06] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['Creator','Code','Provision','Umsatz','Verdient','Status','Aktion'].map(h => (
                      <th key={h} className="text-left text-xs text-gray-600 px-5 py-3.5 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {affiliates.map((a, i) => (
                    <tr key={a.id} className={`border-b border-white/[0.04] last:border-0 ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${a.grad} flex items-center justify-center text-white text-xs font-bold`}>
                            {a.creator_name.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
                          </div>
                          <span className="text-white text-sm font-medium">{a.creator_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4"><span className="font-mono text-[#7F77DD] text-xs">{a.promo_code || '—'}</span></td>
                      <td className="px-5 py-4"><span className="text-gray-300 text-sm">{a.provision_pct}%</span></td>
                      <td className="px-5 py-4"><span className="text-emerald-400 text-sm font-medium">{(a.umsatz || 0) > 0 ? `${(a.umsatz || 0).toLocaleString('de-DE')} €` : '—'}</span></td>
                      <td className="px-5 py-4"><span className="text-purple-400 text-sm font-medium">{(a.verdient || 0) > 0 ? `${(a.verdient || 0).toLocaleString('de-DE')} €` : '—'}</span></td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${a.ausgezahlt ? 'text-gray-400 bg-gray-800 border border-gray-700/50' : statusStyle['Ausstehend']}`}>
                          {a.ausgezahlt ? 'Ausgezahlt' : 'Ausstehend'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => toggleAuszahlen(a)} className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${a.ausgezahlt ? 'bg-white/[0.05] text-gray-500 hover:bg-white/[0.08]' : 'bg-emerald-950 text-emerald-400 hover:bg-emerald-900'}`}>
                          {a.ausgezahlt ? 'Zurücksetzen' : 'Auszahlen'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
            <div className="bg-[#141414] rounded-2xl w-full max-w-md border border-white/[0.08]" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
                <h2 className="text-white font-semibold">Affiliate Creator hinzufügen</h2>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center text-gray-400 hover:text-white text-lg">×</button>
              </div>
              <div className="p-6 flex flex-col gap-3">
                <div><label className="text-gray-500 text-xs mb-1.5 block">Creator Name *</label><input value={form.creator_name} onChange={e => setForm(p => ({...p, creator_name: e.target.value}))} placeholder="Sophie Müller" className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-700 focus:outline-none" /></div>
                <div><label className="text-gray-500 text-xs mb-1.5 block">Promo Code</label><input value={form.promo_code} onChange={e => setForm(p => ({...p, promo_code: e.target.value}))} placeholder="SOPHIE15" className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-700 focus:outline-none" /></div>
                <div><label className="text-gray-500 text-xs mb-1.5 block">Provision %</label><select value={form.provision_pct} onChange={e => setForm(p => ({...p, provision_pct: e.target.value}))} className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none">{['8','10','12','15','20'].map(v => <option key={v}>{v}</option>)}</select></div>
                <button onClick={createAffiliate} disabled={!form.creator_name} className="w-full py-3 rounded-xl bg-[#7F77DD] text-white text-sm hover:bg-[#534AB7] transition-colors font-medium disabled:opacity-50 mt-1">Hinzufügen</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
