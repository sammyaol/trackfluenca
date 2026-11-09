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
    // Variante 2: Daten im URL-Fragment (#data=base64), weil facebook.com weder fetch noch Popups zu uns erlaubt
    const m = location.hash.match(/^#data=(.+)$/)
    if (m) {
      ;(async () => {
        try {
          const d = JSON.parse(decodeURIComponent(escape(atob(m[1].replace(/-/g, '+').replace(/_/g, '/')))))
          history.replaceState(null, '', location.pathname)
          if (Array.isArray(d.creators)) {
            setLog([`${d.creators.length} Creator-Profile empfangen – speichere…`])
            let n = 0
            for (let i = 0; i < d.creators.length; i += 100) {
              const r = await fetch('/api/ads/creators', { method: 'POST', headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + d.key }, body: JSON.stringify({ user_id: d.user_id, creators: d.creators.slice(i, i + 100) }) })
              const j = await r.json().catch(() => ({}))
              if (r.ok) n += j.saved || 0; else setLog(l => [...l, 'Fehler: ' + (j.error || r.status)])
            }
            setLog(l => [...l, `Fertig: ${n} Profile gespeichert`])
            return
          }
          if (Array.isArray(d.koops)) {
            setLog([`${d.koops.length} Kooperationen empfangen für Marke ${d.brand_id} – importiere…`])
            let ins = 0
            // 200er-Pakete, 4 parallel
            const parts: unknown[][] = []; for (let i = 0; i < d.koops.length; i += 200) parts.push(d.koops.slice(i, i + 200))
            for (let i = 0; i < parts.length; i += 4) {
              await Promise.all(parts.slice(i, i + 4).map(async part => {
                const r = await fetch('/api/ads/koops', { method: 'POST', headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + d.key }, body: JSON.stringify({ user_id: d.user_id, brand_id: d.brand_id, koops: part }) })
                const j = await r.json().catch(() => ({}))
                if (r.ok) ins += j.inserted || 0; else setLog(l => [...l, 'Fehler: ' + (j.error || r.status)])
              }))
              setLog(l => [l[0], `${Math.min(d.koops.length, (i + 4) * 200)} / ${d.koops.length} …`])
            }
            setLog(l => [...l, `Fertig: ${ins} Kooperationen gespeichert`])
            return
          }
          const ads: unknown[] = d.ads || []
          setLog([`${ads.length} Ads empfangen für Marke ${d.brand_id} – importiere…`])
          let ins = 0, upd = 0
          for (let i = 0; i < ads.length; i += 40) {
            const r = await fetch('/api/ads/import', { method: 'POST', headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + d.key }, body: JSON.stringify({ user_id: d.user_id, brand_id: d.brand_id, ads: ads.slice(i, i + 40) }) })
            const j = await r.json().catch(() => ({}))
            if (r.ok) { ins += j.inserted; upd += j.updated } else setLog(l => [...l, 'Fehler: ' + (j.error || r.status)])
          }
          setLog(l => [...l, `Fertig: ${ins} neu, ${upd} aktualisiert`])
          ;(window as any).__done = { inserted: ins, updated: upd }
        } catch (e: any) { setLog(l => [...l, 'Fehler: ' + e.message]) }
      })()
    }
    return () => window.removeEventListener('message', h)
  }, [])
  return <div className="p-6 text-sm text-ink-2 font-mono space-y-1">{log.map((l, i) => <div key={i}>{l}</div>)}</div>
}
