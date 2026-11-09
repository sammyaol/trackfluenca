'use client'
// Gemeinsame Bausteine fuer Kooperationen: Typ-Farben, Icons/Badges, kleine Charts (ohne Chart-Library).
import type { ReactNode } from 'react'

export type Koop = { id: string; brand_id: string; creator: string; creator_handle?: string | null; creator_url?: string | null; source: string; ref?: string; url?: string | null; start_date?: string | null; end_date?: string | null; media_url?: string | null; text?: string | null; platform?: string | null; likes?: number | null; views?: number | null; flags?: string[] | null; typ?: string | null }
export type CreatorInfo = { id?: string; name?: string; ig?: string | null; tt?: string | null; geschlecht?: string | null; land?: string | null; ig_follower?: number | null; tt_follower?: number | null; ig_tier?: string | null; status?: string | null }

// Inhaltstyp (wie Linkster: Story / Post / Reel), bei uns zusaetzlich TikTok-Video und Partnership-Ad
export const TYP: Record<string, { label: string; color: string }> = {
  reel: { label: 'Reel', color: '#5ee3a3' },
  post: { label: 'Post', color: '#ff7a8a' },
  carousel: { label: 'Karussell', color: '#c9b8ff' },
  story: { label: 'Story', color: '#8fc7ff' },
  video: { label: 'TikTok-Video', color: '#4fc3b8' },
  ad: { label: 'Partnership-Ad', color: '#e6c27a' },
}
export const typOf = (k: Koop) => (k.typ && TYP[k.typ]) ? k.typ : k.source === 'tiktok' ? 'video' : k.source === 'ad' ? 'ad' : 'post'
export const typColor = (k: Koop) => TYP[typOf(k)].color

export const fmtN = (n?: number | null) => n == null ? '—' : n >= 1e6 ? (n / 1e6).toFixed(1).replace('.', ',') + ' Mio' : n >= 1e4 ? Math.round(n / 1e3) + 'k' : n >= 1e3 ? (n / 1e3).toFixed(1).replace('.', ',') + 'k' : String(n)
export const tierOf = (f?: number | null) => f == null ? null : f >= 1e6 ? 'MEGA' : f >= 1e5 ? 'MACRO' : f >= 1e4 ? 'MICRO' : 'NANO'
export const TIER_CLS: Record<string, string> = { NANO: 'bg-amber-500/20 text-amber-300', MICRO: 'bg-teal-500/20 text-teal-300', MACRO: 'bg-purple-500/20 text-purple-300', MEGA: 'bg-pink-500/20 text-pink-300' }
export const flag = (land?: string | null) => { const c = (land || '').trim().toUpperCase().slice(0, 2); if (!/^[A-Z]{2}$/.test(c)) return land ? land.slice(0, 2) : ''; return String.fromCodePoint(...[...c].map(ch => 0x1f1e6 + ch.charCodeAt(0) - 65)) }
export const handleOf = (k: Koop) => (k.creator_handle || k.creator || '').replace(/^@/, '').toLowerCase()
export const postLink = (k: Koop) => k.url || (k.source === 'tiktok' && k.creator_handle ? `https://www.tiktok.com/@${k.creator_handle}` : k.creator_handle ? `https://www.instagram.com/${k.creator_handle}/` : '#')

