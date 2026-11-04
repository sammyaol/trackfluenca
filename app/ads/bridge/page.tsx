'use client'
import { useEffect, useState } from 'react'

// Bruecke fuer den Browser-Import: Die Ad-Library-Seite (facebook.com) darf wegen CSP nicht direkt zu uns posten.
// Sie oeffnet dieses Fenster und schickt die ausgelesenen Ads per postMessage; wir leiten sie same-origin an /api/ads/import weiter.
export default function Bridge() {
  const [log, setLog] = useState<string[]>(['Warte auf Daten…'])
  useEffect(() => {
    const h = async (e: MessageEvent) => {
      if (!/^https:\/\/(www\.)?facebook\.com$/.test(e.origin)) return
      const d = e.data || {}
      if (d.type !== 'ads-import') return
      try {
        const r = await fetch('/api/ads/import', { method: 'POST', headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + d.key }, body: JSON.stringify({ user_id: d.user_id, brand_id: d.brand_id, ads: d.ads }) })
        const j = await r.json().catch(() => ({}))
        setLog(l => [...l, `${d.ads?.length || 0} Ads → ${r.ok ? `${j.inserted} neu, ${j.updated} aktualisiert` : 'Fehler: ' + (j.error || r.status)}`])
        ;(e.source as Window)?.postMessage({ type: 'ads-import-result', batch: d.batch, ok: r.ok, ...j }, e.origin)
      } catch (err: any) {
        ;(e.source as Window)?.postMessage({ type: 'ads-import-result', batch: d.batch, ok: false, error: err.message }, e.origin)
      }
    }
    window.addEventListener('message', h)
    if (window.opener) window.opener.postMessage({ type: 'ads-bridge-ready' }, '*')
    return () => window.removeEventListener('message', h)
  }, [])
  return <div className="p-6 text-sm text-ink-2 font-mono space-y-1">{log.map((l, i) => <div key={i}>{l}</div>)}</div>
}
