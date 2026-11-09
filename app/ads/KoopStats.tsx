'use client'
// Statistik-Tab fuer Kooperationen (wie Linkster "Brand Statistics"): Koops pro Monat, Kennzahlen, Verteilung, Top-Creator.
import { useMemo } from 'react'
import { type Koop, type CreatorInfo, TYP, typOf, Kpi, Bars, MonthChart, handleOf, CreatorBadges } from './koopUi'

type Props = { items: Koop[]; brandName: (id: string) => string; brandColor: (id: string) => string; creatorInfo: (handle: string) => CreatorInfo | null; onCreator: (handle: string) => void; onBrand?: (id: string) => void; selectedBrands: string[] }

export default function KoopStats({ items, brandName, brandColor, creatorInfo, onCreator, onBrand, selectedBrands }: Props) {
  const s = useMemo(() => {
    const byCreator = new Map<string, { name: string; items: Koop[]; brands: Set<string> }>()
    const byBrand = new Map<string, number>(); const byTyp: Record<string, number> = {}; const bySrc: Record<string, number> = {}
    let flagged = 0, likes = 0, likesN = 0, views = 0, viewsN = 0
    for (const k of items) {
      const h = handleOf(k); const c = byCreator.get(h) || { name: k.creator, items: [], brands: new Set<string>() }; c.items.push(k); c.brands.add(k.brand_id); byCreator.set(h, c)
      byBrand.set(k.brand_id, (byBrand.get(k.brand_id) || 0) + 1); const t = typOf(k); byTyp[t] = (byTyp[t] || 0) + 1
      const src = k.source === 'tiktok' ? 'TikTok' : k.source === 'ad' ? 'Meta Ads' : 'Instagram'; bySrc[src] = (bySrc[src] || 0) + 1
      if ((k.flags || []).some(f => f === 'Anzeige' || f === 'Collab')) flagged++
      if (k.likes) { likes += k.likes; likesN++ } if (k.views) { views += k.views; viewsN++ }
    }
    const creators = [...byCreator.entries()].map(([h, c]) => ({ handle: h, ...c, n: c.items.length })).sort((a, b) => b.n - a.n)
    const multi = creators.filter(c => c.n > 1).length
    const months = new Set(items.map(k => (k.start_date || '').slice(0, 7)).filter(Boolean))
    return { creators, multi, byBrand: [...byBrand.entries()].sort((a, b) => b[1] - a[1]), byTyp, bySrc, flagged, avgLikes: likesN ? likes / likesN : 0, avgViews: viewsN ? views / viewsN : 0, months: months.size }
  }, [items])

  const n = items.length
  const fmt = (x: number) => x.toLocaleString('de-DE', { maximumFractionDigits: 1 })
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
        <Kpi label="Kooperationen" value={n.toLocaleString('de-DE')} sub={s.months ? `in ${s.months} Monaten` : undefined} />
        <Kpi label="Creator" value={s.creators.length.toLocaleString('de-DE')} sub={`${s.multi} mehrfach gebucht`} color="text-ink-1" />
        <Kpi label="Koops je Creator" value={s.creators.length ? fmt(n / s.creators.length) : '—'} sub="Ø Buchungen" color="text-ink-1" />
        <Kpi label="Ø pro Monat" value={s.months ? fmt(n / s.months) : '—'} sub="Kooperationen" color="text-ink-1" />
        <Kpi label="Gekennzeichnet" value={n ? Math.round(s.flagged / n * 100) + ' %' : '—'} sub="Anzeige / Collab" color="text-amber-300" />
        <Kpi label="Ø Engagement" value={s.avgLikes ? (s.avgLikes >= 1000 ? (s.avgLikes / 1000).toFixed(1).replace('.', ',') + 'k' : Math.round(s.avgLikes)) : '—'} sub={s.avgViews ? `Likes · ${Math.round(s.avgViews / 1000)}k Views (TikTok)` : 'Likes je Post'} color="text-ink-1" />
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        <div className="bg-surface-3/40 rounded-apple-md border border-hairline-soft p-4">
          <div className="flex items-center justify-between mb-5"><div className="text-ink-2 text-xs font-medium">Kooperationen pro Monat</div>
            <div className="flex flex-wrap gap-2 text-[10px] text-ink-4">{Object.entries(TYP).filter(([t]) => s.byTyp[t]).map(([t, v]) => <span key={t} className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: v.color }} />{v.label} {s.byTyp[t]}</span>)}</div>
          </div>
          <MonthChart items={items} months={13} height={130} />
        </div>
        <div className="bg-surface-3/40 rounded-apple-md border border-hairline-soft p-4 space-y-4">
          <div><div className="text-ink-2 text-xs font-medium mb-2">Nach Quelle</div>
            <Bars rows={Object.entries(s.bySrc).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ key: k, label: k, value: v, color: k === 'TikTok' ? '#4fc3b8' : k === 'Meta Ads' ? '#e6c27a' : '#ff7a8a' }))} /></div>
          {s.byBrand.length > 1 && <div><div className="text-ink-2 text-xs font-medium mb-2">Nach Marke</div>
            <Bars rows={s.byBrand.slice(0, 8).map(([id, v]) => ({ key: id, label: brandName(id), value: v, color: brandColor(id) }))} onClick={onBrand} /></div>}
        </div>
      </div>

      <div className="bg-surface-3/40 rounded-apple-md border border-hairline-soft p-4">
        <div className="text-ink-2 text-xs font-medium mb-3">Top-Creator{selectedBrands.length === 1 ? ` bei ${brandName(selectedBrands[0])}` : ''} <span className="text-ink-4 font-normal">· nach Buchungen</span></div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-1.5">
          {s.creators.slice(0, 15).map((c, i) => (
            <button key={c.handle} onClick={() => onCreator(c.handle)} className="flex items-center gap-2 text-left hover:bg-white/[0.03] rounded px-1.5 py-1 min-w-0">
              <span className="text-ink-4 text-[10px] w-4 tabular-nums">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="text-ink-1 text-xs font-medium truncate">{c.name} <span className="text-ink-4 font-normal">@{c.handle}</span></div>
                <CreatorBadges items={c.items} info={creatorInfo(c.handle)} compact />
              </div>
              <div className="text-right"><div className="text-ink-1 text-sm font-semibold tabular-nums">{c.n}×</div>{c.brands.size > 1 && <div className="text-accent text-[10px]">{c.brands.size} Marken</div>}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