// Icons (14px, currentColor)
const I = ({ d, title, cls = '' }: { d: ReactNode; title?: string; cls?: string }) => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={'inline-block ' + cls}><title>{title}</title>{d}</svg>
export const IcoInsta = ({ cls = '' }) => <I cls={cls} title="Instagram" d={<><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></>} />
export const IcoTikTok = ({ cls = '' }) => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className={'inline-block ' + cls}><title>TikTok</title><path d="M16.5 3c.4 2.4 1.9 4 4.5 4.3v3.3c-1.7 0-3.2-.5-4.5-1.4V15a6 6 0 1 1-6-6c.3 0 .7 0 1 .1v3.4a2.7 2.7 0 1 0 1.7 2.5V3h3.3z" /></svg>
export const IcoCheck = ({ cls = '' }) => <I cls={cls} title="Verifiziert" d={<><circle cx="12" cy="12" r="10" /><path d="m8 12 3 3 5-6" /></>} />
export const IcoAd = ({ cls = '' }) => <I cls={cls} title="Als Anzeige gekennzeichnet" d={<><path d="M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1z" /><path d="M16 9a4 4 0 0 1 0 6" /></>} />
export const IcoCollab = ({ cls = '' }) => <I cls={cls} title="Collab-Post" d={<><circle cx="9" cy="8" r="3.5" /><circle cx="16" cy="9" r="3" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M14.5 20a5 5 0 0 1 7-4.6" /></>} />
export const IcoFemale = ({ cls = '' }) => <I cls={cls} title="weiblich" d={<><circle cx="12" cy="9" r="5" /><path d="M12 14v7M9 18h6" /></>} />
export const IcoMale = ({ cls = '' }) => <I cls={cls} title="männlich" d={<><circle cx="10" cy="14" r="5" /><path d="M14 10l6-6M15 4h5v5" /></>} />
export const IcoFolder = ({ cls = '' }) => <I cls={cls} title="Im Creator-Pool" d={<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />} />
export const IcoLink = ({ cls = '' }) => <I cls={cls} title="Öffnen" d={<><path d="M14 4h6v6" /><path d="M20 4 10 14" /><path d="M20 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4" /></>} />

export const Badge = ({ children, title, cls = 'bg-white/[0.06] text-ink-3' }: { children: ReactNode; title?: string; cls?: string }) => <span title={title} className={`inline-flex items-center gap-1 h-5 px-1.5 rounded text-[10px] font-medium leading-none ${cls}`}>{children}</span>

// Badge-Zeile fuer einen Creator (Plattform, Tier, Geschlecht, Land, Kennzeichnung, im Pool)
export function CreatorBadges({ items, info, compact = false }: { items: Koop[]; info?: CreatorInfo | null; compact?: boolean }) {
  const hasIg = items.some(k => k.source !== 'tiktok'), hasTt = items.some(k => k.source === 'tiktok')
  const flags = new Set(items.flatMap(k => k.flags || []))
  const fol = info?.ig_follower || info?.tt_follower
  const tier = tierOf(fol)
  const g = (info?.geschlecht || '').toLowerCase()
  return (
    <div className="flex flex-wrap items-center gap-1">
      {tier && <Badge cls={TIER_CLS[tier]} title={`${fmtN(fol)} Follower`}>{tier}</Badge>}
      {hasIg && <Badge title="Instagram"><IcoInsta /></Badge>}
      {hasTt && <Badge title="TikTok"><IcoTikTok /></Badge>}
      {g.startsWith('w') || g.startsWith('f') ? <Badge title="weiblich" cls="bg-pink-500/15 text-pink-300"><IcoFemale /></Badge> : g.startsWith('m') ? <Badge title="männlich" cls="bg-sky-500/15 text-sky-300"><IcoMale /></Badge> : null}
      {info?.land && <Badge title={info.land}><span className="text-[12px] leading-none">{flag(info.land)}</span>{!compact && <span>{info.land.toUpperCase().slice(0, 2)}</span>}</Badge>}
      {flags.has('verifiziert') && <Badge cls="bg-sky-500/15 text-sky-300" title="Verifiziertes Profil"><IcoCheck /></Badge>}
      {flags.has('Anzeige') && <Badge cls="bg-amber-500/15 text-amber-300" title="Posts als Anzeige gekennzeichnet"><IcoAd />{!compact && 'Anzeige'}</Badge>}
      {flags.has('Collab') && <Badge cls="bg-purple-500/15 text-purple-300" title="Collab-Posts mit der Marke"><IcoCollab />{!compact && 'Collab'}</Badge>}
      {info?.id && <Badge cls="bg-emerald-500/15 text-emerald-300" title={`Im Creator-Pool${info.status ? ' · ' + info.status : ''}`}><IcoFolder />{!compact && 'Pool'}</Badge>}
    </div>
  )
}

export const Kpi = ({ label, value, sub, color = 'text-accent' }: { label: string; value: ReactNode; sub?: ReactNode; color?: string }) => (
  <div className="bg-surface-3/60 rounded-apple-md border border-hairline-soft px-4 py-3 flex items-end justify-between gap-3 min-w-0">
    <div className="min-w-0"><div className="text-ink-3 text-[11px] font-medium">{label}</div>{sub && <div className="text-ink-4 text-[10px] mt-0.5 truncate">{sub}</div>}</div>
    <div className={`text-xl font-semibold tabular-nums ${color}`}>{value}</div>
  </div>
)

// Horizontale Balken (Top-Listen)
export function Bars({ rows, color, max, onClick }: { rows: { key: string; label: ReactNode; value: number; color?: string }[]; color?: string; max?: number; onClick?: (key: string) => void }) {
  const m = max || Math.max(1, ...rows.map(r => r.value))
  return (
    <div className="space-y-1.5">
      {rows.map(r => (
        <button key={r.key} onClick={() => onClick?.(r.key)} disabled={!onClick} className="w-full grid grid-cols-[130px_1fr_44px] items-center gap-2 text-left disabled:cursor-default group">
          <div className="text-ink-2 text-[11px] truncate group-hover:text-ink-1">{r.label}</div>
          <div className="h-3 rounded-sm bg-white/[0.04] overflow-hidden"><div className="h-full rounded-sm" style={{ width: `${(r.value / m) * 100}%`, background: r.color || color || '#e6c27a' }} /></div>
          <div className="text-ink-3 text-[11px] text-right tabular-nums">{r.value.toLocaleString('de-DE')}</div>
        </button>
      ))}
    </div>
  )
}

// Monats-Saeulen, gestapelt nach Typ
export function MonthChart({ items, months = 13, height = 120 }: { items: Koop[]; months?: number; height?: number }) {
  const end = new Date(); end.setDate(1)
  const cols: { key: string; label: string; year: boolean; parts: Record<string, number>; total: number }[] = []
  for (let i = months - 1; i >= 0; i--) { const d = new Date(end); d.setMonth(d.getMonth() - i); cols.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString('de-DE', { month: 'short' }), year: d.getMonth() === 0 || i === months - 1, parts: {}, total: 0 }) }
  const idx = new Map(cols.map((c, i) => [c.key, i]))
  for (const k of items) { const i = idx.get((k.start_date || '').slice(0, 7)); if (i == null) continue; const t = typOf(k); cols[i].parts[t] = (cols[i].parts[t] || 0) + 1; cols[i].total++ }
  const max = Math.max(1, ...cols.map(c => c.total))
  return (
    <div>
      <div className="flex items-end gap-1" style={{ height }}>
        {cols.map(c => (
          <div key={c.key} className="flex-1 flex flex-col justify-end items-stretch group relative" style={{ height }} title={`${c.key}: ${c.total} Kooperationen`}>
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] text-ink-3 opacity-0 group-hover:opacity-100 tabular-nums">{c.total}</div>
            <div className="flex flex-col-reverse rounded-t-sm overflow-hidden" style={{ height: Math.max(c.total ? 3 : 0, Math.round((c.total / max) * height)) }}>
              {Object.entries(c.parts).sort((a, b) => b[1] - a[1]).map(([t, n]) => <div key={t} style={{ flex: n, background: TYP[t]?.color || '#999' }} />)}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-1 mt-1">{cols.map(c => <div key={c.key} className={`flex-1 text-center text-[9px] truncate ${c.year ? 'text-ink-2 font-semibold' : 'text-ink-4'}`}>{c.label}{c.year ? ` ${c.key.slice(2, 4)}` : ''}</div>)}</div>
    </div>
  )
}

// Zeitleiste: Punkte auf einer Zeile; Farbe = Fuellung (Marke oder Typ), Rand = Typ; Groesse nach Engagement
export function DotRow({ items, pos, fill, ticks, onOpen }: { items: Koop[]; pos: (d: string) => number; fill: (k: Koop) => string; ticks: { left: number; width: number }[]; onOpen?: (k: Koop) => void }) {
  const size = (k: Koop) => { const e = k.source === 'tiktok' ? (k.views || 0) / 20 : (k.likes || 0); return Math.max(12, Math.min(26, 12 + Math.log10(Math.max(1, e)) * 3)) }
  return (
    <div className="relative h-14">
      <div className="absolute inset-y-0 left-0 right-0">{ticks.map((t, i) => <span key={i} className={`absolute top-0 bottom-0 border-l border-hairline-soft/50 ${i % 2 ? 'bg-white/[0.025]' : ''}`} style={{ left: `${t.left}%`, width: `${t.width}%` }} />)}</div>
      <div className="absolute left-0 right-0 top-1/2 border-t border-hairline-soft/60" />
      {items.filter(k => k.start_date).map(k => {
        const s = size(k)
        const t = TYP[typOf(k)]
        const tip = `${t.label} · ${new Date(k.start_date!).toLocaleDateString('de-DE')}${k.views ? ` · ${fmtN(k.views)} Views` : ''}${k.likes ? ` · ${fmtN(k.likes)} Likes` : ''}${(k.flags || []).length ? ` · ${(k.flags || []).join(', ')}` : ''}${k.text ? '\n' + k.text.slice(0, 120) : ''}\nKlick: Post öffnen`
        return <a key={k.id} href={postLink(k)} onClick={e => { if (onOpen) { e.preventDefault(); onOpen(k) } }} target="_blank" rel="noreferrer" title={tip} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full border-[3px] shadow-[0_0_0_1px_rgba(0,0,0,.5)] hover:scale-125 hover:z-10 transition" style={{ left: `${pos(k.start_date!)}%`, width: s, height: s, background: fill(k), borderColor: t.color }} />
      })}
    </div>
  )
}

// Zeitachse aus Zeitraum: Ticks + Positionsfunktion
export function makeAxis(from: Date, to: Date) {
  const start = new Date(from); const end = new Date(to)
  const span = Math.max(1, (end.getTime() - start.getTime()) / 86400000 + 1)
  const pos = (d: string) => Math.max(0, Math.min(100, ((new Date(d).getTime() - start.getTime()) / 86400000) / span * 100))
  const ticks: { label: string; left: number; width: number; strong?: boolean }[] = []
  const isoD = (d: Date) => d.toISOString().slice(0, 10)
  if (span <= 45) { const c = new Date(start); while (c <= end) { ticks.push({ label: c.getDate() + '.', left: pos(isoD(c)), width: 100 / span, strong: c.getDay() === 1 }); c.setDate(c.getDate() + 1) } }
  else if (span <= 125) { const c = new Date(start); c.setDate(c.getDate() - ((c.getDay() + 6) % 7)); while (c <= end) { const n = new Date(c); n.setDate(n.getDate() + 7); const l = Math.max(0, pos(isoD(c))); const r = Math.min(100, pos(isoD(n))); ticks.push({ label: `${c.getDate()}.${c.getMonth() + 1}.`, left: l, width: r - l, strong: c.getDate() <= 7 }); c.setDate(c.getDate() + 7) } }
  else { const c = new Date(start.getFullYear(), start.getMonth(), 1); while (c <= end) { const n = new Date(c.getFullYear(), c.getMonth() + 1, 1); const l = Math.max(0, pos(isoD(c))); const r = Math.min(100, pos(isoD(n))); ticks.push({ label: c.toLocaleDateString('de-DE', { month: 'short' }) + (c.getMonth() === 0 || ticks.length === 0 ? ` ${String(c.getFullYear()).slice(2)}` : ''), left: l, width: r - l, strong: c.getMonth() === 0 }); c.setMonth(c.getMonth() + 1) } }
  return { ticks, pos, span }
}

export const AxisHeader = ({ ticks }: { ticks: { label: string; left: number; width: number; strong?: boolean }[] }) => (
  <div className="relative h-8 overflow-hidden">{ticks.map((t, i) => <span key={i} className={`absolute top-0 bottom-0 flex items-center justify-center text-[10px] overflow-hidden whitespace-nowrap ${i % 2 ? 'bg-white/[0.025]' : ''} ${t.strong ? 'text-ink-2 font-semibold' : ''}`} style={{ left: `${t.left}%`, width: `${t.width}%` }}>{ticks.length > 40 && i % 2 ? '' : t.label}</span>)}</div>
)
