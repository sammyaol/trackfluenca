'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function CompanyBanner() {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const path = usePathname()
  
  useEffect(() => {
    if (path === '/login' || path === '/unternehmen') return
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    sb.auth.getSession().then(async ({ data }) => {
      if (!data.session) return
      const res = await fetch('/api/company', { headers: { authorization: 'Bearer ' + data.session.access_token } })
      const d = await res.json()
      const complete = d?.firma_name && d?.strasse && d?.plz && d?.ort && (d?.ust_id || d?.steuer_nummer)
      if (!complete) setShow(true)
    })
  }, [path])

  if (!show || dismissed) return null

  return (
    <div className="fixed top-0 left-0 right-0 md:left-60 z-50 bg-amber-500/10 backdrop-blur border-b border-amber-500/20 px-4 py-2">
      <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-amber-400">⚠</span>
          <span className="text-amber-400">Unternehmensdaten unvollständig. Bitte vervollständigen damit du Rechnungen erstellen kannst.</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/unternehmen" className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/30 transition-colors">Jetzt vervollständigen</Link>
          <button onClick={() => setDismissed(true)} className="text-amber-400/60 hover:text-amber-400 text-xs px-1">✕</button>
        </div>
      </div>
    </div>
  )
}
