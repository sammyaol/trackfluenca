'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { fmtPreis, UI, type Galerie, type GalerieItem } from '@/lib/produkte'

// Oeffentliche Produktgalerie fuer Creator (kein Login). Hell, ruhig, im Look des Kolure-Shops.
// Pro Produkt: durchwischbare Bilder (Produktbild, getragen, Detail), Auswahl per Tipp, Wunschliste absenden.

function Bilder({ item }: { item: GalerieItem }) {
  const ref = useRef<HTMLDivElement>(null)
  const [idx, setIdx] = useState(0)
  const n = item.images.length
  const onScroll = () => { const el = ref.current; if (!el || !n) return; setIdx(Math.round(el.scrollLeft / el.clientWidth)) }
  const go = (i: number) => { const el = ref.current; if (!el) return; el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' }) }
  if (!n) return <div className="aspect-[4/5] bg-neutral-100" />
  return (
    <div className="relative group">
      <div ref={ref} onScroll={onScroll} className="aspect-[4/5] flex overflow-x-auto snap-x snap-mandatory scrollbar-none" style={{ scrollbarWidth: 'none' }}>
        {item.images.map((src, i) => (
          <div key={i} className="w-full h-full flex-shrink-0 snap-center bg-neutral-50">
            <img src={src} alt={item.title} className="w-full h-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} draggable={false} />
          </div>
        ))}
      </div>
      {n > 1 && (
        <>
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
            {item.images.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-4 bg-neutral-900' : 'w-1.5 bg-neutral-900/30'}`} />)}
          </div>
          <button type="button" onClick={e => { e.stopPropagation(); go(Math.max(0, idx - 1)) }} className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 items-center justify-center text-neutral-900 opacity-0 group-hover:opacity-100 transition">‹</button>
          <button type="button" onClick={e => { e.stopPropagation(); go(Math.min(n - 1, idx + 1)) }} className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 items-center justify-center text-neutral-900 opacity-0 group-hover:opacity-100 transition">›</button>
        </>
      )}
    </div>
  )
}

export default function Galerie() {
  const { token } = useParams<{ token: string }>()
  const [g, setG] = useState<Galerie | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'missing'>('loading')
  const [sel, setSel] = useState<string[]>([])
  const [name, setName] = useState('')
  const [kontakt, setKontakt] = useState('')
  const [nachricht, setNachricht] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetch('/api/galerie/' + token, { cache: 'no-store' }).then(async r => { if (!r.ok) { setState('missing'); return } setG(await r.json()); setState('ok') }).catch(() => setState('missing'))
  }, [token])

  const t = UI[g?.sprache === 'en' ? 'en' : 'de']
  const toggle = (id: string) => {
    setError('')
    setSel(s => s.includes(id) ? s.filter(x => x !== id) : (g?.max_auswahl && s.length >= g.max_auswahl ? (setError(t.errMax.replace('{n}', String(g.max_auswahl))), s) : [...s, id]))
  }
  const gewaehlt = useMemo(() => (g?.items || []).filter(i => sel.includes(i.id)), [g, sel])

  const submit = async () => {
    setError('')
    if (name.trim().length < 2) { setError(t.errName); return }
    if (!sel.length) { setError(t.errMin); return }
    setSending(true)
    try {
      const r = await fetch('/api/galerie/' + token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ creator_name: name.trim(), kontakt: kontakt.trim(), nachricht: nachricht.trim(), auswahl: sel }) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) { setError(d.error || t.errSend); return }
      setDone(true)
    } catch { setError(t.errNet) } finally { setSending(false) }
  }

  const serif = { fontFamily: 'Georgia, "Times New Roman", ui-serif, serif' }
  const label = 'text-[11px] uppercase tracking-[0.18em] text-neutral-400'
  const input = 'w-full border-0 border-b border-neutral-300 bg-transparent px-0 py-2.5 text-[16px] text-neutral-900 placeholder-neutral-300 focus:outline-none focus:border-neutral-900 rounded-none'

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-white text-neutral-900">
      <div className="max-w-[1100px] mx-auto px-5 pt-8 pb-40">
        <div className="flex justify-center mb-6">
          <img src="/koluere-logo.png" alt="Koluré" className="h-16 w-auto select-none" draggable={false} />
        </div>
        {state === 'loading' && <p className="text-neutral-400 text-center py-16 text-sm tracking-wide">{t.loading}</p>}
        {state === 'missing' && (
          <div className="text-center py-16">
            <h1 className="text-2xl mb-2" style={serif}>{t.notFound}</h1>
            <p className="text-neutral-500 text-sm">{t.notFoundText}</p>
          </div>
        )}
        {state === 'ok' && g && (
          <>
            {(g.label || g.titel || g.beschreibung) && (
              <div className="text-center mb-10">
                {g.label && <p className={label + ' mb-3'}>{g.label}</p>}
                {g.titel && <h1 className="text-[30px] leading-tight" style={serif}>{g.titel}</h1>}
                {g.beschreibung && <p className="text-neutral-500 text-[15px] mt-3 max-w-xl mx-auto leading-relaxed whitespace-pre-line">{g.beschreibung}</p>}
                <div className="w-10 h-px bg-neutral-900 mx-auto mt-6" />
              </div>
            )}

            {g.status !== 'aktiv' && <div className="mb-8 border border-neutral-300 text-neutral-700 text-sm px-4 py-3 text-center">{t.closed}</div>}

            {done ? (
              <div className="text-center py-16">
                <p className={label + ' mb-3'}>{t.sent}</p>
                <h2 className="text-[26px] mb-2" style={serif}>{t.thanks}, {name.split(' ')[0]}.</h2>
                <p className="text-neutral-500 text-sm">{t.thanksText}</p>
                <div className="flex flex-wrap justify-center gap-2 mt-6">{gewaehlt.map(i => <span key={i.id} className="text-xs border border-neutral-300 px-3 py-1.5">{i.title}</span>)}</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8">
                {g.items.map(item => {
                  const on = sel.includes(item.id)
                  return (
                    <div key={item.id} className="group/card">
                      <div className={`relative overflow-hidden transition-shadow ${on ? 'ring-2 ring-neutral-900 ring-offset-2' : ''}`}>
                        <Bilder item={item} />
                        {g.status === 'aktiv' && (
                          <button type="button" onClick={() => toggle(item.id)} aria-pressed={on}
                            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm transition ${on ? 'bg-neutral-900 text-white' : 'bg-white/90 text-neutral-900 border border-neutral-200'}`}>{on ? '✓' : '+'}</button>
                        )}
                      </div>
                      <div className="mt-3 px-0.5">
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className="text-[15px] leading-snug" style={serif}>{item.title}</h3>
                          {item.price && <span className="text-[13px] text-neutral-500 whitespace-nowrap">{fmtPreis(item.price)}</span>}
                        </div>
                        {item.varianten && item.varianten.length > 0 && <p className="text-[11px] text-neutral-400 mt-1">{item.varianten.join(' · ')}</p>}
                        {item.hinweis && <p className="text-[12px] text-neutral-500 mt-1">{item.hinweis}</p>}
                        {g.status === 'aktiv' && (
                          <button type="button" onClick={() => toggle(item.id)} className={`mt-3 w-full py-2.5 text-[11px] uppercase tracking-[0.2em] transition ${on ? 'bg-neutral-900 text-white' : 'border border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white'}`}>{on ? t.selected : t.select}</button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <p className="text-center text-[11px] text-neutral-300 mt-16 tracking-wide">Koluré</p>
          </>
        )}
      </div>

      {state === 'ok' && g && g.status === 'aktiv' && !done && (
        <div className="fixed bottom-0 left-0 right-0 z-[110]">
          {open && (
            <div className="bg-white border-t border-neutral-200 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
              <div className="max-w-[640px] mx-auto px-5 py-6 space-y-5">
                <div className="flex items-center justify-between">
                  <p className="text-[20px]" style={serif}>{t.chosen} ({sel.length})</p>
                  <button onClick={() => setOpen(false)} className="text-neutral-400 text-sm underline underline-offset-4">{t.close}</button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  {gewaehlt.map(i => (
                    <div key={i.id} className="flex-shrink-0 w-16">
                      <div className="w-16 h-20 bg-neutral-100 overflow-hidden">{i.images[0] && <img src={i.images[0]} alt="" className="w-full h-full object-cover" />}</div>
                      <button onClick={() => toggle(i.id)} className="text-[10px] text-neutral-400 underline mt-1">{t.remove}</button>
                    </div>
                  ))}
                </div>
                <div><label className={label}>{t.name}</label><input value={name} onChange={e => setName(e.target.value)} autoComplete="name" className={input} /></div>
                <div><label className={label}>{t.contact}</label><input value={kontakt} onChange={e => setKontakt(e.target.value)} placeholder={t.contactPh} className={input} /></div>
                <div><label className={label}>{t.message}</label><input value={nachricht} onChange={e => setNachricht(e.target.value)} className={input} /></div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button onClick={submit} disabled={sending} className="w-full bg-neutral-900 text-white py-4 text-[11px] uppercase tracking-[0.22em] disabled:opacity-50">{sending ? t.sending : t.send}</button>
              </div>
            </div>
          )}
          {!open && (
            <div className="px-5 pb-5 pt-2 bg-gradient-to-t from-white via-white/95 to-transparent">
              <div className="max-w-[640px] mx-auto">
                {error && <p className="text-sm text-red-600 text-center mb-2">{error}</p>}
                <button onClick={() => { if (!sel.length) { setError(t.errFirst); return } setOpen(true) }} className={`w-full py-4 text-[11px] uppercase tracking-[0.22em] transition ${sel.length ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-500'}`}>
                  {sel.length ? `${sel.length} ${sel.length === 1 ? t.product : t.products} · ${t.next}` : t.pick}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
