'use client'
// Creator-Profil (wie Linkster "Profile → Brand Cooperations"): alle Kooperationen eines Creators ueber alle Marken.
import { useEffect, useMemo, useState } from 'react'
import { type Koop, type CreatorInfo, TYP, typOf, typColor, Kpi, Bars, MonthChart, DotRow, makeAxis, AxisHeader, CreatorBadges, postLink, fmtN, IcoInsta, IcoTikTok, IcoLink, BrandLogo } from './koopUi'

type Props = {
  handle: string; name?: string
  api: (url: string, method?: string, body?: any) => Promise<{ ok: boolean; j: any }>
  brandName: (id: string) => string; brandColor: (id: string) => string; brandLogo: (id: string) => string | null
  info: CreatorInfo | null
  onClose: () => void
  onAddCreator: (r: { creator: string; handle: string | null; url: string | null }) => Promise<void>
  onBrand?: (id: string) => void
}

export default function CreatorProfile({ handle, name, api, brandName, brandColor, brandLogo, info, onClose, onAddCreator, onBrand }: Props) {
  const [items, setItems] = useState<Koop[] | null>(null)
  const [tab, setTab] = useState<'koops' | 'posts' | 'stats'>('koops')
  const [range, setRange] = useState<'12' | '24' | 'all'>('24')
  const [adding, setAdding] = useState(false)

  useEffect(() => { let alive = true; setItems(null); api('/api/ads/koops?handle=' + encodeURIComponent(handle)).then(({ ok, j }) => { if (alive) setItems(ok ? j.koops : []) }); return () => { alive = false } }, [handle, api])

  const all = items || []
  const first = all[0]
  const displayName = name || first?.creator || handle
  const url = first?.creator_url || (all.some(k => k.source === 'tiktok') && !all.some(k => k.source !== 'tiktok') ? `https://www.tiktok.com/@${handle}` : `https://www.instagram.com/${handle}/`)
  const stats = useMemo(() => {
    const byBrand = new Map<string, Koop[]>()
    for (const k of all) { const a = byBrand.get(k.brand_id) || []; a.push(k); byBrand.set(k.brand_id, a) }
    const brands = [...byBrand.entries()].map(([id, ks]) => ({ id, items: ks, n: ks.length, last: ks.reduce((m, k) => (k.start_date || '') > m ? (k.start_date || '') : m, '') })).sort((a, b) => b.n - a.n || b.last.localeCompare(a.last))
    const dates = all.map(k => k.start_date).filter(Boolean).sort() as string[]
    const flagged = all.filter(k => (k.flags || []).some(f => f === 'Anzeige' || f === 'Collab')).length
    const likes = all.filter(k => k.likes); const views = all.filter(k => k.views)
    const byTyp: Record<string, number> = {}; for (const k of all) { const t = typOf(k); byTyp[t] = (byTyp[t] || 0) + 1 }
    const longTerm = brands.filter(b => b.n >= 3).length
    return { brands, first: dates[0], last: dates[dates.length - 1], flagged, avgLikes: likes.length ? likes.reduce((s, k) => s + (k.likes || 0), 0) / likes.length : 0, avgViews: views.length ? views.reduce((s, k) => s + (k.views || 0), 0) / views.length : 0, byTyp, longTerm }
  }, [all])

  const axis = useMemo(() => {
    const end = new Date()
    let start = new Date(end)
    if (range === 'all' && stats.first) { start = new Date(stats.first); start.setDate(1); const min = new Date(end); min.setMonth(min.getMonth() - 59); if (start < min) start = min }
    else { start.setMonth(start.getMonth() - (range === '12' ? 11 : 23)); start.setDate(1) }
    return makeAxis(start, end)
  }, [range, stats.first])

  const dat = (d?: string | null) => d ? new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'
  const sorted = useMemo(() => [...all].sort((a, b) => (b.start_date || '').localeCompare(a.start_date || '')), [all])

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center p-4 md:p-8 overflow-y-auto" onClick={onClose}>
      <div className="bg-surface-1 border border-hairline rounded-apple-lg w-full max-w-6xl" onClick={e => e.stopPropagation()}>
        {/* Kopf */}
        <div className="p-5 md:p-6 border-b border-hairline-soft flex flex-wrap items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-surface-3 overflow-hidden flex-shrink-0 border border-hairline-soft">{first?.media_url && <img src={first.media_url} alt="" className="w-full h-full object-cover" />}</div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><h2 className="text-ink-1 font-semibold text-lg truncate">{displayName}</h2><a href={url} target="_blank" rel="noreferrer" className="text-ink-3 text-sm hover:text-ink-1 inline-flex items-center gap-1">@{handle} <IcoLink /></a></div>
            <div className="mt-1.5"><CreatorBadges items={all} info={info} /></div>
            {info && (info.ig_follower || info.tt_follower) && <div className="text-ink-4 text-[11px] mt-1">{info.ig_follower ? <><IcoInsta cls="mr-1" />{fmtN(info.ig_follower)} Follower</> : null}{info.tt_follower ? <span className="ml-3"><IcoTikTok cls="mr-1" />{fmtN(info.tt_follower)} Follower</span> : null}</div>}
          </div>
          <div className="flex items-center gap-2">
            <a href={url} target="_blank" rel="noreferrer" className="press text-xs px-3 py-1.5 rounded-full border border-hairline text-ink-2 hover:text-ink-1">Profil öffnen ↗</a>
            {!info?.id && <button onClick={async () => { setAdding(true); await onAddCreator({ creator: displayName, handle, url }); setAdding(false) }} disabled={adding} className="press text-xs px-3 py-1.5 rounded-full bg-accent text-[#1a1507] font-semibold disabled:opacity-50">{adding ? '…' : '+ In Creator-Pool'}</button>}
            <button onClick={onClose} className="text-ink-4 hover:text-ink-1 text-xl leading-none px-2">×</button>
          </div>
        </div>

        {items === null ? <div className="text-ink-4 text-sm py-16 text-center">Lädt…</div> : (
          <div className="p-5 md:p-6 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
              <Kpi label="Kooperationen" value={all.length} sub={stats.first ? `${dat(stats.first)} – ${dat(stats.last)}` : undefined} />
              <Kpi label="Marken" value={stats.brands.length} sub={`${stats.longTerm} langfristig (≥3×)`} color="text-ink-1" />
              <Kpi label="Gekennzeichnet" value={all.length ? Math.round(stats.flagged / all.length * 100) + ' %' : '—'} sub="Anzeige / Collab" color="text-amber-300" />
              <Kpi label="Ø Likes" value={stats.avgLikes ? fmtN(Math.round(stats.avgLikes)) : '—'} sub="Instagram-Posts" color="text-ink-1" />
              <Kpi label="Ø Views" value={stats.avgViews ? fmtN(Math.round(stats.avgViews)) : '—'} sub="TikTok-Videos" color="text-ink-1" />
              <Kpi label="Zuletzt" value={<span className="text-base">{dat(stats.last)}</span>} sub={stats.brands[0] ? brandName(stats.brands[0].id) : undefined} color="text-ink-1" />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex rounded-full border border-hairline p-0.5">{([['koops', 'Marken-Zeitleiste'], ['posts', `Posts (${all.length})`], ['stats', 'Statistik']] as const).map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`text-xs px-3 py-1 rounded-full ${tab === k ? 'bg-accent text-[#1a1507] font-semibold' : 'text-ink-3 hover:text-ink-1'}`}>{l}</button>)}</div>
              {tab === 'koops' && <div className="flex rounded-full border border-hairline p-0.5 ml-auto">{([['12', '12 Monate'], ['24', '24 Monate'], ['all', 'Alles']] as const).map(([k, l]) => <button key={k} onClick={() => setRange(k)} className={`text-[11px] px-2.5 py-1 rounded-full ${range === k ? 'bg-white/10 text-ink-1' : 'text-ink-4 hover:text-ink-2'}`}>{l}</button>)}</div>}
              <div className="hidden md:flex items-center gap-3 text-[10px] text-ink-4 ml-auto">{Object.entries(TYP).filter(([t]) => stats.byTyp[t]).map(([t, v]) => <span key={t} className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: v.color }} />{v.label}</span>)}</div>
            </div>

            {tab === 'koops' && (
              <div className="bg-surface-2 rounded-apple-lg border border-hairline-soft overflow-hidden">
                <div className="grid grid-cols-[200px_1fr_90px] border-b border-hairline-soft text-[10px] uppercase tracking-wide text-ink-4"><div className="px-4 py-2">Marke</div><AxisHeader ticks={axis.ticks} /><div className="px-3 py-2 text-right">Koops</div></div>
                {stats.brands.map(b => (
                  <div key={b.id} className="grid grid-cols-[200px_1fr_90px] items-center border-b border-hairline-soft/60 hover:bg-white/[0.02]">
                    <button onClick={() => onBrand?.(b.id)} className="px-4 py-2 text-left min-w-0"><div className="flex items-center gap-2 min-w-0"><BrandLogo src={brandLogo(b.id)} name={brandName(b.id)} color={brandColor(b.id)} size={20} /><span className="text-ink-1 text-sm font-medium truncate">{brandName(b.id)}</span></div><div className="text-ink-4 text-[10px] pl-7">zuletzt {dat(b.last)}</div></button>
                    <DotRow items={b.items} pos={axis.pos} fill={() => brandColor(b.id)} ticks={axis.ticks} />
                    <div className="px-3 py-2 text-right"><span className="text-ink-1 text-sm font-semibold">{b.n}×</span></div>
                  </div>
                ))}
                {!stats.brands.length && <div className="text-ink-4 text-sm py-10 text-center">Keine Kooperationen gefunden</div>}
              </div>
            )}

            {tab === 'posts' && (
              <div className="grid gap-1.5 max-h-[60vh] overflow-y-auto pr-1">
                {sorted.map(k => (
                  <div key={k.id} className="flex items-center gap-3 bg-surface-3 rounded-apple-sm border border-hairline-soft p-1.5">
                    <a href={postLink(k)} target="_blank" rel="noreferrer" className="w-12 h-14 rounded bg-black/30 overflow-hidden flex-shrink-0">{k.media_url && <img src={k.media_url} alt="" className="w-full h-full object-cover" loading="lazy" />}</a>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[11px] flex-wrap"><span className="font-medium inline-flex items-center gap-1" style={{ color: brandColor(k.brand_id) }}><BrandLogo src={brandLogo(k.brand_id)} name={brandName(k.brand_id)} color={brandColor(k.brand_id)} size={12} />{brandName(k.brand_id)}</span><span className="text-ink-4">{dat(k.start_date)}</span><span className="px-1.5 rounded-full text-[10px]" style={{ background: typColor(k) + '22', color: typColor(k) }}>{TYP[typOf(k)].label}</span>{(k.flags || []).map(f => <span key={f} className="text-amber-300 text-[10px]">{f}</span>)}</div>
                      <div className="text-ink-3 text-[11px] truncate">{(k.text || '—').replace(/^\[[^\]]*\]\s*/, '').replace(/^\d+ Likes · /, '').replace(/^\d+k Views · (\d+ Likes · )?/, '')}</div>
                      <div className="text-ink-4 text-[10px]">{k.views ? `${fmtN(k.views)} Views · ` : ''}{k.likes ? `${fmtN(k.likes)} Likes` : ''}</div>
                    </div>
                    <a href={postLink(k)} target="_blank" rel="noreferrer" className="press flex-shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-accent text-[#1a1507] font-semibold">Öffnen ↗</a>
                  </div>
                ))}
              </div>
            )}

            {tab === 'stats' && (
              <div className="grid lg:grid-cols-2 gap-4">
                <div className="bg-surface-3/40 rounded-apple-md border border-hairline-soft p-4"><div className="text-ink-2 text-xs font-medium mb-5">Posting-Verlauf (Kooperationen pro Monat)</div><MonthChart items={all} months={13} height={120} /></div>
                <div className="bg-surface-3/40 rounded-apple-md border border-hairline-soft p-4"><div className="text-ink-2 text-xs font-medium mb-2">Top-Marken</div><Bars rows={stats.brands.slice(0, 10).map(b => ({ key: b.id, label: <span className="inline-flex items-center gap-1.5"><BrandLogo src={brandLogo(b.id)} name={brandName(b.id)} color={brandColor(b.id)} size={14} />{brandName(b.id)}</span>, value: b.n, color: brandColor(b.id) }))} onClick={onBrand} /></div>
                <div className="bg-surface-3/40 rounded-apple-md border border-hairline-soft p-4"><div className="text-ink-2 text-xs font-medium mb-2">Inhaltstypen</div><Bars rows={Object.entries(stats.byTyp).sort((a, b) => b[1] - a[1]).map(([t, n]) => ({ key: t, label: TYP[t].label, value: n, color: TYP[t].color }))} /></div>
                <div className="bg-surface-3/40 rounded-apple-md border border-hairline-soft p-4 text-xs text-ink-3 space-y-1.5">
                  <div className="text-ink-2 font-medium mb-1">Einordnung</div>
                  <div>Werbe-Anteil (Anzeige/Collab): <span className="text-ink-1">{all.length ? Math.round(stats.flagged / all.length * 100) : 0} %</span></div>
                  <div>Langfristige Partner (≥ 3 Koops): <span className="text-ink-1">{stats.longTerm}</span> von {stats.brands.length} Marken</div>
                  <div>Markenstreuung: <span className="text-ink-1">{all.length ? (stats.brands.length / all.length).toFixed(2).replace('.', ',') : '—'}</span> <span className="text-ink-4">(Marken ÷ Koops; niedrig = treu, hoch = viele Marken)</span></div>
                  <div>Aktiv seit: <span className="text-ink-1">{dat(stats.first)}</span> · zuletzt <span className="text-ink-1">{dat(stats.last)}</span></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
