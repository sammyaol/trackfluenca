'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import type { GalerieItem } from '@/lib/produkte'
import { fmtPreis, UI } from '@/lib/produkte'

type W = { code: string; creator_name?: string | null; kontakt?: string | null; nachricht?: string | null; created_at: string; sprache: 'de' | 'en'; galerie: string; items: GalerieItem[] }

export default function WunschPage() {
  const { code } = useParams<{ code: string }>()
  const [w, setW] = useState<W | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'missing'>('loading')
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    fetch('/api/wunsch/' + code, { cache: 'no-store' }).then(async r => { if (!r.ok) { setState('missing'); return } setW(await r.json()); setState('ok') }).catch(() => setState('missing'))
  }, [code])
  const t = UI[w?.sprache === 'en' ? 'en' : 'de']
  const serif = { fontFamily: 'Georgia, "Times New Roman", ui-serif, serif' }
  const label = 'text-[11px] uppercase tracking-[0.18em] text-neutral-400'
  const liste = w ? w.items.map(i => '- ' + i.title + (i.price ? ' · ' + fmtPreis(i.price) : '')).join('\n') : ''
  const copy = async () => { try { await navigator.clipboard.writeText(liste) } catch {} setCopied(true); setTimeout(() => setCopied(false), 1500) }
  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-white text-neutral-900">
      <div className="max-w-[900px] mx-auto px-5 pt-8 pb-24">
        <div className="flex justify-center mb-6"><img src="/koluere-logo.png" alt="Koluré" className="h-16 w-auto select-none" draggable={false} /></div>
        {state === 'loading' && <p className="text-neutral-400 text-center py-16 text-sm tracking-wide">{t.loading}</p>}
        {state === 'missing' && <div className="text-center py-16"><h1 className="text-2xl mb-2" style={serif}>{t.notFound}</h1><p className="text-neutral-500 text-sm">{t.notFoundText}</p></div>}
        {state === 'ok' && w && (
          <>
            <div className="text-center mb-10">
              <p className={label + ' mb-3'}>{w.galerie || t.chosen} · {w.code}</p>
              <h1 className="text-[30px] leading-tight" style={serif}>{t.chosen}</h1>
              <p className="text-neutral-500 text-sm mt-2">{w.items.length} {w.items.length === 1 ? t.product : t.products} · {new Date(w.created_at).toLocaleDateString(w.sprache === 'en' ? 'en-GB' : 'de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}{w.creator_name ? ' · ' + w.creator_name : ''}</p>
              {w.nachricht && <p className="text-neutral-700 text-sm mt-3">„{w.nachricht}“</p>}
              <div className="w-10 h-px bg-neutral-900 mx-auto mt-6" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8">
              {w.items.map(i => (
                <div key={i.id}>
                  <div className="aspect-[4/5] bg-neutral-100 overflow-hidden">{i.images?.[0] && <img src={i.images[0]} alt={i.title} className="w-full h-full object-cover" />}</div>
                  <p className="text-sm mt-2 text-neutral-900">{i.title}</p>
                  {i.price && <p className="text-xs text-neutral-500">{fmtPreis(i.price)}</p>}
                </div>
              ))}
            </div>
            <div className="text-center mt-12"><button onClick={copy} className="text-[11px] uppercase tracking-[0.22em] border border-neutral-900 px-6 py-3">{copied ? '✓' : t.copyList}</button></div>
          </>
        )}
      </div>
    </div>
  )
}
