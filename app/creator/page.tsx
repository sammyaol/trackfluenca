'use client'
import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { createBrowserClient } from '@supabase/ssr'

const avatarSrc = (url?: string | null) => {
  if (!url) return url as any
  if (url.includes('cdninstagram.com') || url.includes('fbcdn.net') || url.includes('tiktokcdn')) {
    return '/api/img-proxy?url=' + encodeURIComponent(url)
  }
  return url
}
const avatarOnError = (fallbackUrl?: string | null) => (e: any) => {
  const img = e.currentTarget as HTMLImageElement
  if (fallbackUrl && img.dataset.fb !== '1') {
    img.dataset.fb = '1'
    img.src = avatarSrc(fallbackUrl) as string
  } else {
    img.style.display = 'none'
  }
}



type Creator = {
  name: string; ig: string; tt: string;
  igFollower: number; ttFollower: number; igTier: string; ttTier: string;
  igEr: number; ttEr: number; ttAvgViews: number; ttAvgLikes: number; ttAvgComments: number;
  overallTier: string; gesamtReichweite: number;
  status: string; prio: string; kategorie: string; mgmt: string; notizen: string;
  kampagne: string; buchungstyp: string; fee: number; produkt: number;
  gesamt: number; promoCode: string; datum: string;
  orgUmsatz: number; orgKlicks: number; orgCPK: number; orgROAS: number; orgBestellungen: number; orgBW: number;
  adSpend: number; adUmsatz: number; adKlicks: number; adCPK: number; adROAS: number; adBestellungen: number;
  gesUmsatz: number; gesROAS: number; gesKlicks: number;
  storyViews: number; storyWert: number; ttWert: number; reelWert: number; affiliatePct: string;
  tkpTT: number; tkpStory: number; tkpPost: number;
  igImage?: string; igVerified?: boolean; igAvgLikes?: number; igAvgComments?: number;
  igAvgReelViews?: number; igAvgReelLikes?: number; igAvgReelComments?: number; igAvgReelEr?: number;
  igTopCountries?: {name: string, pct: number}[];
  igTopCities?: {name: string, pct: number}[];
  igGenderMale?: number; igGenderFemale?: number;
  igTopAge?: string; igAgeDistribution?: {age: string, pct: number}[];
  geschlecht?: string;
  land?: string
  igRealFollowers?: number; igFakeFollowers?: number;
  igFollowerWachstum7d?: number; igQualityScore?: number; igPostsPerWeek?: number;
  ttImage?: string; ttVerified?: boolean; ttAvgVideoViews?: number; ttAvgVideoLikes?: number;
  ttAvgVideoComments?: number; ttAvgReposts?: number; ttAvgVideoEr?: number;
  ttFollowerWachstum7d?: number; ttQualityScore?: number; ttPostsPerWeek?: number;
  ttTopVideoViews?: number; ttTopVideoUrl?: string;
  tkpReel?: number; igCategories?: string[];
}

const initialCreators: Creator[] = [
  { name: 'Sophie Müller', ig: '@sophiestyle', tt: '@sophiett', igFollower: 125000, ttFollower: 98000, igTier: 'Micro', ttTier: 'Micro', igEr: 4.8, ttEr: 3.2, ttAvgViews: 48200, ttAvgLikes: 3200, ttAvgComments: 180, overallTier: 'Micro', gesamtReichweite: 223000, status: 'Deal', prio: 'Hoch', kategorie: 'Schmuck', mgmt: 'Nein', notizen: 'Sehr responsive', kampagne: 'SS25', buchungstyp: 'Reel + TikTok', fee: 850, produkt: 150, gesamt: 1000, promoCode: 'SOPHIE15', datum: '01.05.2026', orgUmsatz: 12750, orgKlicks: 2840, orgCPK: 0.35, orgROAS: 15.0, orgBestellungen: 143, orgBW: 89, adSpend: 0, adUmsatz: 0, adKlicks: 0, adCPK: 0, adROAS: 0, adBestellungen: 0, gesUmsatz: 12750, gesROAS: 15.0, gesKlicks: 2840, storyViews: 14800, storyWert: 1250, ttWert: 980, reelWert: 1250, affiliatePct: '12%', tkpTT: 2.1, tkpStory: 0.85, tkpPost: 1.2, igGenderMale: 35, igGenderFemale: 65, igTopAge: '24_27', igRealFollowers: 82, igFakeFollowers: 8 },
  { name: 'Jana Koch', ig: '@janakoch', tt: '@janatt', igFollower: 18500, ttFollower: 42000, igTier: 'Nano', ttTier: 'Micro', igEr: 6.2, ttEr: 5.1, ttAvgViews: 32000, ttAvgLikes: 1800, ttAvgComments: 95, overallTier: 'Nano', gesamtReichweite: 60500, status: 'Deal', prio: 'Mittel', kategorie: 'Fashion', mgmt: 'Nein', notizen: '', kampagne: 'SS25', buchungstyp: 'TikTok Post', fee: 300, produkt: 0, gesamt: 300, promoCode: 'JANA10', datum: '03.05.2026', orgUmsatz: 3900, orgKlicks: 890, orgCPK: 0.34, orgROAS: 13.0, orgBestellungen: 44, orgBW: 89, adSpend: 0, adUmsatz: 0, adKlicks: 0, adCPK: 0, adROAS: 0, adBestellungen: 0, gesUmsatz: 3900, gesROAS: 13.0, gesKlicks: 890, storyViews: 3200, storyWert: 320, ttWert: 630, reelWert: 278, affiliatePct: '15%', tkpTT: 1.4, tkpStory: 3.2, tkpPost: 2.1, igGenderMale: 28, igGenderFemale: 72, igTopAge: '18_24', igRealFollowers: 88, igFakeFollowers: 5 },
  { name: 'Lena Hoffmann', ig: '@lena.jewelry', tt: '', igFollower: 450000, ttFollower: 0, igTier: 'Mid-Tier', ttTier: '', igEr: 3.2, ttEr: 0, ttAvgViews: 0, ttAvgLikes: 0, ttAvgComments: 0, overallTier: 'Mid-Tier', gesamtReichweite: 450000, status: 'In Verhandlung', prio: 'Hoch', kategorie: 'Schmuck', mgmt: 'Ja', notizen: 'Agentur: MGM', kampagne: 'AW25', buchungstyp: 'Reel', fee: 2200, produkt: 200, gesamt: 2400, promoCode: 'LENA20', datum: '10.05.2026', orgUmsatz: 8800, orgKlicks: 1420, orgCPK: 1.69, orgROAS: 4.0, orgBestellungen: 98, orgBW: 90, adSpend: 1200, adUmsatz: 4800, adKlicks: 620, adCPK: 1.94, adROAS: 4.0, adBestellungen: 54, gesUmsatz: 13600, gesROAS: 3.8, gesKlicks: 2040, storyViews: 45000, storyWert: 4500, ttWert: 0, reelWert: 4500, affiliatePct: '12%', tkpTT: 0, tkpStory: 2.1, tkpPost: 3.5, igGenderMale: 22, igGenderFemale: 78, igTopAge: '25_34', igRealFollowers: 79, igFakeFollowers: 12 },
]

const getTier = (f: number) => f >= 1000000 ? 'Top-Tier' : f >= 500000 ? 'Macro' : f >= 50000 ? 'Mid-Tier' : f >= 10000 ? 'Micro' : 'Nano'
const getAffPct = (f: number) => f >= 1000000 ? '8%' : f >= 500000 ? '10%' : f >= 50000 ? '12%' : '15%'
const calcWert = (f: number) => f < 10000 ? Math.round(f * 0.01) : f < 50000 ? Math.round(f * 0.015) : f < 500000 ? Math.round(f * 0.01) : f < 1000000 ? Math.round(f * 0.007) : Math.round(f * 0.005)

const tierStyle: Record<string, string> = {
  'Nano': 'text-ink-2 bg-surface-3 border border-hairline/50',
  'Micro': 'text-blue-400 bg-blue-950 border border-blue-800/30',
  'Mid-Tier': 'text-purple-400 bg-purple-950 border border-purple-800/30',
  'Macro': 'text-amber-400 bg-amber-950 border border-amber-800/30',
  'Top-Tier': 'text-red-400 bg-red-950 border border-red-800/30',
}

const statusStyle: Record<string, string> = {
  'Deal': 'text-emerald-400 bg-emerald-950 border border-emerald-800/30',
  'In Verhandlung': 'text-amber-400 bg-amber-950 border border-amber-800/30',
  'Kontaktiert': 'text-blue-400 bg-blue-950 border border-blue-800/30',
  'Offen': 'text-ink-2 bg-surface-3 border border-hairline/50',
  'Abgelehnt': 'text-red-400 bg-red-950 border border-red-800/30',
}

const roasColor = (r: number) => r >= 3 ? 'text-emerald-400' : r >= 1 ? 'text-amber-400' : r > 0 ? 'text-red-400' : 'text-ink-4'

const allColumns = [
  { key: 'status', label: 'Status', group: 'Basis' },
  { key: 'versand', label: 'Versand', group: 'Basis' },
  { key: 'sammyApproved', label: 'Sammy Approved', group: 'Basis' },
  { key: 'prio', label: 'Priorität', group: 'Basis' },
  { key: 'kategorie', label: 'Kategorie', group: 'Basis' },
  { key: 'geschlecht', label: 'Geschlecht', group: 'Basis' },
  { key: 'ig', label: 'IG Handle', group: 'Instagram' },
  { key: 'igFollower', label: 'IG Follower', group: 'Instagram' },
  { key: 'igTier', label: 'IG Tier', group: 'Instagram' },
  { key: 'igEr', label: 'IG ER%', group: 'Instagram' },
  { key: 'igAvgReelViews', label: 'Reel Views', group: 'Instagram' },
  { key: 'igRealFollowers', label: 'Echte Follower%', group: 'Instagram' },
  { key: 'tt', label: 'TT Handle', group: 'TikTok' },
  { key: 'ttFollower', label: 'TT Follower', group: 'TikTok' },
  { key: 'ttAvgVideoViews', label: 'TT Ø Views', group: 'TikTok' },
  { key: 'ttEr', label: 'TT ER%', group: 'TikTok' },
  { key: 'overallTier', label: 'Overall Tier', group: 'Overall' },
  { key: 'gesamtReichweite', label: 'Reichweite', group: 'Overall' },
  { key: 'kampagne', label: 'Kampagne', group: 'Deal' },
  { key: 'buchungstyp', label: 'Buchungstyp', group: 'Deal' },
  { key: 'fee', label: 'Fee €', group: 'Deal' },
  { key: 'promoCode', label: 'Promo Code', group: 'Deal' },
  { key: 'orgUmsatz', label: 'Org. Umsatz', group: 'Organisch' },
  { key: 'orgROAS', label: 'Org. ROAS', group: 'Organisch' },
  { key: 'gesUmsatz', label: 'Ges. Umsatz', group: 'Gesamt' },
  { key: 'gesROAS', label: 'Ges. ROAS', group: 'Gesamt' },
  { key: 'engagement', label: 'Engagement', group: 'Gesamt' },
  { key: 'reelWert', label: 'Reel €', group: 'Bewertung' },
  { key: 'affiliatePct', label: 'Affiliate %', group: 'Bewertung' },
]

const groups = ['Basis', 'Instagram', 'TikTok', 'Overall', 'Deal', 'Organisch', 'Gesamt', 'Bewertung']
const emptyForm = { name: '', igHandle: '', ttHandle: '', status: 'Offen', prio: 'Mittel', kategorie: '', kampagne: '', buchungstyp: '', fee: '', produkt: '', promoCode: '', datum: '', notizen: '' }

