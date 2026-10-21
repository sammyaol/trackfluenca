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

  const inputCls = 'w-full border border-neutral-300 rounded-xl px-4 py-3 text-base text-neutral-900 bg-white focus:outline-none focus:border-neutral-900'

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-neutral-50 text-neutral-900 print:static print:overflow-visible">
      <div className="max-w-xl mx-auto px-5 py-8 pb-16">
        {state === 'loading' && <p className="text-neutral-500 text-center py-20">Lädt…</p>}
        {state === 'missing' && (
          <div className="text-center py-20">
            <h1 className="text-xl font-semibold mb-2">Link nicht gefunden</h1>
            <p className="text-neutral-500 text-sm">Dieser Link ist ungültig oder abgelaufen. Bitte melde dich bei uns.</p>
          </div>
        )}
        {state === 'ok' && v && (
          <>
            <div className="mb-6">
              <p className="text-xs uppercase tracking-widest text-neutral-400 mb-1">{v.firma_name || 'Koluré'}</p>
              <h1 className="text-2xl font-semibold leading-tight">Kooperationsvereinbarung</h1>
              <p className="text-neutral-500 text-sm mt-1">mit {v.creator_name}{v.creator_handle ? ` (${v.creator_handle})` : ''}</p>
            </div>

            {cancelled && <div className="mb-5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">Diese Vereinbarung ist nicht mehr gültig.</div>}

            <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-5">
              {klauseln(v).map((k, i) => (
                <section key={i}>
                  <h2 className="font-semibold text-[15px] mb-1.5">§ {i + 1} {k.titel}</h2>
                  {k.absaetze.map((a, j) => <p key={j} className="text-sm leading-relaxed text-neutral-700 mb-2 last:mb-0">{a}</p>)}
                </section>
              ))}
            </div>

            {signed ? (
              <div className="mt-6 bg-white rounded-2xl border border-emerald-200 p-5">
                <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm">✓</span>
                  Unterschrieben
                </div>
                <p className="text-sm text-neutral-600 mb-3">
                  Danke, {v.unterschrift_name}! Die Vereinbarung wurde am {fmtZeit(v.unterschrieben_am)} unterzeichnet.
                </p>
                {v.unterschrift_bild && <img src={v.unterschrift_bild} alt="Unterschrift" className="h-24 border-b border-neutral-300 mb-1" />}
                <p className="text-xs text-neutral-400">{v.unterschrift_name}{v.unterschrift_adresse ? ` · ${v.unterschrift_adresse}` : ''}</p>
                <button onClick={() => window.print()} className="mt-5 w-full rounded-xl bg-neutral-900 text-white py-3 text-sm font-medium print:hidden">Als PDF speichern</button>
              </div>
            ) : !cancelled && (
              <div className="mt-6 bg-white rounded-2xl border border-neutral-200 p-5 space-y-4">
                <h2 className="font-semibold">Unterschrift</h2>
                <div>
                  <label className="text-xs text-neutral-500 block mb-1">Vollständiger Name *</label>
                  <input value={name} onChange={e => setName(e.target.value)} autoComplete="name" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 block mb-1">Anschrift (optional)</label>
                  <input value={adresse} onChange={e => setAdresse(e.target.value)} autoComplete="street-address" placeholder="Straße, PLZ Ort" className={inputCls} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-neutral-500">Hier mit dem Finger unterschreiben *</label>
                    <button type="button" onClick={clear} className="text-xs text-neutral-500 underline">Löschen</button>
                  </div>
                  <canvas ref={canvasRef} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
                    style={{ touchAction: 'none' }}
                    className="w-full h-44 rounded-xl border-2 border-dashed border-neutral-300 bg-white cursor-crosshair" />
                </div>
                <label className="flex items-start gap-3 text-sm text-neutral-700">
                  <input type="checkbox" checked={zustimmung} onChange={e => setZustimmung(e.target.checked)} className="mt-0.5 w-5 h-5 flex-shrink-0" />
                  <span>Ich habe die Vereinbarung gelesen und bin einverstanden.</span>
                </label>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button onClick={submit} disabled={sending} className="w-full rounded-xl bg-neutral-900 text-white py-3.5 text-base font-medium disabled:opacity-50">
                  {sending ? 'Wird gespeichert…' : 'Verbindlich unterschreiben'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
