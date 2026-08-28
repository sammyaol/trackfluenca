'use client'
import Link from 'next/link'
import Sidebar from '../components/Sidebar'
import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

const eur = (n: number) => (n || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

export default function Zahlungen() {
  const [creators, setCreators] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const getToken = async () => (await sb.auth.getSession()).data.session?.access_token || ''

  const load = async () => {
    setLoading(true)
    const token = await getToken()
    const res = await fetch('/api/creators?type=all', { headers: { authorization: 'Bearer ' + token } })
    const data = await res.json()
    setCreators(Array.isArray(data) ? data.filter((c: any) => (c.fee || 0) > 0) : [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const today = new Date().toISOString().slice(0, 10)

  const togglePaid = async (c: any) => {
    const next = !c.fee_bezahlt
    setBusyId(c.id)
    const fields = { fee_bezahlt: next, fee_bezahlt_am: next ? today : null }
    setCreators(prev => prev.map(x => x.id === c.id ? { ...x, ...fields } : x))
    const token = await getToken()
    await fetch('/api/creators/' + c.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token },
      body: JSON.stringify(fields)
    })
    setBusyId(null)
  }

  const updateFaelligAm = async (c: any, value: string) => {
    setCreators(prev => prev.map(x => x.id === c.id ? { ...x, fee_faellig_am: value || null } : x))
    const token = await getToken()
    await fetch('/api/creators/' + c.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token },
      body: JSON.stringify({ fee_faellig_am: value || null })
    })
  }

  const { offen, erledigt, gesamtOffen, gesamtErledigt, ueberfaellig } = useMemo(() => {
    const offenArr = creators.filter(c => !c.fee_bezahlt)
    const erledigtArr = creators.filter(c => c.fee_bezahlt)
    const ueberfaelligN = offenArr.filter(c => c.fee_faellig_am && c.fee_faellig_am < today).length
    offenArr.sort((a, b) => {
      const aOverdue = a.fee_faellig_am && a.fee_faellig_am < today
      const bOverdue = b.fee_faellig_am && b.fee_faellig_am < today
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1
      const aDate = a.fee_faellig_am || '9999-99-99'
      const bDate = b.fee_faellig_am || '9999-99-99'
      return aDate < bDate ? -1 : aDate > bDate ? 1 : 0
    })
    erledigtArr.sort((a, b) => (b.fee_bezahlt_am || '').localeCompare(a.fee_bezahlt_am || ''))
    return {
      offen: offenArr,
      erledigt: erledigtArr,
      gesamtOffen: offenArr.reduce((s, c) => s + (c.fee || 0), 0),
      gesamtErledigt: erledigtArr.reduce((s, c) => s + (c.fee || 0), 0),
      ueberfaellig: ueberfaelligN,
    }
  }, [creators, today])

  const initials = (name: string) => (name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  const Row = ({ c, done }: { c: any; done: boolean }) => {
    const overdue = !done && c.fee_faellig_am && c.fee_faellig_am < today
    return (
      <div className={`flex items-center gap-3 px-4 py-3 rounded-apple-sm border transition-colors ${done ? 'bg-emerald-500/[0.05] border-emerald-500/20' : overdue ? 'bg-red-500/[0.06] border-red-500/25' : 'bg-surface-2 border-hairline-soft'}`}>
        <button onClick={() => togglePaid(c)} disabled={busyId === c.id}
          className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-colors ${done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-hairline text-transparent hover:border-accent'}`}
          title={done ? 'Als offen markieren' : 'Als bezahlt markieren'}>
          {busyId === c.id ? <span className="w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : '✓'}
        </button>
        <div className="w-8 h-8 rounded-full bg-[#30D158]/20 flex items-center justify-center text-[#30D158] text-xs font-bold overflow-hidden flex-shrink-0">
          {c.ig_image || c.tt_image ? <img src={c.tt_image || c.ig_image} alt="" className="w-full h-full object-cover" /> : initials(c.name)}
        </div>
        <div className="min-w-0 flex-1">
          <Link href={c.type === 'celeb' ? '/celebs' : `/outreach?creator=${c.id}`} className="text-ink-1 text-sm font-medium hover:text-accent transition-colors truncate block">{c.name}</Link>
          <div className="text-ink-4 text-xs truncate">{c.kampagne || 'Keine Kampagne'}{c.type === 'celeb' ? ' · Celeb' : ''}</div>
        </div>
        {!done && (
          <input type="date" value={c.fee_faellig_am || ''} onChange={e => updateFaelligAm(c, e.target.value)}
            className={`bg-surface-3 border border-hairline rounded-apple-sm px-2 py-1 text-xs focus:outline-none ${overdue ? 'text-red-400' : 'text-ink-3'}`} />
        )}
        {done && c.fee_bezahlt_am && (
          <span className="text-emerald-400 text-xs flex-shrink-0">bezahlt {new Date(c.fee_bezahlt_am).toLocaleDateString('de-DE')}</span>
        )}
        <div className={`text-sm font-semibold flex-shrink-0 w-20 text-right ${done ? 'text-emerald-400' : overdue ? 'text-red-400' : 'text-ink-1'}`}>{eur(c.fee)}</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-surface-0">
      <Sidebar />
      <main className="flex-1 md:ml-60 min-h-screen">
        <div className="border-b border-hairline-soft px-8 py-5 flex items-center justify-between bg-surface-0/80 backdrop-blur-xl sticky top-0 z-20">
          <div>
            <h1 className="text-ink-1 font-semibold text-lg tracking-tight">Zahlungen</h1>
            <p className="text-ink-3 text-xs mt-0.5">Fees und offene Zahlungen an Creator &amp; Celebs</p>
          </div>
        </div>

        <div className="p-8 space-y-6 max-w-4xl">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-surface-2 rounded-apple-lg p-5 border border-hairline-soft">
              <div className="text-ink-3 text-xs font-medium mb-1">Offen</div>
              <div className="text-2xl font-semibold text-ink-1">{eur(gesamtOffen)}</div>
              <div className="text-ink-4 text-xs mt-0.5">{offen.length} Zahlung{offen.length === 1 ? '' : 'en'}{ueberfaellig > 0 ? ` · ${ueberfaellig} überfällig` : ''}</div>
            </div>
            <div className="bg-surface-2 rounded-apple-lg p-5 border border-hairline-soft">
              <div className="text-ink-3 text-xs font-medium mb-1">Bezahlt</div>
              <div className="text-2xl font-semibold text-emerald-400">{eur(gesamtErledigt)}</div>
              <div className="text-ink-4 text-xs mt-0.5">{erledigt.length} Zahlung{erledigt.length === 1 ? '' : 'en'}</div>
            </div>
            <div className="bg-surface-2 rounded-apple-lg p-5 border border-hairline-soft">
              <div className="text-ink-3 text-xs font-medium mb-1">Überfällig</div>
              <div className={`text-2xl font-semibold ${ueberfaellig > 0 ? 'text-red-400' : 'text-ink-1'}`}>{ueberfaellig}</div>
              <div className="text-ink-4 text-xs mt-0.5">Fälligkeitsdatum verstrichen</div>
            </div>
          </div>

          {loading ? (
            <div className="text-ink-4 text-sm py-10 text-center">Lädt...</div>
          ) : (
            <>
              <div>
                <div className="text-ink-3 text-xs uppercase tracking-wider mb-2">Offen ({offen.length})</div>
                {offen.length === 0 ? (
                  <div className="text-ink-4 text-sm py-6 text-center bg-surface-2 rounded-apple-lg border border-hairline-soft">Keine offenen Zahlungen</div>
                ) : (
                  <div className="space-y-2">{offen.map(c => <Row key={c.id} c={c} done={false} />)}</div>
                )}
              </div>
              <div>
                <div className="text-ink-3 text-xs uppercase tracking-wider mb-2">Erledigt ({erledigt.length})</div>
                {erledigt.length === 0 ? (
                  <div className="text-ink-4 text-sm py-6 text-center bg-surface-2 rounded-apple-lg border border-hairline-soft">Noch keine erledigten Zahlungen</div>
                ) : (
                  <div className="space-y-2">{erledigt.map(c => <Row key={c.id} c={c} done={true} />)}</div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
