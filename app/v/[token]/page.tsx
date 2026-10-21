'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { klauseln, fmtZeit, type Vertrag } from '@/lib/vertrag'

// Oeffentliche Unterschriftsseite fuer Creator (kein Login). Hell + mobil,
// bewusst unabhaengig vom dunklen App-Theme.
export default function Unterschreiben() {
  const { token } = useParams<{ token: string }>()
  const [v, setV] = useState<Vertrag | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'missing'>('loading')
  const [name, setName] = useState('')
  const [adresse, setAdresse] = useState('')
  const [zustimmung, setZustimmung] = useState(false)
  const [hasSig, setHasSig] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    fetch('/api/sign/' + token, { cache: 'no-store' })
      .then(async r => {
        if (!r.ok) { setState('missing'); return }
        const d = await r.json()
        setV(d)
        if (d.unterschrift_name) setName(d.unterschrift_name)
        setState('ok')
      })
      .catch(() => setState('missing'))
  }, [token])

  const signed = v?.status === 'unterschrieben'
  const cancelled = v?.status === 'storniert'

  // Canvas auf Anzeigegroesse * devicePixelRatio skalieren, damit die Linie scharf ist.
  useEffect(() => {
    if (state !== 'ok' || signed || cancelled) return
    const c = canvasRef.current
    if (!c) return
    const setup = () => {
      const r = c.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      c.width = Math.round(r.width * dpr)
      c.height = Math.round(r.height * dpr)
      const ctx = c.getContext('2d')!
      ctx.scale(dpr, dpr)
      ctx.lineWidth = 2.4
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = '#111'
      setHasSig(false)
    }
    setup()
  }, [state, signed, cancelled])

  const pos = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const down = (e: React.PointerEvent) => {
    e.preventDefault()
    canvasRef.current!.setPointerCapture(e.pointerId)
    drawing.current = true
    last.current = pos(e)
    const ctx = canvasRef.current!.getContext('2d')!
    ctx.beginPath()
    ctx.arc(last.current.x, last.current.y, 1.2, 0, Math.PI * 2)
    ctx.fillStyle = '#111'
    ctx.fill()
    setHasSig(true)
  }
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return
    e.preventDefault()
    const p = pos(e)
    const ctx = canvasRef.current!.getContext('2d')!
    ctx.beginPath()
    ctx.moveTo(last.current!.x, last.current!.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
  }
  const up = () => { drawing.current = false; last.current = null }
  const clear = () => {
    const c = canvasRef.current!
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height)
    setHasSig(false)
  }

  const submit = async () => {
    setError('')
    if (name.trim().length < 3) { setError('Bitte gib deinen vollständigen Namen ein.'); return }
    if (!zustimmung) { setError('Bitte bestätige, dass du die Vereinbarung gelesen hast.'); return }
    if (!hasSig) { setError('Bitte unterschreibe im Feld.'); return }
    setSending(true)
    try {
      const res = await fetch('/api/sign/' + token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), adresse: adresse.trim(), zustimmung, unterschrift: canvasRef.current!.toDataURL('image/png') }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { setError(d.error || 'Speichern fehlgeschlagen.'); return }
      setV(d)
    } catch {
      setError('Keine Verbindung. Bitte nochmal versuchen.')
    } finally {
      setSending(false)
    }
  }

  const serif = { fontFamily: 'Georgia, "Times New Roman", ui-serif, serif' }
  const inputCls = 'w-full border-0 border-b border-neutral-300 bg-transparent px-0 py-2.5 text-[17px] text-neutral-900 placeholder-neutral-300 focus:outline-none focus:border-neutral-900 rounded-none'
  const labelCls = 'text-[11px] uppercase tracking-[0.18em] text-neutral-400 block'

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-white text-neutral-900 print:static print:overflow-visible">
      <div className="max-w-[560px] mx-auto px-6 pt-10 pb-20">
        <div className="flex justify-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/koluere-logo.png" alt="Koluré" className="h-24 w-auto select-none" draggable={false} />
        </div>

        {state === 'loading' && <p className="text-neutral-400 text-center py-16 text-sm tracking-wide">Lädt…</p>}
        {state === 'missing' && (
          <div className="text-center py-16">
            <h1 className="text-2xl mb-2" style={serif}>Link nicht gefunden</h1>
            <p className="text-neutral-500 text-sm">Dieser Link ist ungültig oder abgelaufen. Bitte melde dich bei uns.</p>
          </div>
        )}

        {state === 'ok' && v && (
          <>
            <div className="text-center mb-10">
              <p className={labelCls + ' mb-3'}>Kooperationsvereinbarung</p>
              <h1 className="text-[28px] leading-tight" style={serif}>{v.creator_name}</h1>
              {v.creator_handle && <p className="text-neutral-400 text-sm mt-1">{v.creator_handle}</p>}
              <div className="w-10 h-px bg-neutral-900 mx-auto mt-6" />
            </div>

            {cancelled && <div className="mb-8 border border-neutral-300 text-neutral-700 text-sm px-4 py-3 text-center">Diese Vereinbarung ist nicht mehr gültig.</div>}

            <div>
              {klauseln(v).map((k, i) => (
                <section key={i} className="py-5 border-t border-neutral-200 first:border-t-0">
                  <h2 className="text-[17px] mb-2" style={serif}>
                    <span className="text-neutral-300 mr-2">{String(i + 1).padStart(2, '0')}</span>{k.titel}
                  </h2>
                  {k.absaetze.map((a, j) => <p key={j} className="text-[15px] leading-[1.7] text-neutral-600 mb-2 last:mb-0">{a}</p>)}
                </section>
              ))}
            </div>

            {signed ? (
              <div className="mt-8 pt-8 border-t border-neutral-900 text-center">
                <p className={labelCls + ' mb-3'}>Unterschrieben</p>
                <p className="text-[22px] mb-1" style={serif}>Danke, {v.unterschrift_name}.</p>
                <p className="text-sm text-neutral-500 mb-6">Unterzeichnet am {fmtZeit(v.unterschrieben_am)}</p>
                {v.unterschrift_bild && <img src={v.unterschrift_bild} alt="Unterschrift" className="h-24 mx-auto" />}
                <div className="w-48 h-px bg-neutral-300 mx-auto mb-1" />
                <p className="text-xs text-neutral-400">{v.unterschrift_name}{v.unterschrift_adresse ? ` · ${v.unterschrift_adresse}` : ''}</p>
                <button onClick={() => window.print()} className="mt-8 border border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white transition-colors px-8 py-3 text-xs uppercase tracking-[0.2em] print:hidden">Als PDF speichern</button>
              </div>
            ) : !cancelled && (
              <div className="mt-8 pt-8 border-t border-neutral-900 space-y-7">
                <div className="text-center">
                  <p className={labelCls + ' mb-2'}>Unterschrift</p>
                  <p className="text-[22px]" style={serif}>Jetzt unterschreiben</p>
                </div>
                <div>
                  <label className={labelCls}>Vollständiger Name *</label>
                  <input value={name} onChange={e => setName(e.target.value)} autoComplete="name" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Anschrift (optional)</label>
                  <input value={adresse} onChange={e => setAdresse(e.target.value)} autoComplete="street-address" placeholder="Straße, PLZ Ort" className={inputCls} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={labelCls}>Mit dem Finger unterschreiben *</label>
                    <button type="button" onClick={clear} className="text-xs text-neutral-400 underline underline-offset-4">Löschen</button>
                  </div>
                  <div className="relative">
                    <canvas ref={canvasRef} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
                      style={{ touchAction: 'none' }}
                      className="w-full h-44 bg-neutral-50 cursor-crosshair block" />
                    <div className="pointer-events-none absolute left-4 right-4 bottom-10 border-b border-neutral-300" />
                    <span className="pointer-events-none absolute left-4 bottom-3 text-neutral-300 text-sm" style={serif}>×</span>
                  </div>
                </div>
                <label className="flex items-start gap-3 text-sm text-neutral-600 leading-relaxed">
                  <input type="checkbox" checked={zustimmung} onChange={e => setZustimmung(e.target.checked)} className="mt-1 w-5 h-5 flex-shrink-0 accent-neutral-900" />
                  <span>Ich habe die Vereinbarung gelesen und bin einverstanden.</span>
                </label>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button onClick={submit} disabled={sending} className="w-full bg-neutral-900 text-white py-4 text-xs uppercase tracking-[0.22em] disabled:opacity-50">
                  {sending ? 'Wird gespeichert…' : 'Verbindlich unterschreiben'}
                </button>
              </div>
            )}
            <p className="text-center text-[11px] text-neutral-300 mt-12 tracking-wide">{v.firma_name || 'Koluré'}</p>
          </>
        )}
      </div>
    </div>
  )
}