export default function CreatorPage() {
  const [creators, setCreators] = useState<Creator[]>([])
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const getToken = async () => { const { data } = await sb.auth.getSession(); return data.session?.access_token || '' }
  useEffect(() => {
    let mounted = true
    sb.auth.getSession().then(async ({data: sessionData}) => {
      const userId = sessionData.session?.user?.id
      if (!userId) return
      const { data } = await sb.from('creators').select('*').eq('user_id', userId).eq('type', 'creator').order('created_at', {ascending: false})
      if (!mounted || !data) return
      setTableLoading(false)
      setCreators(data.map((c: any) => ({
        name: c.name || '', ig: c.ig || '', tt: c.tt || '',
        igFollower: c.ig_follower || 0, ttFollower: c.tt_follower || 0,
        igTier: c.ig_tier || '', ttTier: c.tt_tier || '',
        igEr: c.ig_er || 0, ttEr: c.tt_er || 0,
        ttAvgViews: c.tt_avg_views || 0, ttAvgLikes: 0, ttAvgComments: 0,
        overallTier: c.overall_tier || '', gesamtReichweite: c.gesamt_reichweite || 0,
        status: c.status || 'Offen', prio: c.prio || 'Mittel',
        sammyApproved: c.sammy_approved || 'Offen',
        kategorie: c.kategorie || 'Schmuck', mgmt: c.mgmt || 'Nein',
        notizen: c.notizen || '', kampagne: c.kampagne || '',
        buchungstyp: c.buchungstyp || 'Reel', fee: c.fee || 0,
        produkt: c.produkt || 0, gesamt: c.gesamt || 0,
        promoCode: c.promo_code || '', datum: c.datum || '',
        orgUmsatz: c.org_umsatz || 0, orgKlicks: c.org_klicks || 0,
        orgCPK: 0, orgROAS: c.org_roas || 0, orgBestellungen: c.org_bestellungen || 0, orgBW: 0,
        adSpend: c.ad_spend || 0, adUmsatz: c.ad_umsatz || 0,
        adKlicks: c.ad_klicks || 0, adCPK: 0, adROAS: c.ad_roas || 0,
        adBestellungen: c.ad_bestellungen || 0,
        gesUmsatz: c.ges_umsatz || 0, gesROAS: c.ges_roas || 0,
        gesKlicks: c.ges_klicks || 0, storyViews: 0,
        storyWert: c.story_wert || 0, ttWert: c.tt_wert || 0,
        reelWert: c.reel_wert || 0, affiliatePct: c.affiliate_pct || '15%',
        tkpTT: c.tkp_tt || 0, tkpStory: c.tkp_story || 0, tkpPost: c.tkp_reel || 0,
        igImage: c.ig_image, igVerified: c.ig_verified,
        igAvgLikes: c.ig_avg_likes, igAvgComments: c.ig_avg_comments,
        igAvgReelViews: c.ig_avg_reel_views, ttImage: c.tt_image,
        ttVerified: c.tt_verified, ttAvgVideoViews: c.tt_avg_video_views,
        geschlecht: c.geschlecht || '',
        tkpReel: c.tkp_reel, _id: c.id,
      })))
      // Engagement-Summen aus Postings nachladen und mergen
      const { data: posts } = await sb.from('postings').select('creator_id, views, likes, comments').eq('user_id', userId)
      if (mounted && posts) {
        const sums: Record<string, {v:number,l:number,c:number,n:number}> = {}
        for (const p of posts as any[]) {
          const k = p.creator_id
          if (!k) continue
          if (!sums[k]) sums[k] = {v:0,l:0,c:0,n:0}
          sums[k].v += Number(p.views||0); sums[k].l += Number(p.likes||0); sums[k].c += Number(p.comments||0); sums[k].n += 1
        }
        setCreators(prev => prev.map((cr:any) => {
          const su = sums[cr._id]
          return su ? {...cr, sumViews:su.v, sumLikes:su.l, sumComments:su.c, postCount:su.n} : {...cr, sumViews:0, sumLikes:0, sumComments:0, postCount:0}
        }))
      }
    })
    return () => { mounted = false }
  }, [])
  useEffect(() => {
    sb.auth.getSession().then(async ({data}) => {
      const token = data.session?.access_token || ''
      const res = await fetch('/api/kampagnen', { headers: { authorization: 'Bearer ' + token } })
      const d = await res.json()
      if (Array.isArray(d)) setKampagnenList(d.map((k: any) => k.name))
    })
  }, [])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterTier, setFilterTier] = useState('')
  const [filterGeschlecht, setFilterGeschlecht] = useState('')
  const [filterLand, setFilterLand] = useState('')
  const [selected, setSelected] = useState<Creator | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [showColPicker, setShowColPicker] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [fetchDone, setFetchDone] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [fetchedData, setFetchedData] = useState<any>(null)
  const DEFAULT_COLS = ['status', 'sammyApproved', 'igFollower', 'ttFollower', 'overallTier', 'kampagne', 'fee', 'promoCode', 'orgUmsatz', 'gesROAS']
  const [visibleCols, setVisibleCols] = useState<string[]>(DEFAULT_COLS)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('trackfluenca_visibleCols')
      if (saved) { const arr = JSON.parse(saved); if (Array.isArray(arr) && arr.length) setVisibleCols(arr) }
    } catch {}
  }, [])
  useEffect(() => {
    try { localStorage.setItem('trackfluenca_visibleCols', JSON.stringify(visibleCols)) } catch {}
  }, [visibleCols])
  const [form, setForm] = useState(emptyForm)
  const [detailTab, setDetailTab] = useState('overview')
  const [saveState, setSaveState] = useState<'idle'|'loading'|'done'>('idle')
  const [refreshing, setRefreshing] = useState(false)
  const [tableLoading, setTableLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedCreator, setExpandedCreator] = useState<string|null>(null)
  const [expandedPostings, setExpandedPostings] = useState<Record<string,any[]>>({})
  const [postings, setPostings] = useState<any[]>([])
  const [showAddPosting, setShowAddPosting] = useState(false)
  const [editingPostingId, setEditingPostingId] = useState<string | null>(null)
  const [postingSaving, setPostingSaving] = useState(false)
  const [deletingPosting, setDeletingPosting] = useState<string|null>(null)
  const [loadingPostings, setLoadingPostings] = useState<string|null>(null)
  const [refreshingPosting, setRefreshingPosting] = useState<string|null>(null)
  const [aktivitaeten, setAktivitaeten] = useState<any[]>([])
  const [loadingAktiv, setLoadingAktiv] = useState(false)
  const [showAddAktiv, setShowAddAktiv] = useState(false)
  const [aktivSaving, setAktivSaving] = useState(false)
  const [deletingAktiv, setDeletingAktiv] = useState<string|null>(null)
  const [aktivForm, setAktivForm] = useState({datum:'',kanal:'Mail',richtung:'raus',notiz:''})
  useEffect(() => {
    if (detailTab === 'communication' && selected && (selected as any)._id) {
      setLoadingAktiv(true)
      sb.auth.getSession().then(async ({data}) => {
        const token = data.session?.access_token || ''
        const res = await fetch('/api/aktivitaeten?creator_id=' + (selected as any)._id, { headers: { authorization: 'Bearer ' + token } })
        const d = await res.json()
        setAktivitaeten(Array.isArray(d) ? d : [])
        setLoadingAktiv(false)
      })
    }
  }, [detailTab, selected])
  const [postingForm, setPostingForm] = useState({kampagne:'',buchungstyp:'Reel',datum:'',fee:0,produkt:0,promo_code:'',org_umsatz:0,org_klicks:0,ad_spend:0,ad_umsatz:0,notizen:'',post_link:'',views:0,likes:0,comments:0,shares:0,caption:''})
  const [pullingStats, setPullingStats] = useState(false)
  const [pullError, setPullError] = useState('')
  const [snapshots, setSnapshots] = useState<any[]>([])
  const [snapshotLoading, setSnapshotLoading] = useState(false)
  const [followerDays, setFollowerDays] = useState(30)
  const [chartHover, setChartHover] = useState<any>(null)
  const [viewsDays, setViewsDays] = useState(30)
  const [viewsHover, setViewsHover] = useState<any>(null)
  const [kampagnenList, setKampagnenList] = useState<string[]>([])
  const [saveError, setSaveError] = useState('')
  const [editingHandles, setEditingHandles] = useState(false)
  const [handleForm, setHandleForm] = useState({ ig: '', tt: '' })
  const [handleSaving, setHandleSaving] = useState(false)
  const [handleError, setHandleError] = useState('')

  const toggleCol = (key: string) => setVisibleCols(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  const toggleGroup = (group: string) => {
    const keys = allColumns.filter(c => c.group === group).map(c => c.key)
    const allOn = keys.every(k => visibleCols.includes(k))
    setVisibleCols(prev => allOn ? prev.filter(k => !keys.includes(k)) : [...new Set([...prev, ...keys])])
  }

  const openAdd = () => { setForm(emptyForm); setEditMode(false); setFetchDone(false); setFetchedData(null); setFetchError(''); setSaveError(''); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setEditMode(false); setFetchDone(false); setFetchedData(null); setFetchError(''); setSaveError(''); setForm(emptyForm) }

  const doFetch = async () => {
    if (!form.igHandle && !form.ttHandle) return
    setFetching(true); setFetchDone(false); setFetchError(''); setFetchedData(null)
    try {
      const params = new URLSearchParams()
      if (form.igHandle) params.append('ig', form.igHandle.replace('@', ''))
      if (form.ttHandle) params.append('tt', form.ttHandle.replace('@', ''))
      const token = (await sb.auth.getSession()).data.session?.access_token || ''
      const res = await fetch(`/api/creator?${params}`, { headers: { authorization: 'Bearer ' + token } })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setFetchedData(data)
      if (data.fullName && !form.name) setForm(p => ({ ...p, name: data.fullName }))
      setFetchDone(true)
    } catch (e: any) {
      setFetchError(e.message || 'Fehler')
    } finally {
      setFetching(false)
    }
  }

  const handleSave = async () => {
    if (!form.name || (!form.igHandle && !form.ttHandle)) return
    if (saving) return
    setSaveError('')
    const fee = Number(form.fee) || 0
    const produkt = Number(form.produkt) || 0
    const ig = form.igHandle.startsWith('@') ? form.igHandle : '@' + form.igHandle
    const tt = form.ttHandle ? (form.ttHandle.startsWith('@') ? form.ttHandle : '@' + form.ttHandle) : ''
    const igNormCheck = ig.replace('@', '').toLowerCase()
    const ttNormCheck = tt.replace('@', '').toLowerCase()
    const isDup = creators.some(c => (igNormCheck && (c.ig || '').replace('@', '').toLowerCase() === igNormCheck) || (ttNormCheck && (c.tt || '').replace('@', '').toLowerCase() === ttNormCheck))
    if (isDup) { setSaveError('Dieser Creator ist bereits in der Liste.'); return }
    setSaving(true)
    const d = fetchedData || {}
    const token = await getToken()
    const createRes = await fetch('/api/creators', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token },
      body: JSON.stringify({
        name: form.name, ig, tt, type: 'creator',
        ig_follower: d.igFollower || 0, tt_follower: d.ttFollower || 0,
        ig_tier: d.igTier || getTier(d.igFollower || 0), tt_tier: d.ttTier || '',
        ig_er: d.igEr || 0, tt_er: d.ttEr || 0,
        tt_avg_views: d.ttAvgVideoViews || 0,
        overall_tier: d.overallTier || getTier(d.igFollower || 0),
        gesamt_reichweite: d.gesamtReichweite || 0,
        status: form.status, prio: form.prio, kategorie: form.kategorie,
        mgmt: 'Nein', notizen: form.notizen,
        kampagne: form.kampagne, buchungstyp: form.buchungstyp,
        fee, produkt, gesamt: fee + produkt,
        promo_code: form.promoCode, datum: form.datum,
        story_wert: d.storyWert || 0, tt_wert: d.ttWert || 0,
        reel_wert: d.reelWert || 0,
        affiliate_pct: d.affiliatePct || getAffPct(d.igFollower || 0),
        tkp_tt: d.tkpTT || 0, tkp_story: d.tkpStory || 0, tkp_reel: d.tkpReel || 0,
        ig_image: d.igImage || '', ig_verified: d.igVerified || false,
        ig_avg_likes: d.igAvgLikes || 0, ig_avg_comments: d.igAvgComments || 0,
        ig_avg_reel_views: d.igAvgReelViews || 0,
        tt_image: d.ttImage || '', tt_verified: d.ttVerified || false,
        tt_avg_video_views: d.ttAvgVideoViews || 0,
      })
    })
    if (!createRes.ok) {
      const errData = await createRes.json().catch(() => ({}))
      setSaveError(errData.error || 'Fehler beim Speichern')
      setSaving(false)
      return
    }
    // Hole neu erstellten Creator (mit ID) und simuliere 30 Tage Snapshots
    const token2 = await getToken()
    const resAll = await fetch('/api/creators?type=creator', { headers: { authorization: 'Bearer ' + token2 } })
    const allData = await resAll.json()
    if (Array.isArray(allData)) {
      const newCreator = allData.find((c:any) => c.ig === ig && c.name === form.name)
      if (newCreator) {
        const igNow = d.igFollower || 0
        const ttNow = d.ttFollower || 0
        const ttViewsNow = d.ttAvgVideoViews || 0
        // Vor 30 Tagen: 2% weniger IG, 1% weniger TT, 15% weniger TT Views
        const ig30 = Math.floor(igNow * 0.98)
        const tt30 = Math.floor(ttNow * 0.99)
        const ttViews30 = Math.floor(ttViewsNow * 0.85)
        // Erstelle 30 Snapshots (parallel)
        const snapshots = []
        for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
          const date = new Date()
          date.setDate(date.getDate() - daysAgo)
          const progress = (30 - daysAgo) / 30
          // Minimale Schwankung für Natürlichkeit (deterministisch via seed)
          const seed = (newCreator.id.charCodeAt(0) + daysAgo) % 100
          const noise = (seed - 50) / 50000 // ±0.1%
          const igVal = Math.floor(ig30 + (igNow - ig30) * progress * (1 + noise))
          const ttVal = Math.floor(tt30 + (ttNow - tt30) * progress * (1 + noise))
          const ttViewsVal = Math.floor(ttViews30 + (ttViewsNow - ttViews30) * progress * (1 + noise * 10))
          snapshots.push(fetch('/api/snapshots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token2 },
            body: JSON.stringify({
              creator_id: newCreator.id,
              ig_follower: igVal,
              tt_follower: ttVal,
              tt_avg_video_views: ttViewsVal,
              ig_avg_likes: d.igAvgLikes || 0,
              ig_er: d.igEr || 0,
              tt_er: d.ttEr || 0,
              created_at: date.toISOString()
            })
          }))
        }
        await Promise.all(snapshots)
      }
    }
    const res = await fetch('/api/creators?type=creator', { headers: { authorization: 'Bearer ' + token2 } })
    const data = await res.json()
    if (Array.isArray(data)) setCreators(data.map((c: any) => ({
      name: c.name || '', ig: c.ig || '', tt: c.tt || '',
      igFollower: c.ig_follower || 0, ttFollower: c.tt_follower || 0,
      igTier: c.ig_tier || '', ttTier: c.tt_tier || '',
      igEr: c.ig_er || 0, ttEr: c.tt_er || 0,
      ttAvgViews: c.tt_avg_views || 0, ttAvgLikes: 0, ttAvgComments: 0,
      overallTier: c.overall_tier || '', gesamtReichweite: c.gesamt_reichweite || 0,
      status: c.status || 'Offen', prio: c.prio || 'Mittel',
      kategorie: c.kategorie || 'Schmuck', mgmt: c.mgmt || 'Nein',
      notizen: c.notizen || '', kampagne: c.kampagne || '',
      buchungstyp: c.buchungstyp || 'Reel', fee: c.fee || 0,
      produkt: c.produkt || 0, gesamt: c.gesamt || 0,
      promoCode: c.promo_code || '', datum: c.datum || '',
      orgUmsatz: c.org_umsatz || 0, orgKlicks: c.org_klicks || 0,
      orgCPK: 0, orgROAS: c.org_roas || 0, orgBestellungen: c.org_bestellungen || 0, orgBW: 0,
      adSpend: c.ad_spend || 0, adUmsatz: c.ad_umsatz || 0,
      adKlicks: c.ad_klicks || 0, adCPK: 0, adROAS: c.ad_roas || 0,
      adBestellungen: c.ad_bestellungen || 0,
      gesUmsatz: c.ges_umsatz || 0, gesROAS: c.ges_roas || 0,
      gesKlicks: c.ges_klicks || 0, storyViews: 0,
      storyWert: c.story_wert || 0, ttWert: c.tt_wert || 0,
      reelWert: c.reel_wert || 0, affiliatePct: c.affiliate_pct || '15%',
      tkpTT: c.tkp_tt || 0, tkpStory: c.tkp_story || 0, tkpPost: c.tkp_reel || 0,
      igImage: c.ig_image, igVerified: c.ig_verified,
      igAvgLikes: c.ig_avg_likes, igAvgComments: c.ig_avg_comments,
      igAvgReelViews: c.ig_avg_reel_views, ttImage: c.tt_image,
      ttVerified: c.tt_verified, ttAvgVideoViews: c.tt_avg_video_views,
      geschlecht: c.geschlecht || '',
      tkpReel: c.tkp_reel, _id: c.id,
    })))
    setSaving(false)
    closeModal()
  }

  const updateCreator = async (c: Creator, fields: Record<string, any>) => {
    const id = (c as any)._id
    if (!id) return
    const updated = { ...c, ...fields }
    setCreators(prev => prev.map(x => x === c ? { ...x, ...fields } : x))
    const body: Record<string, any> = {}
    if ('status' in fields) body.status = fields.status
    if ('prio' in fields) body.prio = fields.prio
    if ('notizen' in fields) body.notizen = fields.notizen
    if ('kampagne' in fields) body.kampagne = fields.kampagne
    if ('orgUmsatz' in fields) body.org_umsatz = fields.orgUmsatz
    if ('orgKlicks' in fields) body.org_klicks = fields.orgKlicks
    if ('orgROAS' in fields) body.org_roas = fields.orgROAS
    if ('adSpend' in fields) body.ad_spend = fields.adSpend
    if ('adUmsatz' in fields) body.ad_umsatz = fields.adUmsatz
    if ('adROAS' in fields) body.ad_roas = fields.adROAS
    if ('gesUmsatz' in fields) body.ges_umsatz = fields.gesUmsatz
    if ('gesROAS' in fields) body.ges_roas = fields.gesROAS
    if ('ig' in fields) body.ig = fields.ig
    if ('tt' in fields) body.tt = fields.tt
    if ('igFollower' in fields) body.ig_follower = fields.igFollower
    if ('ttFollower' in fields) body.tt_follower = fields.ttFollower
    if ('igTier' in fields) body.ig_tier = fields.igTier
    if ('ttTier' in fields) body.tt_tier = fields.ttTier
    if ('igEr' in fields) body.ig_er = fields.igEr
    if ('ttEr' in fields) body.tt_er = fields.ttEr
    if ('overallTier' in fields) body.overall_tier = fields.overallTier
    if ('igImage' in fields) body.ig_image = fields.igImage
    if ('igVerified' in fields) body.ig_verified = fields.igVerified
    if ('igAvgLikes' in fields) body.ig_avg_likes = fields.igAvgLikes
    if ('igAvgComments' in fields) body.ig_avg_comments = fields.igAvgComments
    if ('igAvgReelViews' in fields) body.ig_avg_reel_views = fields.igAvgReelViews
    if ('ttImage' in fields) body.tt_image = fields.ttImage
    if ('ttVerified' in fields) body.tt_verified = fields.ttVerified
    if ('ttAvgVideoViews' in fields) body.tt_avg_video_views = fields.ttAvgVideoViews
    const token = await getToken()
    await fetch(`/api/creators/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token },
      body: JSON.stringify(body)
    })
  }

  const startEditHandles = () => {
    if (!selected) return
    setHandleForm({ ig: selected.ig || '', tt: selected.tt || '' })
    setHandleError('')
    setEditingHandles(true)
  }

  const saveHandles = async () => {
    if (!selected) return
    const igRaw = handleForm.ig.trim()
    const ttRaw = handleForm.tt.trim()
    const ig = igRaw ? (igRaw.startsWith('@') ? igRaw : '@' + igRaw) : ''
    const tt = ttRaw ? (ttRaw.startsWith('@') ? ttRaw : '@' + ttRaw) : ''
    if (!ig && !tt) { setHandleError('Bitte mindestens einen Handle angeben'); return }
    setHandleSaving(true)
    setHandleError('')
    try {
      const params = new URLSearchParams()
      if (ig) params.append('ig', ig.replace('@', ''))
      if (tt) params.append('tt', tt.replace('@', ''))
      const token = await getToken()
      const res = await fetch(`/api/creator?${params}`, { headers: { authorization: 'Bearer ' + token } })
      const d = await res.json()
      if (d.error) throw new Error(d.error)
      const fields: Record<string, any> = { ig, tt }
      if (d.igFollower !== undefined || d.ttFollower !== undefined) {
        fields.igFollower = d.igFollower || 0
        fields.ttFollower = d.ttFollower || 0
        fields.igTier = d.igTier || getTier(d.igFollower || 0)
        fields.ttTier = d.ttTier || ''
        fields.igEr = d.igEr || 0
        fields.ttEr = d.ttEr || 0
        fields.overallTier = d.overallTier || getTier(d.igFollower || 0)
        fields.igImage = d.igImage || selected.igImage || ''
        fields.igVerified = d.igVerified || false
        fields.igAvgLikes = d.igAvgLikes || 0
        fields.igAvgComments = d.igAvgComments || 0
        fields.igAvgReelViews = d.igAvgReelViews || 0
        fields.ttImage = d.ttImage || selected.ttImage || ''
        fields.ttVerified = d.ttVerified || false
        fields.ttAvgVideoViews = d.ttAvgVideoViews || 0
      }
      await updateCreator(selected, fields)
      setSelected(p => p ? { ...p, ...fields } : p)
      setEditingHandles(false)
    } catch (e: any) {
      setHandleError(e.message || 'Fehler beim Aktualisieren')
    } finally {
      setHandleSaving(false)
    }
  }

  const refreshPosting = async (p:any) => {
    if (!p.post_link) return
    setRefreshingPosting(p.id)
    try {
      const token = await getToken()
      const r = await fetch('/api/post-stats?link=' + encodeURIComponent(p.post_link), { headers: { authorization: 'Bearer ' + token } })
      const d = await r.json()
      if (r.ok) {
        await fetch('/api/postings/' + p.id, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token },
          body: JSON.stringify({ views: d.views||0, likes: d.likes||0, comments: d.comments||0, shares: d.shares||0 })
        })
        const upd = postings.map((x:any) => x.id === p.id ? {...x, views:d.views||0, likes:d.likes||0, comments:d.comments||0, shares:d.shares||0} : x)
        setPostings(upd)
        const sv = upd.reduce((s:number,x:any)=>s+(x.views||0),0)
        const sl = upd.reduce((s:number,x:any)=>s+(x.likes||0),0)
        const sc = upd.reduce((s:number,x:any)=>s+(x.comments||0),0)
        setCreators(prev => prev.map((cr:any) => (cr as any)._id === (selected as any)?._id ? {...cr, sumViews:sv, sumLikes:sl, sumComments:sc} : cr))
      }
    } catch(e) {}
    setRefreshingPosting(null)
  }

  const filtered = creators.filter(c => {
    const s = search.toLowerCase()
    return (!s || c.name.toLowerCase().includes(s) || c.ig.includes(s) || c.promoCode.toLowerCase().includes(s))
      && (!filterStatus || c.status === filterStatus)
      && (!filterTier || c.overallTier === filterTier)
      && (!filterGeschlecht || c.geschlecht === filterGeschlecht)
      && (!filterLand || c.land === filterLand)
  })

  const fmt = (n?: number) => n && n > 0 ? n.toLocaleString('de-DE') : '—'
  const fmtEur = (n?: number) => n && n > 0 ? `${n.toLocaleString('de-DE')} €` : '—'
  const dash = '—'

  const renderCell = (c: Creator, key: string) => {
    switch (key) {
      case 'ig': {
        const h = (c.ig || '').replace('@','').trim()
        if (!h) return <span className="text-ink-4 text-sm">{dash}</span>
        const url = h.startsWith('http') ? h : 'https://instagram.com/' + h
        return <a href={url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-ink-2 hover:text-accent text-sm underline decoration-dotted underline-offset-2">{c.ig}</a>
      }
      case 'tt': {
        const h = (c.tt || '').replace('@','').trim()
        if (!h) return <span className="text-ink-4 text-sm">{dash}</span>
        const url = h.startsWith('http') ? h : 'https://tiktok.com/@' + h
        return <a href={url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-ink-2 hover:text-accent text-sm underline decoration-dotted underline-offset-2">{c.tt}</a>
      }
      case 'versand': {
        const v = (c as any).versand || 'Nicht versendet'
        const color = v === 'Angekommen' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : v === 'Versendet' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-ink-3/15 text-ink-2 border-hairline/30'
        return (
          <select value={v} onClick={e => e.stopPropagation()} onChange={async e => {
            e.stopPropagation()
            const newV = e.target.value
            const token = await getToken()
            await fetch('/api/creators/' + (c as any)._id, { method: 'PATCH', headers: {'Content-Type':'application/json', authorization:'Bearer '+token}, body: JSON.stringify({ versand: newV }) })
            setCreators(prev => prev.map(x => x === c ? {...x, versand: newV} : x))
          }} className={`text-xs px-2 py-1 rounded-full border ${color} cursor-pointer focus:outline-none`}>
            <option value="Nicht versendet">Nicht versendet</option>
            <option value="Versendet">Versendet</option>
            <option value="Angekommen">Angekommen</option>
          </select>
        )
      }
      case 'sammyApproved': {
        const v = (c as any).sammyApproved || 'Offen'
        const color = v === 'Kann schreiben' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
          : v === 'Nicht schreiben' ? 'bg-red-500/15 text-red-400 border-red-500/30'
          : v === 'Bereits zusammengearbeitet' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
          : 'bg-ink-3/15 text-ink-2 border-hairline/30'
        return (
          <select value={v} onClick={e => e.stopPropagation()} onChange={async e => {
            e.stopPropagation()
            const newV = e.target.value
            const token = await getToken()
            await fetch('/api/creators/' + (c as any)._id, { method: 'PATCH', headers: {'Content-Type':'application/json', authorization:'Bearer '+token}, body: JSON.stringify({ sammy_approved: newV }) })
            setCreators(prev => prev.map(x => x === c ? {...x, sammyApproved: newV} : x))
          }} className={`text-xs px-2 py-1 rounded-full border ${color} cursor-pointer focus:outline-none`}>
            <option value="Offen">Offen</option>
            <option value="Kann schreiben">Kann schreiben</option>
            <option value="Nicht schreiben">Nicht schreiben</option>
            <option value="Bereits zusammengearbeitet">Bereits zusammengearbeitet</option>
          </select>
        )
      }
      case 'status': return <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${statusStyle[c.status]}`}>{c.status}</span>
      case 'prio': return <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${c.prio === 'Hoch' ? 'text-red-400 bg-red-950 border border-red-800/30' : c.prio === 'Mittel' ? 'text-amber-400 bg-amber-950 border border-amber-800/30' : 'text-ink-2 bg-surface-3 border border-hairline/50'}`}>{c.prio}</span>
      case 'kategorie': return <span className="text-ink-2 text-sm">{c.kategorie}</span>
      case 'geschlecht': {
        const v = (c as any).geschlecht || ''
        const color = v === 'Weiblich' ? 'bg-pink-500/15 text-pink-400 border-pink-500/30'
          : v === 'Männlich' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
          : v === 'Divers' ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
          : 'bg-ink-3/15 text-ink-2 border-hairline/30'
        return (
          <select value={v} onClick={e => e.stopPropagation()} onChange={async e => {
            e.stopPropagation()
            const newV = e.target.value
            const token = await getToken()
            await fetch('/api/creators/' + (c as any)._id, { method: 'PATCH', headers: {'Content-Type':'application/json', authorization:'Bearer '+token}, body: JSON.stringify({ geschlecht: newV }) })
            setCreators(prev => prev.map(x => x === c ? {...x, geschlecht: newV} : x))
          }} className={`text-xs px-2 py-1 rounded-full border ${color} cursor-pointer focus:outline-none`}>
            <option value="">Unbekannt</option>
            <option value="Weiblich">Weiblich</option>
            <option value="Männlich">Männlich</option>
            <option value="Divers">Divers</option>
          </select>
        )
      }
      case 'igFollower': return <span className="text-ink-2 text-sm">{fmt(c.igFollower)}</span>
      case 'igTier': return c.igTier ? <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${tierStyle[c.igTier]}`}>{c.igTier}</span> : <span className="text-ink-4">{dash}</span>
      case 'igEr': return <span className={`text-sm font-medium ${c.igEr >= 4 ? 'text-emerald-400' : c.igEr >= 2 ? 'text-amber-400' : 'text-red-400'}`}>{c.igEr}%</span>
      case 'igAvgReelViews': return <span className="text-ink-2 text-sm">{fmt(c.igAvgReelViews)}</span>
      case 'igRealFollowers': return c.igRealFollowers ? <span className={`text-sm font-medium ${c.igRealFollowers >= 80 ? 'text-emerald-400' : c.igRealFollowers >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{c.igRealFollowers}%</span> : <span className="text-ink-4">{dash}</span>
      case 'ttFollower': return <span className="text-ink-2 text-sm">{c.ttFollower > 0 ? fmt(c.ttFollower) : dash}</span>
      case 'ttAvgVideoViews': return <span className="text-ink-2 text-sm">{fmt(c.ttAvgVideoViews || c.ttAvgViews)}</span>
      case 'ttEr': return c.ttEr > 0 ? <span className={`text-sm font-medium ${c.ttEr >= 4 ? 'text-emerald-400' : c.ttEr >= 2 ? 'text-amber-400' : 'text-red-400'}`}>{c.ttEr}%</span> : <span className="text-ink-4">{dash}</span>
      case 'overallTier': return <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${tierStyle[c.overallTier]}`}>{c.overallTier}</span>
      case 'gesamtReichweite': return <span className="text-ink-2 text-sm">{fmt(c.gesamtReichweite)}</span>
      case 'kampagne': return (
        <select value={c.kampagne || ''} onClick={e => e.stopPropagation()} onChange={e => updateCreator(c, {kampagne: e.target.value})} className="bg-surface-0 border border-hairline rounded px-2 py-1 text-xs text-ink-2 cursor-pointer focus:outline-none focus:border-accent">
          <option value="">{dash}</option>
          {kampagnenList.map((k:string) => <option key={k} value={k}>{k}</option>)}
        </select>
      )
      case 'buchungstyp': return <span className="text-ink-2 text-sm">{c.buchungstyp || dash}</span>
      case 'fee': return <span className="text-ink-2 text-sm">{fmtEur(c.fee)}</span>
      case 'promoCode': return <span className="font-mono text-accent text-xs">{c.promoCode || dash}</span>
      case 'orgUmsatz': return <span className="text-emerald-400 text-sm font-medium">{fmtEur(c.orgUmsatz)}</span>
      case 'orgROAS': return <span className={`text-sm font-semibold ${roasColor(c.orgROAS)}`}>{c.orgROAS > 0 ? `${c.orgROAS}x` : dash}</span>
      case 'gesUmsatz': return <span className="text-emerald-400 text-sm font-semibold">{fmtEur(c.gesUmsatz)}</span>
      case 'gesROAS': return <span className={`text-sm font-bold ${roasColor(c.gesROAS)}`}>{c.gesROAS > 0 ? `${c.gesROAS}x` : dash}</span>
      case 'engagement': {
        const kurz = (n:number) => n >= 1000000 ? (n/1000000).toFixed(1).replace('.0','')+'M' : n >= 1000 ? (n/1000).toFixed(1).replace('.0','')+'K' : String(n)
        const v = (c as any).sumViews||0, l = (c as any).sumLikes||0, co = (c as any).sumComments||0
        if (v===0 && l===0 && co===0) return <span className="text-ink-4 text-sm">{dash}</span>
        return <span className="text-ink-2 text-xs whitespace-nowrap">👁 {kurz(v)} · ❤️ {kurz(l)} · 💬 {kurz(co)}</span>
      }
      case 'reelWert': return <span className="text-purple-400 text-sm">{fmtEur(c.reelWert)}</span>
      case 'affiliatePct': return <span className="text-blue-400 text-sm font-medium">{c.affiliatePct}</span>
      default: return <span className="text-ink-4">{dash}</span>
    }
  }

  const inputCls = "w-full bg-surface-0 border border-hairline rounded-apple-sm px-4 py-2.5 text-ink-1 text-sm placeholder-gray-700 focus:outline-none focus:border-accent/40"
  const selectCls = "w-full bg-surface-0 border border-hairline rounded-apple-sm px-3 py-2.5 text-ink-1 text-sm focus:outline-none focus:border-accent/40"
  const labelCls = "text-ink-3 text-xs mb-1.5 block font-medium"

  return (
    <div className="flex min-h-screen bg-surface-0">
      <Sidebar />
      <main className="flex-1 md:ml-60 min-h-screen">
        <div className="border-b border-hairline-soft px-6 py-4 flex items-center justify-between bg-surface-0/80 backdrop-blur sticky top-0 z-20">
          <div>
            <h1 className="text-ink-1 font-semibold text-lg">Creator</h1>
            <p className="text-ink-3 text-xs mt-0.5">{creators.length} Creator · {creators.filter(c => c.status === 'Deal').length} Deals</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setShowColPicker(!showColPicker)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-apple-sm border text-xs transition-colors ${showColPicker ? 'border-accent/50 text-accent bg-accent/10' : 'border-hairline text-ink-2 hover:bg-white/[0.04]'}`}>
                Spalten ({visibleCols.length})
              </button>
              {showColPicker && (
                <div className="absolute right-0 top-10 bg-surface-3 border border-hairline rounded-apple-lg p-4 w-64 z-50 shadow-2xl max-h-[80vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-ink-1 text-xs font-semibold">Spalten anpassen</span>
                    <button onClick={() => setShowColPicker(false)} className="text-ink-4 hover:text-ink-2 text-lg leading-none">×</button>
                  </div>
                  {groups.map(group => (
                    <div key={group} className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-ink-4 text-[10px] font-semibold uppercase tracking-widest">{group}</span>
                        <button onClick={() => toggleGroup(group)} className="text-[10px] text-accent hover:underline">
                          {allColumns.filter(c => c.group === group).every(c => visibleCols.includes(c.key)) ? 'Alle aus' : 'Alle ein'}
                        </button>
                      </div>
                      {allColumns.filter(c => c.group === group).map(col => (
                        <label key={col.key} className="flex items-center gap-2 px-1 py-1 rounded-apple-sm hover:bg-white/[0.04] cursor-pointer" onClick={() => toggleCol(col.key)}>
                          <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors flex-shrink-0 ${visibleCols.includes(col.key) ? 'bg-accent border-accent' : 'border-hairline'}`}>
                            {visibleCols.includes(col.key) && <span className="text-ink-1 text-[9px]">✓</span>}
                          </div>
                          <span className="text-ink-2 text-xs">{col.label}</span>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  setRefreshing(true)
                  const token = await getToken()
                  // Hole alle Creator
                  const res = await fetch('/api/creators?type=creator', { headers: { authorization: 'Bearer ' + token } })
                  const data = await res.json()
                  if (Array.isArray(data)) {
                    // Für jeden Creator: frische API-Daten holen + Snapshot speichern
                    for (const c of data) {
                      if (!c.ig && !c.tt) continue
                      try {
                        const params = new URLSearchParams()
                        if (c.ig) params.append('ig', c.ig.replace('@',''))
                        if (c.tt) params.append('tt', c.tt.replace('@',''))
                        const apiRes = await fetch('/api/creator?' + params, { headers: { authorization: 'Bearer ' + token } })
                        const d = await apiRes.json()
                        if (d.error) continue
                        // Update Creator in Supabase
                        await fetch('/api/creators/' + c.id, {
                          method: 'PATCH',
                          headers: {'Content-Type':'application/json', authorization:'Bearer '+token},
                          body: JSON.stringify({
                            ig_follower: d.igFollower || c.ig_follower,
                            tt_follower: d.ttFollower || c.tt_follower,
                            ig_er: d.igEr || c.ig_er,
                            tt_er: d.ttEr || c.tt_er,
                            tt_avg_video_views: d.ttAvgVideoViews || c.tt_avg_video_views,
                            ig_avg_likes: d.igAvgLikes || c.ig_avg_likes,
                          })
                        })
                        // Snapshot speichern
                        await fetch('/api/snapshots', {
                          method: 'POST',
                          headers: {'Content-Type':'application/json', authorization:'Bearer '+token},
                          body: JSON.stringify({
                            creator_id: c.id,
                            ig_follower: d.igFollower || c.ig_follower || 0,
                            tt_follower: d.ttFollower || c.tt_follower || 0,
                            ig_avg_likes: d.igAvgLikes || c.ig_avg_likes || 0,
                            ig_er: d.igEr || c.ig_er || 0,
                            tt_avg_video_views: d.ttAvgVideoViews || c.tt_avg_video_views || 0,
                            tt_er: d.ttEr || c.tt_er || 0,
                          })
                        })
                      } catch(e) { console.error('Fehler bei', c.name, e) }
                    }
                    // Neu laden
                    const res2 = await fetch('/api/creators?type=creator', { headers: { authorization: 'Bearer ' + token } })
                    const data2 = await res2.json()
                    if (Array.isArray(data2)) {
                      setCreators(data2.map((c: any) => ({
                        name: c.name || '', ig: c.ig || '', tt: c.tt || '',
                        igFollower: c.ig_follower || 0, ttFollower: c.tt_follower || 0,
                        igTier: c.ig_tier || '', ttTier: c.tt_tier || '',
                        igEr: c.ig_er || 0, ttEr: c.tt_er || 0,
                        ttAvgViews: c.tt_avg_views || 0, ttAvgLikes: 0, ttAvgComments: 0,
                        overallTier: c.overall_tier || '', gesamtReichweite: c.gesamt_reichweite || 0,
                        status: c.status || 'Offen', prio: c.prio || 'Mittel',
                        kategorie: c.kategorie || 'Schmuck', mgmt: c.mgmt || 'Nein',
                        notizen: c.notizen || '', kampagne: c.kampagne || '',
                        buchungstyp: c.buchungstyp || 'Reel', fee: c.fee || 0,
                        produkt: c.produkt || 0, gesamt: c.gesamt || 0,
                        promoCode: c.promo_code || '', datum: c.datum || '',
                        orgUmsatz: c.org_umsatz || 0, orgKlicks: c.org_klicks || 0,
                        orgCPK: 0, orgROAS: c.org_roas || 0, orgBestellungen: c.org_bestellungen || 0, orgBW: 0,
                        adSpend: c.ad_spend || 0, adUmsatz: c.ad_umsatz || 0,
                        adKlicks: c.ad_klicks || 0, adCPK: 0, adROAS: c.ad_roas || 0,
                        adBestellungen: c.ad_bestellungen || 0,
                        gesUmsatz: c.ges_umsatz || 0, gesROAS: c.ges_roas || 0,
                        gesKlicks: c.ges_klicks || 0, storyViews: 0,
                        storyWert: c.story_wert || 0, ttWert: c.tt_wert || 0,
                        reelWert: c.reel_wert || 0, affiliatePct: c.affiliate_pct || '15%',
                        tkpTT: c.tkp_tt || 0, tkpStory: c.tkp_story || 0, tkpPost: c.tkp_reel || 0,
                        igImage: c.ig_image, igVerified: c.ig_verified,
                        igAvgLikes: c.ig_avg_likes, igAvgComments: c.ig_avg_comments,
                        igAvgReelViews: c.ig_avg_reel_views, ttImage: c.tt_image,
                        ttVerified: c.tt_verified, ttAvgVideoViews: c.tt_avg_video_views,
                        geschlecht: c.geschlecht || '',
                        tkpReel: c.tkp_reel, _id: c.id,
                      })))
                    }
                  }
                  setRefreshing(false)
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-apple-sm border border-white/10 text-ink-2 text-xs hover:bg-white/[0.04] transition-colors"
              >
                <span className={refreshing ? 'animate-spin inline-block' : ''}>↻</span>
                {refreshing ? 'Lädt...' : 'Aktualisieren'}
              </button>
              <button onClick={openAdd} className="flex items-center gap-2 px-3 py-1.5 rounded-apple-sm bg-accent text-ink-1 text-xs hover:bg-accent-hover shadow-[0_6px_20px_-4px_rgba(10,132,255,0.55)] transition-colors font-medium">
                + Creator hinzufügen
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {tableLoading && (
            <div className="flex items-center justify-center py-20 gap-3">
              <div className="w-5 h-5 border-2 border-white/20 border-t-[#0A84FF] rounded-full animate-spin"/>
              <span className="text-ink-3 text-sm">Creator werden geladen...</span>
            </div>
          )}
          <div className="flex gap-3 mb-5 flex-wrap" style={{display: tableLoading ? 'none' : 'flex'}}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, Handle oder Code..."
              className="flex-1 min-w-48 bg-surface-2 border border-hairline rounded-apple-sm px-4 py-2.5 text-ink-1 text-sm placeholder-gray-700 focus:outline-none" />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="bg-surface-2 border border-hairline rounded-apple-sm px-4 py-2.5 text-ink-2 text-sm focus:outline-none">
              <option value="">Alle Status</option>
              {['Deal', 'In Verhandlung', 'Kontaktiert', 'Offen', 'Abgelehnt'].map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={filterTier} onChange={e => setFilterTier(e.target.value)}
              className="bg-surface-2 border border-hairline rounded-apple-sm px-4 py-2.5 text-ink-2 text-sm focus:outline-none">
              <option value="">Alle Tiers</option>
              {['Nano', 'Micro', 'Mid-Tier', 'Macro', 'Top-Tier'].map(t => <option key={t}>{t}</option>)}
            </select>
            <select value={filterGeschlecht} onChange={e => setFilterGeschlecht(e.target.value)}
              className="bg-surface-2 border border-hairline rounded-apple-sm px-4 py-2.5 text-ink-2 text-sm focus:outline-none">
              <option value="">Alle Geschlechter</option>
              {['Weiblich', 'Männlich', 'Divers'].map(g => <option key={g}>{g}</option>)}
            </select>
            <select value={filterLand} onChange={e => setFilterLand(e.target.value)}
              className="bg-surface-2 border border-hairline rounded-apple-sm px-4 py-2.5 text-ink-2 text-sm focus:outline-none">
              <option value="">Alle Laender</option>
              {Array.from(new Set(creators.map((c: any) => c.land).filter(Boolean))).sort().map((l: any) => <option key={l}>{l}</option>)}
            </select>
          </div>

          <div className="bg-surface-2 rounded-apple-lg border border-hairline-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: 'max-content' }}>
                <thead>
                  <tr className="border-b border-hairline-soft">
                    <th className="text-left text-xs text-ink-4 px-5 py-3.5 font-medium whitespace-nowrap sticky left-0 bg-surface-2">Creator</th>
                    {allColumns.filter(c => visibleCols.includes(c.key)).map(col => (
                      <th key={col.key} className="text-left text-xs text-ink-4 px-5 py-3.5 font-medium whitespace-nowrap">{col.label}</th>
                    ))}
                    <th className="text-left text-xs text-ink-4 px-5 py-3.5 font-medium">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => { return (<>
                    <tr key={c.name} onClick={async () => { 
                      setSelected(c); setDetailTab('overview')
                      const id = (c as any)._id
                      if (id) {
                        // Lade Postings und berechne Ergebnisse
                        getToken().then(async token => {
                          const r = await fetch('/api/postings?creator_id=' + id, { headers: { authorization: 'Bearer ' + token } })
                          const d = await r.json()
                          if (Array.isArray(d) && d.length > 0) {
                            setPostings(d)
                            setExpandedPostings((prev:any) => ({...prev, [id]: d}))
                            const totalOrgU = d.reduce((s:number,p:any)=>s+(p.org_umsatz||0),0)
                            const totalAdU = d.reduce((s:number,p:any)=>s+(p.ad_umsatz||0),0)
                            const totalFee = d.reduce((s:number,p:any)=>s+(p.fee||0)+(p.produkt||0),0)
                            const totalAdS = d.reduce((s:number,p:any)=>s+(p.ad_spend||0),0)
                            const gesROAS = (totalFee+totalAdS)>0 ? Math.round((totalOrgU+totalAdU)/(totalFee+totalAdS)*100)/100 : 0
                            setSelected((p:any) => p ? {...p, orgUmsatz:totalOrgU, adUmsatz:totalAdU, gesUmsatz:totalOrgU+totalAdU, gesROAS} : p)
                            setCreators(prev => prev.map(x => (x as any)._id === id ? {...x, gesROAS, orgUmsatz:totalOrgU} : x))
                          } else {
                            setPostings([])
                          }
                        })
                        // Save today's snapshot
                        getToken().then(token => fetch('/api/snapshots', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token },
                          body: JSON.stringify({ creator_id: id, ig_follower: c.igFollower, tt_follower: c.ttFollower, ig_avg_likes: c.igAvgLikes, ig_er: c.igEr, tt_avg_video_views: c.ttAvgVideoViews, tt_er: c.ttEr })
                        }))
                        // Load snapshot history
                        setSnapshotLoading(true); getToken().then(token => fetch('/api/snapshots?creator_id=' + id, { headers: { authorization: 'Bearer ' + token } }).then(r => r.json()).then(d => { setSnapshots(Array.isArray(d) ? d : []); setSnapshotLoading(false) }))
                      }
                    }}
                      className={`hover:bg-white/[0.02] cursor-pointer transition-colors ${i !== filtered.length - 1 ? 'border-b border-hairline-soft' : ''}`}>
                      <td className="px-5 py-4 sticky left-0 bg-surface-2 overflow-visible">
                        <div className="flex items-center gap-3">
                          <button onClick={async e => {
                            e.stopPropagation()
                            const id = (c as any)._id
                            if (!id) return
                            if (expandedCreator === id) { setExpandedCreator(null); return }
                            setExpandedCreator(id)
                            setLoadingPostings(id)
                            setExpandedPostings((prev:any) => ({...prev, [id]: prev[id] || []}))
                            const token = await getToken()
                            const res = await fetch('/api/postings?creator_id=' + id, { headers: { authorization: 'Bearer ' + token } })
                            const d = await res.json()
                            setExpandedPostings((prev:any) => ({...prev, [id]: Array.isArray(d) ? d : []}))
                            setLoadingPostings(null)
                          }} className="text-ink-4 hover:text-ink-1 text-xs transition-colors flex-shrink-0 w-4 flex items-center justify-center">
                            {loadingPostings === (c as any)._id
                              ? <span className="w-3 h-3 border-2 border-white/20 border-t-white/80 rounded-full animate-spin inline-block"/>
                              : expandedCreator === (c as any)._id ? '▲' : '▼'}
                          </button>
                          <div className="relative flex-shrink-0 w-12 h-9">
                            <div className="w-9 h-9 rounded-full absolute left-0 top-0 border-2 border-hairline bg-[#FF375F] flex items-center justify-center text-ink-1 text-sm font-bold overflow-hidden z-10">
                              <span>{c.name.split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase()}</span>
                              {(c.ttImage || c.igImage) && <img src={avatarSrc(c.ttImage || c.igImage)} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e:any) => { const img = e.currentTarget as HTMLImageElement; const fb = c.ttImage ? c.igImage : null; if (fb && img.dataset.fb !== '1') { img.dataset.fb = '1'; img.src = avatarSrc(fb) as string } else { img.remove() } }} />}
                            </div>
                            <div className="w-5 h-5 rounded-full absolute left-5 top-4 border-2 border-hairline bg-[#555] flex items-center justify-center overflow-hidden z-20">
                              {c.tt
                                ? <span className="text-[6px] text-ink-2 font-bold">{c.name.split(' ').map((n:string)=>n[0]).join('').slice(0,1)}</span>
                                : <span className="text-[6px] text-ink-4">—</span>}
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="text-ink-1 text-sm font-medium whitespace-nowrap">{c.name}</span>
                              {c.igVerified && <span className="text-blue-400 text-xs">✓</span>}
                            </div>
                            {(() => {
                              const h = (c.ig || '').replace('@','').trim()
                              if (!h) return <span className="text-ink-4 text-xs">—</span>
                              const url = h.startsWith('http') ? h : 'https://instagram.com/' + h
                              return <a href={url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-ink-3 hover:text-accent text-xs transition-colors">{c.ig}</a>
                            })()}
                          </div>
                        </div>
                      </td>
                      {allColumns.filter(col => visibleCols.includes(col.key)).map(col => (
                        <td key={col.key} className="px-5 py-4 whitespace-nowrap">{renderCell(c, col.key)}</td>
                      ))}
                      <td className="px-5 py-4">
                        <button onClick={async e => {
                          e.stopPropagation()
                          const btn = e.currentTarget as HTMLButtonElement
                          btn.disabled = true
                          btn.innerHTML = '<span style="display:inline-block;width:10px;height:10px;border:2px solid rgba(239,68,68,0.3);border-top-color:rgb(239,68,68);border-radius:50%;animation:spin 0.6s linear infinite"></span>'
                          if ((c as any)._id) { const t = await getToken(); await fetch(`/api/creators/${(c as any)._id}`, { method: 'DELETE', headers: { authorization: 'Bearer ' + t } }); }
                          setCreators(prev => prev.filter(x => x !== c))
                        }}
                          className="text-red-500/50 hover:text-red-400 text-xs px-2 py-1 rounded-apple-sm hover:bg-red-950/30 transition-colors">
                          Löschen
                        </button>

                      </td>
                    </tr>
                    {expandedCreator === (c as any)._id && expandedPostings[(c as any)._id] !== undefined && (
                      <tr>
                        <td colSpan={20} className="p-0 bg-surface-0">
                          <div className="border-t border-b border-accent/20 bg-surface-1">
                            <div className="flex items-center justify-between px-8 py-2 border-b border-hairline-soft">
                              <span className="text-ink-3 text-[10px]">{expandedPostings[(c as any)._id].length} Posting(s)</span>
                              <button onClick={e => { e.stopPropagation(); setSelected(c); setDetailTab('postings'); setEditingPostingId(null); setPostingForm({kampagne:'',buchungstyp:'Reel',datum:'',fee:0,produkt:0,promo_code:'',org_umsatz:0,org_klicks:0,ad_spend:0,ad_umsatz:0,notizen:'',post_link:'',views:0,likes:0,comments:0,shares:0,caption:''}); setPullError(''); setShowAddPosting(true) }}
                                className="text-[10px] px-2 py-1 rounded-apple-sm bg-accent/20 text-accent hover:bg-accent/30 transition-colors">
                                + Posting hinzufügen
                              </button>
                            </div>
                            {expandedPostings[(c as any)._id].length === 0 ? (
                              <div className="px-8 py-3 text-ink-4 text-xs">Noch keine Postings</div>
                            ) : expandedPostings[(c as any)._id].map((p:any) => (
                              <div key={p.id} className="flex items-center gap-6 px-8 py-2.5 border-b border-hairline-soft last:border-0 flex-wrap">
                                <div className="min-w-[120px]">
                                  <div className="text-ink-1 text-xs font-medium">{p.kampagne||'—'}</div>
                                  <div className="text-ink-4 text-[10px]">{p.buchungstyp} · {p.datum||'—'}</div>
                                  {(p.views > 0 || p.likes > 0 || p.comments > 0) && (
                                    <div className="text-ink-3 text-[10px] mt-0.5">👁 {(p.views||0).toLocaleString('de-DE')} · ❤️ {(p.likes||0).toLocaleString('de-DE')} · 💬 {(p.comments||0).toLocaleString('de-DE')}</div>
                                  )}
                                </div>
                                <div className="flex items-center gap-5 text-xs flex-wrap">
                                  <div><div className="text-ink-4 text-[10px]">Fee</div><div className="text-ink-1">{((p.fee||0)+(p.produkt||0)).toLocaleString('de-DE')} €</div></div>
                                  <div><div className="text-ink-4 text-[10px]">Org. Umsatz</div><div className="text-emerald-400">{(p.org_umsatz||0).toLocaleString('de-DE')} €</div></div>
                                  <div><div className="text-ink-4 text-[10px]">Org. ROAS</div><div className={p.org_roas>=3?'text-emerald-400':p.org_roas>=1?'text-amber-400':'text-ink-2'}>{p.org_roas>0?p.org_roas+'x':'—'}</div></div>
                                  <div><div className="text-ink-4 text-[10px]">Ad Spend</div><div className="text-ink-1">{(p.ad_spend||0).toLocaleString('de-DE')} €</div></div>
                                  <div><div className="text-ink-4 text-[10px]">Ad Umsatz</div><div className="text-emerald-400">{(p.ad_umsatz||0).toLocaleString('de-DE')} €</div></div>
                                  <div><div className="text-ink-4 text-[10px]">Ges. ROAS</div><div className={`font-bold ${p.ges_roas>=3?'text-emerald-400':p.ges_roas>=1?'text-amber-400':'text-ink-2'}`}>{p.ges_roas>0?p.ges_roas+'x':'—'}</div></div>
                                  {p.promo_code && <div><div className="text-ink-4 text-[10px]">Code</div><div className="text-accent">{p.promo_code}</div></div>}
                                  <div className="flex items-center gap-1 ml-auto">
                                    <button onClick={e => {
                                      e.stopPropagation()
                                      setSelected(c)
                                      setDetailTab('postings')
                                      setEditingPostingId(p.id)
                                      setPostingForm({kampagne:p.kampagne||'',buchungstyp:p.buchungstyp||'Reel',datum:p.datum||'',fee:p.fee||0,produkt:p.produkt||0,promo_code:p.promo_code||'',org_umsatz:p.org_umsatz||0,org_klicks:p.org_klicks||0,ad_spend:p.ad_spend||0,ad_umsatz:p.ad_umsatz||0,notizen:p.notizen||'',post_link:p.post_link||'',views:p.views||0,likes:p.likes||0,comments:p.comments||0,shares:p.shares||0,caption:p.caption||''})
                                      setShowAddPosting(true)
                                    }} className="text-ink-3 hover:text-ink-1 text-xs px-2 py-1 rounded hover:bg-white/[0.06] transition-colors">Bearbeiten</button>
                                    {p.post_link && (
                                      <button onClick={(e:any) => { e.stopPropagation(); refreshPosting(p) }} disabled={refreshingPosting===p.id} title="Zahlen aktualisieren" className="text-ink-3 hover:text-accent text-xs px-2 py-1 rounded hover:bg-white/[0.06] transition-colors flex items-center gap-1">
                                        {refreshingPosting===p.id ? <span className="w-3 h-3 border-2 border-accent/30 border-t-[#0A84FF] rounded-full animate-spin"/> : '↻'}
                                      </button>
                                    )}
                                    <button onClick={async e => {
                                      e.stopPropagation()
                                      setDeletingPosting(p.id)
                                      const token = await getToken()
                                      await fetch('/api/postings/'+p.id, {method:'DELETE', headers:{authorization:'Bearer '+token}})
                                      setExpandedPostings((prev:any) => ({...prev, [(c as any)._id]: (prev[(c as any)._id]||[]).filter((x:any) => x.id !== p.id)}))
                                      setDeletingPosting(null)
                                    }} disabled={deletingPosting===p.id} className="text-red-500/50 hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-red-950/30 transition-colors flex items-center gap-1">
                                      {deletingPosting===p.id && <span className="w-3 h-3 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin"/>}
                                      Löschen
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>)
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>



        {/* Detail Slide-over */}
        {selected && (
          <div className="fixed inset-0 z-50 flex" onClick={() => setSelected(null)}>
            <div className="flex-1 bg-black/60 backdrop-blur-sm" />
            <div className="w-full max-w-2xl bg-surface-0 border-l border-hairline h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-5 border-b border-hairline-soft sticky top-0 bg-surface-0 z-10">
                <div className="flex items-center gap-4">
                  {(selected.ttImage || selected.igImage) ? (
                    <img src={avatarSrc(selected.ttImage || selected.igImage)} alt={selected.name} className="w-14 h-14 rounded-full object-cover border-2 border-white/10" onError={avatarOnError(selected.ttImage ? selected.igImage : null)} />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-[#FF375F]/20 flex items-center justify-center text-[#FF375F] font-semibold text-xl">
                      {selected.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-ink-1 font-semibold text-base">{selected.name}</span>
                      {selected.igVerified && <span className="text-blue-400 text-sm">✓</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {(() => {
                        const h = (selected.ig || '').replace('@','').trim()
                        if (!h) return null
                        const url = h.startsWith('http') ? h : 'https://instagram.com/' + h
                        return <a href={url} target="_blank" rel="noopener noreferrer" title="Instagram-Profil öffnen" className="text-ink-2 hover:text-accent text-xs underline decoration-dotted underline-offset-2 transition-colors">{selected.ig} ↗</a>
                      })()}
                      {selected.tt && (() => {
                        const h = (selected.tt || '').replace('@','').trim()
                        const url = h.startsWith('http') ? h : 'https://tiktok.com/@' + h
                        return <a href={url} target="_blank" rel="noopener noreferrer" title="TikTok-Profil öffnen" className="text-ink-2 hover:text-accent text-xs underline decoration-dotted underline-offset-2 transition-colors">{selected.tt} ↗</a>
                      })()}
                      <span className={`text-xs px-2 py-0.5 rounded-md ${tierStyle[selected.overallTier]}`}>{selected.overallTier}</span>
                      <select value={selected.status} onChange={e => { const v = e.target.value; setSelected(p => p ? {...p, status: v} : p); updateCreator(selected, {status: v}) }} className={`text-xs px-2 py-0.5 rounded-md border-0 cursor-pointer ${statusStyle[selected.status]} bg-transparent`}>
                        {['Offen','Kontaktiert','In Verhandlung','Deal','Abgelehnt'].map(s => <option key={s} value={s} className="bg-surface-3 text-ink-1">{s}</option>)}
                      </select>
                      <button onClick={startEditHandles} title="IG/TT Handle bearbeiten" className="text-ink-4 hover:text-accent text-xs px-1.5 py-0.5 rounded hover:bg-white/[0.05] transition-colors">Bearbeiten</button>
                    </div>
                    {editingHandles && (
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <input type="text" value={handleForm.ig} onChange={e => setHandleForm(p => ({ ...p, ig: e.target.value }))} placeholder="@instagram" className="bg-surface-0 border border-hairline rounded-apple-sm px-2 py-1 text-xs text-ink-1 w-32 focus:outline-none focus:border-accent/50" />
                        <input type="text" value={handleForm.tt} onChange={e => setHandleForm(p => ({ ...p, tt: e.target.value }))} placeholder="@tiktok" className="bg-surface-0 border border-hairline rounded-apple-sm px-2 py-1 text-xs text-ink-1 w-32 focus:outline-none focus:border-accent/50" />
                        <button onClick={saveHandles} disabled={handleSaving} className="px-2 py-1 rounded-apple-sm bg-accent text-ink-1 text-xs hover:bg-accent-hover disabled:opacity-50">{handleSaving ? '...' : 'Speichern + Daten laden'}</button>
                        <button onClick={() => setEditingHandles(false)} className="px-2 py-1 rounded-apple-sm bg-white/[0.05] text-ink-2 text-xs hover:text-ink-1">Abbrechen</button>
                        {handleError && <span className="text-red-400 text-[10px] w-full">{handleError}</span>}
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-apple-sm bg-white/[0.05] flex items-center justify-center text-ink-2 hover:text-ink-1 text-lg">×</button>
              </div>

              <div className="flex gap-1 px-6 pt-4">
                {([['overview', 'Übersicht'], ...((selected.igGenderMale || selected.igGenderFemale || selected.igTopCountries?.length) ? [['audience', 'Zielgruppe']] : []), ['postings', 'Postings'], ['communication', 'Communication'], ['performance', 'Performance']] as [string,string][]).map(([id, label]) => (
                  <button key={id} onClick={() => setDetailTab(id)}
                    className={`px-3 py-2 rounded-apple-sm text-xs font-medium transition-colors ${detailTab === id ? 'bg-accent/20 text-accent' : 'text-ink-3 hover:text-ink-2'}`}>
                    {label}
                  </button>
                ))}
              </div>

              <div className="p-6 flex flex-col gap-5">
                {detailTab === 'overview' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-surface-0 rounded-apple-sm p-4 border border-hairline-soft">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-pink-400 text-sm">📸</span>
                          <span className="text-ink-2 text-xs font-medium">Instagram</span>
                        </div>
                        <div className="space-y-2">
                          {[
                            ['Follower', selected.igFollower.toLocaleString('de-DE')],
                            ['Tier', selected.igTier],
                            ['ER', `${selected.igEr}%`],
                            ['Ø Reel Views', selected.igAvgReelViews ? selected.igAvgReelViews.toLocaleString('de-DE') : '—'],
                            ['Ø Likes', selected.igAvgLikes ? selected.igAvgLikes.toLocaleString('de-DE') : '—'],
                            ['Ø Kommentare', selected.igAvgComments ? selected.igAvgComments.toLocaleString('de-DE') : '—'],
                            ['Posts/Woche', selected.igPostsPerWeek ? `${selected.igPostsPerWeek}` : '—'],
                          ].map(([l, v]) => (
                            <div key={l} className="flex justify-between">
                              <span className="text-ink-4 text-xs">{l}</span>
                              <span className="text-ink-1 text-xs font-medium">{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-surface-0 rounded-apple-sm p-4 border border-hairline-soft">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-ink-1 text-sm">🎵</span>
                          <span className="text-ink-2 text-xs font-medium">TikTok</span>
                        </div>
                        {selected.ttFollower > 0 ? (
                          <div className="space-y-2">
                            {[
                              ['Follower', selected.ttFollower.toLocaleString('de-DE')],
                              ['Tier', selected.ttTier],
                              ['ER', `${selected.ttEr}%`],
                              ['Ø Views', (selected.ttAvgVideoViews || selected.ttAvgViews || 0).toLocaleString('de-DE')],
                              ['Ø Likes', (selected.ttAvgVideoLikes || selected.ttAvgLikes || 0).toLocaleString('de-DE')],
                              ['Ø Kommentare', (selected.ttAvgVideoComments || selected.ttAvgComments || 0).toLocaleString('de-DE')],
                              ['Ø Reposts', selected.ttAvgReposts ? selected.ttAvgReposts.toLocaleString('de-DE') : '—'],
                            ].map(([l, v]) => (
                              <div key={l} className="flex justify-between">
                                <span className="text-ink-4 text-xs">{l}</span>
                                <span className="text-ink-1 text-xs font-medium">{v}</span>
                              </div>
                            ))}
                          </div>
                        ) : <p className="text-ink-4 text-xs">Kein TikTok</p>}
                      </div>
                    </div>

                    <div className="bg-surface-0 rounded-apple-sm p-4 border border-hairline-soft">
                      <p className="text-ink-4 text-[10px] font-semibold uppercase tracking-widest mb-3">Qualität & Echtheit</p>
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        {(() => {
                          const igEr = selected.igEr || 0
                          const ttEr = selected.ttEr || 0
                          const avgEr = (igEr + ttEr) / (igEr && ttEr ? 2 : 1) || 0
                          let echtePct: number = selected.igRealFollowers || 0
                          if (!echtePct && avgEr > 0) {
                            // Logarithmische Formel: ER 0→50%, ER 1→72%, ER 3→85%, ER 5→90%, ER 10→95%
                            echtePct = Math.min(50 + Math.log(avgEr + 1) * 18, 98)
                            // Kleine Variation basierend auf Likes/Follower Ratio
                            const igFollowers = selected.igFollower || 0
                            const igLikes = selected.igAvgLikes || 0
                            if (igFollowers > 0 && igLikes > 0) {
                              const likesRatio = (igLikes / igFollowers) * 100
                              echtePct += (likesRatio - avgEr) * 0.3
                            }
                            echtePct = Math.round(echtePct * 100) / 100
                            echtePct = Math.max(0, Math.min(echtePct, 99.5))
                          }
                          const fakePct = echtePct > 0 ? Math.round((100 - echtePct) * 100) / 100 : 0
                          let qualityScore: number = selected.igQualityScore ? selected.igQualityScore * 100 : 0
                          if (!qualityScore && avgEr > 0) {
                            const erScore = Math.min(avgEr * 7.5 + Math.log(avgEr + 1) * 3, 55)
                            const verifiedBonus = ((selected.igVerified ? 12 : 0) + (selected.ttVerified ? 12 : 0))
                            const followerSum = (selected.igFollower || 0) + (selected.ttFollower || 0)
                            const followerScore = followerSum > 0 ? Math.min(Math.log10(followerSum) * 4, 25) : 0
                            qualityScore = Math.min(erScore + verifiedBonus + followerScore, 99.5)
                            qualityScore = Math.round(qualityScore * 100) / 100
                          }
                          return [
                            { label: 'Aktive Follower', value: echtePct > 0 ? echtePct + '%' : '—', color: echtePct >= 80 ? 'text-emerald-400' : echtePct >= 60 ? 'text-amber-400' : 'text-red-400' },
                            { label: 'Inaktive Follower', value: echtePct > 0 ? fakePct + '%' : '—', color: fakePct <= 20 ? 'text-emerald-400' : fakePct <= 40 ? 'text-amber-400' : 'text-red-400' },
                            { label: 'Quality Score', value: qualityScore > 0 ? qualityScore + '/100' : '—', color: qualityScore >= 70 ? 'text-emerald-400' : qualityScore >= 50 ? 'text-amber-400' : 'text-red-400' },
                          ]
                        })().map(m => (
                          <div key={m.label} className="text-center">
                            <div className={`text-xl font-bold mb-1 ${m.color}`}>{m.value}</div>
                            <div className="text-ink-4 text-xs">{m.label}</div>
                          </div>
                        ))}
                      </div>
                      {selected.igRealFollowers && (
                        <>
                          <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${selected.igRealFollowers}%` }} />
                          </div>
                          <div className="flex justify-between text-xs mt-1">
                            <span className="text-emerald-500">{selected.igRealFollowers}% echt</span>
                            <span className="text-red-500">{100 - selected.igRealFollowers}% nicht echt</span>
                          </div>
                        </>
                      )}
                    </div>

                    {(selected.igFollowerWachstum7d !== undefined || selected.ttFollowerWachstum7d !== undefined) && (
                      <div className="bg-surface-0 rounded-apple-sm p-4 border border-hairline-soft">
                        <p className="text-ink-4 text-[10px] font-semibold uppercase tracking-widest mb-3">Follower Wachstum (7 Tage)</p>
                        <div className="grid grid-cols-2 gap-3">
                          {selected.igFollowerWachstum7d !== undefined && (
                            <div>
                              <div className="text-ink-3 text-xs mb-1">Instagram</div>
                              <div className={`text-lg font-bold ${(selected.igFollowerWachstum7d || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {(selected.igFollowerWachstum7d || 0) >= 0 ? '+' : ''}{selected.igFollowerWachstum7d?.toLocaleString('de-DE')}
                              </div>
                            </div>
                          )}
                          {selected.ttFollowerWachstum7d !== undefined && selected.ttFollower > 0 && (
                            <div>
                              <div className="text-ink-3 text-xs mb-1">TikTok</div>
                              <div className={`text-lg font-bold ${(selected.ttFollowerWachstum7d || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {(selected.ttFollowerWachstum7d || 0) >= 0 ? '+' : ''}{selected.ttFollowerWachstum7d?.toLocaleString('de-DE')}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {detailTab === 'overview' && snapshotLoading && (
                  <div className="flex items-center gap-2 py-4 justify-center">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-[#0A84FF] rounded-full animate-spin"/>
                    <span className="text-ink-3 text-xs">Verlauf wird geladen...</span>
                  </div>
                )}
                {detailTab === 'overview' && !snapshotLoading && snapshots.length > 1 && (
                  <div className="bg-surface-0 rounded-apple-sm border border-hairline-soft p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-ink-3 text-xs font-medium">Follower-Entwicklung</p>
                      <div className="flex items-center gap-1">
                        {[7,15,30].map((d:number) => (
                          <button key={d} onClick={() => setFollowerDays(d)}
                            className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${followerDays===d ? 'bg-accent text-ink-1' : 'text-ink-3 hover:text-ink-2'}`}>
                            {d}T
                          </button>
                        ))}
                      </div>
                    </div>
                    {(() => {
                      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - followerDays)
                      const sl = snapshots.filter((s:any) => new Date(s.created_at) >= cutoff)
                      if (sl.length < 2) return <div className="text-ink-4 text-xs text-center py-4">Noch nicht genug Daten</div>
                      const igLast = sl[sl.length-1]?.ig_follower||0
                      const ttLast = sl[sl.length-1]?.tt_follower||0
                      const igFirst = sl[0]?.ig_follower||0
                      const ttFirst = sl[0]?.tt_follower||0
                      const igDiff = igLast - igFirst
                      const ttDiff = ttLast - ttFirst
                      const igVals = sl.map((s:any)=>s.ig_follower||0)
                      const ttVals = sl.map((s:any)=>s.tt_follower||0)
                      const igMin = Math.min(...igVals), igMax = Math.max(...igVals), igRange = Math.max(igMax-igMin, igMax*0.0002)||1
                      const ttMin = Math.min(...ttVals), ttMax = Math.max(...ttVals), ttRange = Math.max(ttMax-ttMin, ttMax*0.0002)||1
                      const w = 100/(sl.length-1)
                      const igPts = sl.map((s:any,idx:number)=>`${idx*w},${90-(((s.ig_follower||0)-igMin)/igRange)*80}`).join(' ')
                      const ttPts = sl.map((s:any,idx:number)=>`${idx*w},${90-(((s.tt_follower||0)-ttMin)/ttRange)*80}`).join(' ')
                      return (<>
                        <div className="flex items-center gap-4 mb-2">
                          <span className="flex items-center gap-1.5 text-[10px] text-ink-2">
                            <span className="w-2 h-0.5 bg-[#E1306C] inline-block rounded"/>
                            IG {igLast.toLocaleString('de-DE')}
                            <span className={igDiff>=0?'text-emerald-400':'text-red-400'}>{igDiff>=0?'+':''}{igDiff.toLocaleString('de-DE')}</span>
                          </span>
                          <span className="flex items-center gap-1.5 text-[10px] text-ink-2">
                            <span className="w-2 h-0.5 bg-white/60 inline-block rounded"/>
                            TT {ttLast.toLocaleString('de-DE')}
                            <span className={ttDiff>=0?'text-emerald-400':'text-red-400'}>{ttDiff>=0?'+':''}{ttDiff.toLocaleString('de-DE')}</span>
                          </span>
                        </div>
                        <div className="relative" style={{height:'80px'}}
                          onMouseMove={e => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            const x = (e.clientX-rect.left)/rect.width
                            const idx = Math.min(Math.round(x*(sl.length-1)),sl.length-1)
                            const s = sl[idx]
                            setChartHover({ig:s.ig_follower||0,tt:s.tt_follower||0,date:new Date(s.created_at).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'}),pct:x*100})
                          }}
                          onMouseLeave={()=>setChartHover(null)}>
                          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                            <polyline points={igPts} fill="none" stroke="#E1306C" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
                            <polyline points={ttPts} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeDasharray="3,2" vectorEffect="non-scaling-stroke"/>
                          </svg>
                          {chartHover && (
                            <div className="absolute top-0 pointer-events-none z-10" style={{left:`${Math.min(chartHover.pct,70)}%`}}>
                              <div className="bg-surface-3 border border-white/10 rounded-apple-sm px-2 py-1.5 shadow-xl">
                                <div className="text-ink-2 text-[10px] mb-1">{chartHover.date}</div>
                                <div className="flex items-center gap-1 text-[10px]"><span className="w-1.5 h-1.5 bg-[#E1306C] rounded-full inline-block"/>IG {chartHover.ig.toLocaleString('de-DE')}</div>
                                <div className="flex items-center gap-1 text-[10px]"><span className="w-1.5 h-1.5 bg-white/60 rounded-full inline-block"/>TT {chartHover.tt.toLocaleString('de-DE')}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </>)
                    })()}
                  </div>
                )}
                {detailTab === 'overview' && !snapshotLoading && snapshots.filter((s:any) => (s.tt_avg_video_views||0) > 0).length > 1 && (
                  <div className="bg-surface-0 rounded-apple-sm border border-hairline-soft p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px]">♪</span>
                        <p className="text-ink-3 text-xs font-medium">Ø TikTok Views</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {[7,15,30].map((d:number) => (
                          <button key={d} onClick={() => setViewsDays(d)}
                            className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${viewsDays===d ? 'bg-[#F59E0B] text-black' : 'text-ink-3 hover:text-ink-2'}`}>
                            {d}T
                          </button>
                        ))}
                      </div>
                    </div>
                    {(() => {
                      const cutoff2 = new Date(); cutoff2.setDate(cutoff2.getDate() - viewsDays)
                      const valid = snapshots.filter((s:any) => (s.tt_avg_video_views||0) > 0 && new Date(s.created_at) >= cutoff2)
                      if (valid.length < 2) return <div className="text-ink-4 text-xs text-center py-4">Noch nicht genug Daten</div>
                      const last = valid[valid.length-1].tt_avg_video_views||0
                      const first = valid[0].tt_avg_video_views||0
                      const diff = last - first
                      const vals = valid.map((s:any)=>s.tt_avg_video_views||0)
                      const minV = Math.min(...vals), maxV = Math.max(...vals), range = Math.max(maxV-minV, maxV*0.0002)||1
                      const w = 100/(valid.length-1)
                      const pts = valid.map((s:any,i:number)=>`${i*w},${90-(((s.tt_avg_video_views||0)-minV)/range)*80}`).join(' ')
                      return (<>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] text-ink-2">{last.toLocaleString('de-DE')} Views</span>
                          <span className={`text-[10px] ${diff>=0?'text-emerald-400':'text-red-400'}`}>{diff>=0?'+':''}{diff.toLocaleString('de-DE')}</span>
                        </div>
                        <div className="relative" style={{height:'80px'}}
                          onMouseMove={e => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            const x = (e.clientX-rect.left)/rect.width
                            const idx = Math.min(Math.round(x*(valid.length-1)),valid.length-1)
                            const s = valid[idx]
                            setViewsHover({views:s.tt_avg_video_views||0,date:new Date(s.created_at).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'}),pct:x*100})
                          }}
                          onMouseLeave={()=>setViewsHover(null)}>
                          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                            <polyline points={pts} fill="none" stroke="#F59E0B" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
                          </svg>
                          {viewsHover && (
                            <div className="absolute top-0 pointer-events-none z-10" style={{left:`${Math.min(viewsHover.pct,70)}%`}}>
                              <div className="bg-surface-3 border border-white/10 rounded-apple-sm px-2 py-1.5 shadow-xl">
                                <div className="text-ink-2 text-[10px] mb-1">{viewsHover.date}</div>
                                <div className="flex items-center gap-1 text-[10px]"><span className="w-1.5 h-1.5 bg-[#F59E0B] rounded-full inline-block"/>⌀ {viewsHover.views.toLocaleString('de-DE')}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </>)
                    })()}
                  </div>
                )}
                {detailTab === 'postings' && (
                  <div className="space-y-3">
                    <button onClick={() => { setEditingPostingId(null); setPostingForm({kampagne:'',buchungstyp:'Reel',datum:'',fee:0,produkt:0,promo_code:'',org_umsatz:0,org_klicks:0,ad_spend:0,ad_umsatz:0,notizen:'',post_link:'',views:0,likes:0,comments:0,shares:0,caption:''}); setPullError(''); setShowAddPosting(true) }}
                      className="w-full py-2 rounded-apple-sm border border-dashed border-white/20 text-ink-3 text-xs hover:border-accent hover:text-accent transition-colors">
                      + Neues Posting hinzufügen
                    </button>
                    {showAddPosting && (
                      <div className="bg-surface-0 rounded-apple-sm border border-hairline-soft p-4 space-y-3">
                        <p className="text-ink-1 text-xs font-medium">Neues Posting</p>
                        <div>
                          <label className="text-ink-4 text-xs block mb-1">Post-Link (TikTok / Instagram)</label>
                          <div className="flex gap-2">
                            <input type="text" value={postingForm.post_link} placeholder="TikTok- oder Instagram-Link einfügen..."
                              onChange={e => setPostingForm((p:any) => ({...p, post_link: e.target.value}))}
                              className="flex-1 bg-surface-0 border border-hairline rounded-apple-sm px-2 py-1.5 text-ink-1 text-xs"/>
                            <button type="button" disabled={pullingStats || !postingForm.post_link}
                              onClick={async () => {
                                setPullError(''); setPullingStats(true)
                                try {
                                  const token = await getToken()
                                  const r = await fetch('/api/post-stats?link=' + encodeURIComponent(postingForm.post_link), { headers: { authorization: 'Bearer ' + token } })
                                  const d = await r.json()
                                  if (!r.ok) { setPullError(d.error || 'Fehler beim Laden'); }
                                  else {
                                    setPostingForm((p:any) => ({...p,
                                      views: d.views||0, likes: d.likes||0, comments: d.comments||0, shares: d.shares||0,
                                      caption: d.caption||'',
                                      datum: d.post_datum || p.datum,
                                      buchungstyp: d.platform === 'instagram' ? 'Instagram' : 'TikTok'
                                    }))
                                  }
                                } catch(e:any) { setPullError(e.message || 'Netzwerkfehler') }
                                setPullingStats(false)
                              }}
                              className={`px-3 py-1.5 rounded-apple-sm text-xs whitespace-nowrap flex items-center gap-1 ${pullingStats||!postingForm.post_link ? 'bg-accent/40 text-ink-1/60' : 'bg-accent text-ink-1 hover:bg-accent-hover shadow-[0_6px_20px_-4px_rgba(10,132,255,0.55)]'}`}>
                              {pullingStats ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block"/> : '\ud83d\udcca'} Daten ziehen
                            </button>
                          </div>
                          {pullError && <p className="text-red-400 text-xs mt-1">{pullError}</p>}
                          {(postingForm.views > 0 || postingForm.likes > 0) && (
                            <div className="flex gap-4 mt-2 text-xs">
                              <span className="text-ink-2">Views: <span className="text-ink-1 font-medium">{postingForm.views.toLocaleString('de-DE')}</span></span>
                              <span className="text-ink-2">Likes: <span className="text-ink-1 font-medium">{postingForm.likes.toLocaleString('de-DE')}</span></span>
                              <span className="text-ink-2">Kommentare: <span className="text-ink-1 font-medium">{postingForm.comments.toLocaleString('de-DE')}</span></span>
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {([
                            {label:'Kampagne',key:'kampagne',type:'kampagne'},
                            {label:'Buchungstyp',key:'buchungstyp',type:'buchungstyp'},
                            {label:'Datum',key:'datum',type:'date'},
                            {label:'Fee €',key:'fee',type:'number'},
                            {label:'Produkt €',key:'produkt',type:'number'},
                            {label:'Promo Code',key:'promo_code',type:'text'},
                            {label:'Org. Umsatz €',key:'org_umsatz',type:'number'},
                            {label:'Org. Klicks',key:'org_klicks',type:'number'},
                            {label:'Ad Spend €',key:'ad_spend',type:'number'},
                            {label:'Ad Umsatz €',key:'ad_umsatz',type:'number'},
                          ] as {label:string,key:string,type:string}[]).map(({label,key,type}) => (
                            <div key={key}>
                              <label className="text-ink-4 text-xs block mb-1">{label}</label>
                              {type === 'kampagne' ? (
                                <div>
                                  <select value={(postingForm as any)[key]} onChange={e => e.target.value !== '__add__' && setPostingForm((p:any) => ({...p, [key]: e.target.value}))}
                                    className="w-full bg-surface-0 border border-hairline rounded-apple-sm px-2 py-1.5 text-ink-1 text-xs">
                                    <option value="">— wählen —</option>
                                    {kampagnenList.map((k:string) => <option key={k} value={k}>{k}</option>)}
                                    <option value="__add__" className="text-accent">+ Neue Kampagne</option>
                                  </select>
                                  {(postingForm as any)[key] === '__add__' || !(kampagnenList.includes((postingForm as any)[key] || '')) && (postingForm as any)[key] ? (
                                    <input type="text" placeholder="Kampagnenname eingeben" value={(postingForm as any)[key] === '__add__' ? '' : (postingForm as any)[key]}
                                      onChange={e => setPostingForm((p:any) => ({...p, [key]: e.target.value}))}
                                      className="w-full mt-1 bg-surface-0 border border-accent/50 rounded-apple-sm px-2 py-1.5 text-ink-1 text-xs"/>
                                  ) : null}
                                </div>
                              ) : type === 'buchungstyp' ? (
                                <div>
                                  <select value={(postingForm as any)[key]} onChange={e => e.target.value !== '__add__' ? setPostingForm((p:any) => ({...p, [key]: e.target.value})) : setPostingForm((p:any) => ({...p, [key]: ''}))}
                                    className="w-full bg-surface-0 border border-hairline rounded-apple-sm px-2 py-1.5 text-ink-1 text-xs">
                                    {['Reel','TikTok Post','Story','Story + Reel','Story + TikTok','Reel + TikTok','Bundle','UGC'].map(b => <option key={b} value={b}>{b}</option>)}
                                    <option value="__add__" className="text-accent">+ Neuer Typ</option>
                                  </select>
                                  {(postingForm as any)[key] === '' ? (
                                    <input type="text" placeholder="Buchungstyp eingeben"
                                      onChange={e => setPostingForm((p:any) => ({...p, [key]: e.target.value}))}
                                      className="w-full mt-1 bg-surface-0 border border-accent/50 rounded-apple-sm px-2 py-1.5 text-ink-1 text-xs"/>
                                  ) : null}
                                </div>
                              ) : (
                                <input type={type} value={(postingForm as any)[key]}
                                  onChange={e => setPostingForm((p:any) => ({...p, [key]: type==='number' ? Number(e.target.value)||0 : e.target.value}))}
                                  className="w-full bg-surface-0 border border-hairline rounded-apple-sm px-2 py-1.5 text-ink-1 text-xs"/>
                              )}
                            </div>
                          ))}
                        </div>
                        <div>
                          <label className="text-ink-4 text-xs block mb-1">Notizen</label>
                          <textarea value={postingForm.notizen} onChange={e => setPostingForm((p:any)=>({...p,notizen:e.target.value}))} rows={2}
                            className="w-full bg-surface-0 border border-hairline rounded-apple-sm px-2 py-1.5 text-ink-1 text-xs resize-none"/>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={async () => {
                            if ((window as any).__postingSaving) return
                            ;(window as any).__postingSaving = true
                            setPostingSaving(true)
                            try {
                              const token = await getToken()
                              const gesamt = postingForm.fee + postingForm.produkt
                              const org_roas = gesamt > 0 ? Math.round(postingForm.org_umsatz/gesamt*100)/100 : 0
                              const ad_roas = postingForm.ad_spend > 0 ? Math.round(postingForm.ad_umsatz/postingForm.ad_spend*100)/100 : 0
                              const ges_umsatz = postingForm.org_umsatz + postingForm.ad_umsatz
                              const ges_roas = (gesamt+postingForm.ad_spend) > 0 ? Math.round(ges_umsatz/(gesamt+postingForm.ad_spend)*100)/100 : 0
                              const res = await fetch(editingPostingId ? ('/api/postings/'+editingPostingId) : '/api/postings', {
                                method: editingPostingId ? 'PATCH' : 'POST',
                                headers: {'Content-Type':'application/json', authorization:'Bearer '+token},
                                body: JSON.stringify({...postingForm, creator_id: (selected as any)._id, org_roas, ad_roas, ges_umsatz, ges_roas})
                              })
                              const d = await res.json()
                              if (!res.ok || d.error) { setPullError(d.error || 'Fehler beim Speichern'); (window as any).__postingSaving = false; setPostingSaving(false); return }
                              if (d.id) {
                                // TikTok-Kooperationsvideo automatisch in Reels laden (still, nicht blockierend)
                                if (!editingPostingId && postingForm.post_link && /tiktok\.com/i.test(postingForm.post_link)) {
                                  fetch('/api/reels/auto-import', {
                                    method: 'POST',
                                    headers: {'Content-Type':'application/json', authorization:'Bearer '+token},
                                    body: JSON.stringify({ postLink: postingForm.post_link, creatorId: (selected as any)._id })
                                  }).catch(() => {})
                                }
                                const newPostings = editingPostingId ? postings.map((p:any) => p.id === d.id ? d : p) : [d, ...postings]
                                setPostings(newPostings)
                                setExpandedPostings((prev:any) => ({...prev, [(selected as any)._id]: newPostings}))
                                setShowAddPosting(false)
                                setPostingForm({kampagne:'',buchungstyp:'Reel',datum:'',fee:0,produkt:0,promo_code:'',org_umsatz:0,org_klicks:0,ad_spend:0,ad_umsatz:0,notizen:'',post_link:'',views:0,likes:0,comments:0,shares:0,caption:''}); setPullError(''); setEditingPostingId(null)
                                const totalOrgU = newPostings.reduce((s:number,p:any)=>s+(p.org_umsatz||0),0)
                                const totalAdU = newPostings.reduce((s:number,p:any)=>s+(p.ad_umsatz||0),0)
                                const totalFee = newPostings.reduce((s:number,p:any)=>s+(p.fee||0)+(p.produkt||0),0)
                                const totalAdS = newPostings.reduce((s:number,p:any)=>s+(p.ad_spend||0),0)
                                const newGesROAS = (totalFee+totalAdS)>0 ? Math.round((totalOrgU+totalAdU)/(totalFee+totalAdS)*100)/100 : 0
                                await updateCreator(selected, {orgUmsatz:totalOrgU, adUmsatz:totalAdU, gesUmsatz:totalOrgU+totalAdU, gesROAS:newGesROAS})
                                setCreators(prev => prev.map(x => (x as any)._id === (selected as any)._id ? {...x, gesROAS:newGesROAS, orgUmsatz:totalOrgU} : x))
                              }
                            } finally {
                              setPostingSaving(false)
                              ;(window as any).__postingSaving = false
                            }
                          }} disabled={postingSaving} className={`flex-1 py-2 rounded-apple-sm text-ink-1 text-xs flex items-center justify-center gap-2 ${postingSaving?'bg-accent/50':'bg-accent hover:bg-accent-hover shadow-[0_6px_20px_-4px_rgba(10,132,255,0.55)]'}`}>
                            {postingSaving && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
                            {postingSaving ? 'Speichern...' : 'Speichern'}
                          </button>
                          <button onClick={() => { setEditingPostingId(null); setPullError(''); setShowAddPosting(false) }} className="px-4 py-2 rounded-apple-sm border border-white/10 text-ink-3 text-xs">Abbrechen</button>
                        </div>
                      </div>
                    )}
                    {postings.length === 0 && !showAddPosting && (
                      <div className="text-center py-8 text-ink-4 text-xs">Noch keine Postings</div>
                    )}
                    {postings.map((p:any) => (
                      <div key={p.id} className="bg-surface-0 rounded-apple-sm border border-hairline-soft p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="text-ink-1 text-xs font-medium">{p.kampagne||'—'}</div>
                            <div className="text-ink-4 text-[10px]">{p.buchungstyp} · {p.datum||'—'}</div>
                            {(p.views > 0 || p.likes > 0 || p.comments > 0) && (
                              <div className="text-ink-3 text-[10px] mt-0.5">👁 {(p.views||0).toLocaleString('de-DE')} · ❤️ {(p.likes||0).toLocaleString('de-DE')} · 💬 {(p.comments||0).toLocaleString('de-DE')}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {p.ges_roas > 0 && <span className={`text-xs font-bold ${p.ges_roas>=3?'text-emerald-400':p.ges_roas>=1?'text-amber-400':'text-red-400'}`}>{p.ges_roas}x</span>}
                            {p.post_link && (
                              <button onClick={() => refreshPosting(p)} disabled={refreshingPosting===p.id} title="Zahlen aktualisieren" className="text-ink-3 hover:text-accent text-xs px-2 py-1 rounded hover:bg-white/[0.06] transition-colors flex items-center gap-1">
                                {refreshingPosting===p.id ? <span className="w-3 h-3 border-2 border-accent/30 border-t-[#0A84FF] rounded-full animate-spin"/> : '↻'}
                              </button>
                            )}
                            <button onClick={async () => {
                              setDeletingPosting(p.id)
                              const token = await getToken()
                              await fetch('/api/postings/'+p.id, {method:'DELETE', headers:{authorization:'Bearer '+token}})
                              const newPostings = postings.filter((x:any) => x.id !== p.id)
                              setPostings(newPostings)
                              setExpandedPostings((prev:any) => ({...prev, [(selected as any)._id]: newPostings}))
                              setDeletingPosting(null)
                            }} disabled={deletingPosting===p.id} className="text-red-500/50 hover:text-red-400 text-xs ml-2 px-2 py-1 rounded hover:bg-red-950/30 transition-colors flex items-center gap-1">
                              {deletingPosting===p.id && <span className="w-3 h-3 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin"/>}
                              Löschen
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {[['Fee',`${(p.fee||0)+(p.produkt||0)} €`],['Org. Umsatz',`${p.org_umsatz||0} €`],['Org. ROAS',p.org_roas>0?`${p.org_roas}x`:'—'],['Ad Spend',`${p.ad_spend||0} €`],['Ad Umsatz',`${p.ad_umsatz||0} €`],['Ges. ROAS',p.ges_roas>0?`${p.ges_roas}x`:'—']].map(([l,v]) => (
                            <div key={l} className="bg-surface-0 rounded-apple-sm p-2">
                              <div className="text-ink-4 text-[10px] mb-0.5">{l}</div>
                              <div className="text-ink-1 text-xs font-medium">{v}</div>
                            </div>
                          ))}
                        </div>
                        {p.promo_code && <div className="mt-2 text-ink-3 text-[10px]">Code: <span className="text-accent">{p.promo_code}</span></div>}
                      </div>
                    ))}
                  </div>
                )}
                {detailTab === 'communication' && (
                  <div className="space-y-3">
                    <button onClick={() => setShowAddAktiv(true)}
                      className="w-full py-2 rounded-apple-sm border border-dashed border-white/20 text-ink-3 text-xs hover:border-accent hover:text-accent transition-colors">
                      + Eintrag hinzufügen
                    </button>
                    {showAddAktiv && (
                      <div className="bg-surface-0 rounded-apple-sm border border-hairline-soft p-4 space-y-3">
                        <p className="text-ink-1 text-xs font-medium">Neuer Eintrag</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-ink-4 text-xs block mb-1">Datum</label>
                            <input type="date" value={aktivForm.datum} onChange={e => setAktivForm(p => ({...p, datum: e.target.value}))}
                              className="w-full bg-surface-0 border border-hairline rounded-apple-sm px-2 py-1.5 text-ink-1 text-xs"/>
                          </div>
                          <div>
                            <label className="text-ink-4 text-xs block mb-1">Kanal</label>
                            <select value={aktivForm.kanal} onChange={e => setAktivForm(p => ({...p, kanal: e.target.value}))}
                              className="w-full bg-surface-0 border border-hairline rounded-apple-sm px-2 py-1.5 text-ink-1 text-xs">
                              <option>Mail</option><option>Instagram</option><option>Telefon</option><option>Sonstiges</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-ink-4 text-xs block mb-1">Richtung</label>
                            <select value={aktivForm.richtung} onChange={e => setAktivForm(p => ({...p, richtung: e.target.value}))}
                              className="w-full bg-surface-0 border border-hairline rounded-apple-sm px-2 py-1.5 text-ink-1 text-xs">
                              <option value="raus">Gesendet</option><option value="rein">Erhalten</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-ink-4 text-xs block mb-1">Notiz / Nachricht</label>
                          <textarea value={aktivForm.notiz} onChange={e => setAktivForm(p => ({...p, notiz: e.target.value}))} rows={3}
                            className="w-full bg-surface-0 border border-hairline rounded-apple-sm px-2 py-1.5 text-ink-1 text-xs resize-none"/>
                        </div>
                        <div className="flex gap-2">
                          <button disabled={aktivSaving} onClick={async () => {
                            setAktivSaving(true)
                            try {
                              const token = await getToken()
                              const res = await fetch('/api/aktivitaeten', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token },
                                body: JSON.stringify({ creator_id: (selected as any)._id, datum: aktivForm.datum || null, kanal: aktivForm.kanal, richtung: aktivForm.richtung, notiz: aktivForm.notiz, quelle: 'manuell' })
                              })
                              const d = await res.json()
                              if (res.ok) {
                                setAktivitaeten(prev => [d, ...prev])
                                setAktivForm({datum:'',kanal:'Mail',richtung:'raus',notiz:''})
                                setShowAddAktiv(false)
                              }
                            } finally { setAktivSaving(false) }
                          }} className={`flex-1 py-2 rounded-apple-sm text-ink-1 text-xs flex items-center justify-center gap-2 ${aktivSaving?'bg-accent/50':'bg-accent hover:bg-accent-hover shadow-[0_6px_20px_-4px_rgba(10,132,255,0.55)]'}`}>
                            {aktivSaving && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
                            {aktivSaving ? 'Speichern...' : 'Speichern'}
                          </button>
                          <button onClick={() => setShowAddAktiv(false)} className="px-4 py-2 rounded-apple-sm border border-white/10 text-ink-3 text-xs">Abbrechen</button>
                        </div>
                      </div>
                    )}
                    {loadingAktiv && <div className="text-center py-8 text-ink-4 text-xs">Lädt...</div>}
                    {!loadingAktiv && aktivitaeten.length === 0 && !showAddAktiv && (
                      <div className="text-center py-8 text-ink-4 text-xs">Noch keine Einträge</div>
                    )}
                    {aktivitaeten.map((a:any) => {
                      const icon = a.kanal === 'Instagram' ? '📷' : a.kanal === 'Telefon' ? '📞' : a.kanal === 'Sonstiges' ? '💬' : '✉️'
                      const raus = a.richtung === 'raus'
                      return (
                        <div key={a.id} className="bg-surface-0 rounded-apple-sm border border-hairline-soft p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-sm">{icon}</span>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${raus ? 'bg-accent/20 text-accent' : 'bg-emerald-500/15 text-emerald-400'}`}>{raus ? 'Gesendet' : 'Erhalten'}</span>
                                  <span className="text-ink-4 text-[10px]">{a.kanal} · {a.datum || '—'}</span>
                                </div>
                                {a.notiz && <div className="text-ink-2 text-xs mt-1 whitespace-pre-wrap">{a.notiz}</div>}
                              </div>
                            </div>
                            <button disabled={deletingAktiv===a.id} onClick={async () => {
                              setDeletingAktiv(a.id)
                              const token = await getToken()
                              await fetch('/api/aktivitaeten/'+a.id, { method:'DELETE', headers:{authorization:'Bearer '+token} })
                              setAktivitaeten(prev => prev.filter((x:any) => x.id !== a.id))
                              setDeletingAktiv(null)
                            }} className="text-red-500/50 hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-red-950/30 transition-colors flex-shrink-0">
                              {deletingAktiv===a.id ? '...' : '✕'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                {detailTab === 'audience' && (
                  <>
                    {(selected.igGenderMale || selected.igGenderFemale) ? (
                      <div className="bg-surface-0 rounded-apple-sm p-4 border border-hairline-soft">
                        <p className="text-ink-4 text-[10px] font-semibold uppercase tracking-widest mb-3">Geschlecht</p>
                        <div className="flex items-center gap-4 mb-3">
                          <div className="text-center flex-1">
                            <div className="text-2xl font-bold text-blue-400">{selected.igGenderMale}%</div>
                            <div className="text-ink-4 text-xs">Männlich</div>
                          </div>
                          <div className="text-center flex-1">
                            <div className="text-2xl font-bold text-pink-400">{selected.igGenderFemale}%</div>
                            <div className="text-ink-4 text-xs">Weiblich</div>
                          </div>
                        </div>
                        <div className="h-3 bg-white/[0.05] rounded-full overflow-hidden flex">
                          <div className="h-full bg-blue-500" style={{ width: `${selected.igGenderMale}%` }} />
                          <div className="h-full bg-pink-500 flex-1" />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-surface-0 rounded-apple-sm p-4 border border-hairline-soft text-center text-ink-4 text-sm">
                        Keine Zielgruppen-Daten. Creator mit API hinzufügen.
                      </div>
                    )}

                    {selected.igAgeDistribution && selected.igAgeDistribution.length > 0 && (
                      <div className="bg-surface-0 rounded-apple-sm p-4 border border-hairline-soft">
                        <p className="text-ink-4 text-[10px] font-semibold uppercase tracking-widest mb-3">Altersverteilung</p>
                        <div className="flex flex-col gap-2">
                          {selected.igAgeDistribution.map(a => (
                            <div key={a.age}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-ink-3">{a.age.replace('_', '–')}</span>
                                <span className="text-ink-2 font-medium">{a.pct}%</span>
                              </div>
                              <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                                <div className="h-full bg-accent rounded-full" style={{ width: `${Math.min(a.pct * 5, 100)}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selected.igTopCountries && selected.igTopCountries.length > 0 && (
                      <div className="bg-surface-0 rounded-apple-sm p-4 border border-hairline-soft">
                        <p className="text-ink-4 text-[10px] font-semibold uppercase tracking-widest mb-3">Top Länder</p>
                        <div className="flex flex-col gap-2">
                          {selected.igTopCountries.map(c => (
                            <div key={c.name}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-ink-2 capitalize">{c.name.replace(/-/g, ' ')}</span>
                                <span className="text-ink-2 font-medium">{c.pct}%</span>
                              </div>
                              <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(c.pct * 7, 100)}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selected.igTopCities && selected.igTopCities.length > 0 && (
                      <div className="bg-surface-0 rounded-apple-sm p-4 border border-hairline-soft">
                        <p className="text-ink-4 text-[10px] font-semibold uppercase tracking-widest mb-3">Top Städte</p>
                        {selected.igTopCities.map(c => (
                          <div key={c.name} className="flex justify-between py-1">
                            <span className="text-ink-2 text-xs capitalize">{c.name}</span>
                            <span className="text-ink-2 text-xs font-medium">{c.pct}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {detailTab === 'performance' && (() => {
                  const totalFee = postings.reduce((s:number,p:any)=>s+(p.fee||0)+(p.produkt||0),0)
                  const totalOrgU = postings.reduce((s:number,p:any)=>s+(p.org_umsatz||0),0)
                  const totalOrgK = postings.reduce((s:number,p:any)=>s+(p.org_klicks||0),0)
                  const totalAdU = postings.reduce((s:number,p:any)=>s+(p.ad_umsatz||0),0)
                  const totalAdS = postings.reduce((s:number,p:any)=>s+(p.ad_spend||0),0)
                  const totalOrgBest = postings.reduce((s:number,p:any)=>s+(p.org_bestellungen||0),0)
                  const gesU = totalOrgU + totalAdU
                  const gesK = totalFee + totalAdS
                  const pOrgROAS = totalFee > 0 ? Math.round(totalOrgU/totalFee*100)/100 : 0
                  const pAdROAS = totalAdS > 0 ? Math.round(totalAdU/totalAdS*100)/100 : 0
                  const pGesROAS = gesK > 0 ? Math.round(gesU/gesK*100)/100 : 0
                  const pOrgCPK = totalOrgK > 0 ? totalFee/totalOrgK : 0
                  return (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      {[['Org. ROAS', pOrgROAS], ['Ad ROAS', pAdROAS], ['Ges. ROAS', pGesROAS]].map(([l, v]) => (
                        <div key={l as string} className="bg-surface-0 rounded-apple-sm p-3 border border-hairline-soft text-center">
                          <div className="text-ink-4 text-xs mb-1">{l}</div>
                          <div className={`text-lg font-bold ${roasColor(v as number)}`}>{(v as number) > 0 ? `${v}x` : '—'}</div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-surface-0 rounded-apple-sm border border-hairline-soft">
                      {[
                        ['Org. Umsatz', fmtEur(totalOrgU), 'text-emerald-400'],
                        ['Org. Klicks', totalOrgK > 0 ? fmt(totalOrgK) : '—', ''],
                        ['Org. CPK', pOrgCPK > 0 ? `${pOrgCPK.toFixed(2)} €` : '—', ''],
                        ['Org. Bestellungen', totalOrgBest > 0 ? String(totalOrgBest) : '—', ''],
                        ['Ad Spend', fmtEur(totalAdS), ''],
                        ['Ad Umsatz', fmtEur(totalAdU), 'text-emerald-400'],
                        ['Ges. Umsatz', fmtEur(gesU), 'text-emerald-400 font-semibold'],
                      ].map(([l, v, cls]) => (
                        <div key={l} className="flex justify-between px-4 py-2.5 border-b border-hairline-soft last:border-0">
                          <span className="text-ink-4 text-xs">{l}</span>
                          <span className={`text-xs font-medium ${cls || 'text-ink-2'}`}>{v}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-surface-0 rounded-apple-sm p-4 border border-hairline-soft">
                      <p className="text-ink-4 text-[10px] font-semibold uppercase tracking-widest mb-3">Bewertung & TKP</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          ['Story Wert', fmtEur(selected.storyWert)],
                          ['Reel Wert', fmtEur(selected.reelWert)],
                          ['TikTok Wert', selected.ttWert > 0 ? fmtEur(selected.ttWert) : '—'],
                          ['Affiliate %', selected.affiliatePct],
                          ['TKP Story', selected.tkpStory > 0 ? `${selected.tkpStory} €` : '—'],
                          ['TKP Post', selected.tkpPost > 0 ? `${selected.tkpPost} €` : '—'],
                          ['TKP TikTok', selected.tkpTT > 0 ? `${selected.tkpTT} €` : '—'],
                        ].map(([l, v]) => (
                          <div key={l} className="bg-surface-2 rounded-apple-sm p-3 border border-hairline-soft">
                            <div className="text-ink-4 text-xs mb-1">{l}</div>
                            <div className="text-ink-1 text-sm font-semibold">{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                  )
                })()}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={async () => {
                      setSaveState('loading')
                      await updateCreator(selected, {
                        status: selected.status,
                        prio: selected.prio,
                        kampagne: selected.kampagne,
                        notizen: selected.notizen,
                        orgUmsatz: selected.orgUmsatz,
                        orgKlicks: selected.orgKlicks,
                        adSpend: selected.adSpend,
                        adUmsatz: selected.adUmsatz,
                      })
                      setSaveState('done')
                      setTimeout(() => setSaveState('idle'), 2000)
                    }}
                    disabled={saveState === 'loading'}
                    className={`flex-1 py-2.5 rounded-apple-sm border text-sm font-medium transition-all flex items-center justify-center gap-2
                      ${saveState === 'done' ? 'border-emerald-500/50 text-emerald-400 bg-emerald-950/30' :
                        saveState === 'loading' ? 'border-white/10 text-ink-3 cursor-not-allowed' :
                        'border-white/20 text-ink-1 hover:bg-white/[0.06]'}`}
                  >
                    {saveState === 'loading' && <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />}
                    {saveState === 'done' && <span>✓</span>}
                    {saveState === 'loading' ? 'Speichern...' : saveState === 'done' ? 'Gespeichert' : 'Speichern'}
                  </button>
                  <button className="flex-1 py-2.5 rounded-apple-sm bg-accent text-ink-1 text-sm hover:bg-accent-hover shadow-[0_6px_20px_-4px_rgba(10,132,255,0.55)] transition-colors font-medium">Outreach senden</button>
                  <button onClick={async (e) => {
                    const btn = e.currentTarget as HTMLButtonElement
                    btn.disabled = true
                    btn.textContent = '...'
                    if ((selected as any)._id) { const t = await getToken(); await fetch(`/api/creators/${(selected as any)._id}`, { method: 'DELETE', headers: { authorization: 'Bearer ' + t } }); }
                    setCreators(prev => prev.filter(c => c !== selected)); setSelected(null)
                  }}
                    className="px-4 py-2.5 rounded-apple-sm border border-red-900/50 text-red-500 hover:bg-red-950/50 transition-colors text-sm">
                    Löschen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeModal}>
            <div className="bg-surface-2 rounded-apple-lg w-full max-w-lg border border-hairline max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-5 border-b border-hairline-soft">
                <div>
                  <h2 className="text-ink-1 font-semibold">Creator hinzufügen</h2>
                  <p className="text-ink-3 text-xs mt-0.5">Handle eingeben → echte Daten werden geladen</p>
                </div>
                <button onClick={closeModal} className="w-8 h-8 rounded-apple-sm bg-white/[0.05] flex items-center justify-center text-ink-2 hover:text-ink-1 text-lg">×</button>
              </div>

              <div className="overflow-y-auto p-6 flex flex-col gap-4">
                <div className="bg-surface-0 rounded-apple-sm p-4 border border-hairline-soft">
                  <p className="text-ink-3 text-[10px] font-semibold uppercase tracking-widest mb-3">Auto-Fetch via RapidAPI</p>
                  <div className="flex flex-col gap-2 mb-3">
                    <input value={form.igHandle} onChange={e => setForm(p => ({ ...p, igHandle: e.target.value }))}
                      placeholder="Instagram Handle (z.B. sophiestyle)" className={inputCls} />
                    <input value={form.ttHandle} onChange={e => setForm(p => ({ ...p, ttHandle: e.target.value }))}
                      placeholder="TikTok Handle — optional" className={inputCls} />
                  </div>
                  <button onClick={doFetch} disabled={fetching || (!form.igHandle && !form.ttHandle)}
                    className={`w-full py-2.5 rounded-apple-sm text-sm font-medium transition-all ${fetching ? 'bg-accent/40 text-ink-1/50 cursor-wait' : fetchDone ? 'bg-emerald-700 text-ink-1' : fetchError ? 'bg-red-950 text-red-400' : (form.igHandle || form.ttHandle) ? 'bg-accent text-ink-1 hover:bg-accent-hover shadow-[0_6px_20px_-4px_rgba(10,132,255,0.55)]' : 'bg-white/[0.05] text-ink-4 cursor-not-allowed'}`}>
                    {fetching ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Lade Daten...</span> : fetchDone ? '✓ Daten geladen' : fetchError ? fetchError : 'Echte Daten laden (IG + TT)'}
                  </button>
                  {fetchDone && fetchedData && (
                    <div className="mt-3 bg-emerald-950/40 border border-emerald-800/30 rounded-apple-sm p-3 text-xs text-emerald-500 space-y-0.5">
                      <p className="text-emerald-400 font-medium mb-1">✓ Echte Daten von RapidAPI:</p>
                      {fetchedData.igFollower > 0 && <p>· IG: {fetchedData.igFollower?.toLocaleString('de-DE')} Follower · {fetchedData.igTier} · ER: {fetchedData.igEr}%</p>}
                      {fetchedData.igAvgReelViews > 0 && <p>· Ø Reel Views: {fetchedData.igAvgReelViews?.toLocaleString('de-DE')}</p>}
                      {fetchedData.igRealFollowers > 0 && <p>· Echte Follower: {fetchedData.igRealFollowers}% · Fake: {fetchedData.igFakeFollowers}%</p>}
                      {fetchedData.igGenderFemale > 0 && <p>· {fetchedData.igGenderFemale}% weiblich · Top-Alter: {fetchedData.igTopAge}</p>}
                      {fetchedData.ttFollower > 0 && <p>· TT: {fetchedData.ttFollower?.toLocaleString('de-DE')} Follower · Ø Views: {fetchedData.ttAvgVideoViews?.toLocaleString('de-DE')}</p>}
                      <p>· {fetchedData.reelWert > 0 && `Reel: ~${fetchedData.reelWert?.toLocaleString('de-DE')} €`}{fetchedData.reelWert > 0 && fetchedData.ttWert > 0 && ' · '}{fetchedData.ttWert > 0 && `TikTok: ~${fetchedData.ttWert?.toLocaleString('de-DE')} €`} · Affiliate: {fetchedData.affiliatePct}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <div><label className={labelCls}>Name *</label>
                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Sophie Müller" className={inputCls} /></div>

                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelCls}>Status</label>
                      <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className={selectCls}>
                        {['Offen', 'Kontaktiert', 'In Verhandlung', 'Deal', 'Abgelehnt'].map(s => <option key={s}>{s}</option>)}
                      </select></div>
                    <div><label className={labelCls}>Priorität</label>
                      <select value={form.prio} onChange={e => setForm(p => ({ ...p, prio: e.target.value }))} className={selectCls}>
                        {['Hoch', 'Mittel', 'Niedrig'].map(s => <option key={s}>{s}</option>)}
                      </select></div>
                  </div>

                  <div>
                    <label className={labelCls}>Kategorie</label>
                    <select value={form.kategorie} onChange={e => setForm(p => ({ ...p, kategorie: e.target.value }))} className={selectCls}>
                      <option value="">— wählen —</option>
                      {['Schmuck', 'Fashion', 'Beauty', 'Lifestyle', 'Fitness', 'Travel', 'Food', 'Andere'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className={labelCls}>Promo Code</label>
                    <input value={form.promoCode} onChange={e => setForm(p => ({ ...p, promoCode: e.target.value }))} placeholder="SOPHIE15" className={inputCls} />
                  </div>

                  <div><label className={labelCls}>Notizen</label>
                    <textarea value={form.notizen} onChange={e => setForm(p => ({ ...p, notizen: e.target.value }))} placeholder="Agentur, Konditionen..." rows={2}
                      className="w-full bg-surface-0 border border-hairline rounded-apple-sm px-4 py-2.5 text-ink-1 text-sm placeholder-gray-700 focus:outline-none resize-none" /></div>
                </div>

                {saveError && (
                  <div className="bg-red-950/30 border border-red-500/20 rounded-apple-sm px-4 py-3">
                    <p className="text-red-400 text-xs">{saveError}</p>
                  </div>
                )}

                <button onClick={handleSave} disabled={!form.name || (!form.igHandle && !form.ttHandle) || saving}
                  className={`w-full py-3 rounded-apple-sm text-sm font-medium transition-colors ${form.name && (form.igHandle || form.ttHandle) ? 'bg-accent text-ink-1 hover:bg-accent-hover shadow-[0_6px_20px_-4px_rgba(10,132,255,0.55)]' : 'bg-white/[0.05] text-ink-4 cursor-not-allowed'}`}>
                  {saving ? 'Speichert...' : 'Creator hinzufügen'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}