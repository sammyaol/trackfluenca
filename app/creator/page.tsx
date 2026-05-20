'use client'
import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { createBrowserClient } from '@supabase/ssr'



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
  'Nano': 'text-gray-400 bg-gray-800 border border-gray-700/50',
  'Micro': 'text-blue-400 bg-blue-950 border border-blue-800/30',
  'Mid-Tier': 'text-purple-400 bg-purple-950 border border-purple-800/30',
  'Macro': 'text-amber-400 bg-amber-950 border border-amber-800/30',
  'Top-Tier': 'text-red-400 bg-red-950 border border-red-800/30',
}

const statusStyle: Record<string, string> = {
  'Deal': 'text-emerald-400 bg-emerald-950 border border-emerald-800/30',
  'In Verhandlung': 'text-amber-400 bg-amber-950 border border-amber-800/30',
  'Kontaktiert': 'text-blue-400 bg-blue-950 border border-blue-800/30',
  'Offen': 'text-gray-400 bg-gray-800 border border-gray-700/50',
  'Abgelehnt': 'text-red-400 bg-red-950 border border-red-800/30',
}

const roasColor = (r: number) => r >= 3 ? 'text-emerald-400' : r >= 1 ? 'text-amber-400' : r > 0 ? 'text-red-400' : 'text-gray-700'

const allColumns = [
  { key: 'status', label: 'Status', group: 'Basis' },
  { key: 'prio', label: 'Priorität', group: 'Basis' },
  { key: 'kategorie', label: 'Kategorie', group: 'Basis' },
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
  { key: 'reelWert', label: 'Reel €', group: 'Bewertung' },
  { key: 'affiliatePct', label: 'Affiliate %', group: 'Bewertung' },
]

const groups = ['Basis', 'Instagram', 'TikTok', 'Overall', 'Deal', 'Organisch', 'Gesamt', 'Bewertung']
const emptyForm = { name: '', igHandle: '', ttHandle: '', status: 'Offen', prio: 'Mittel', kategorie: 'Schmuck', kampagne: '', buchungstyp: 'Reel', fee: '', produkt: '', promoCode: '', datum: '', notizen: '' }

export default function CreatorPage() {
  const [creators, setCreators] = useState<Creator[]>([])
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const getToken = async () => { const { data } = await sb.auth.getSession(); return data.session?.access_token || '' }
  useEffect(() => {
    let mounted = true
    sb.auth.getSession().then(async ({data: sessionData}) => {
      const userId = sessionData.session?.user?.id
      if (!userId) return
      const { data } = await sb.from('creators').select('*').eq('user_id', userId).order('created_at', {ascending: false})
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
        tkpReel: c.tkp_reel, _id: c.id,
      })))
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
  const [selected, setSelected] = useState<Creator | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [showColPicker, setShowColPicker] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [fetchDone, setFetchDone] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [fetchedData, setFetchedData] = useState<any>(null)
  const [visibleCols, setVisibleCols] = useState(['status', 'igFollower', 'ttFollower', 'overallTier', 'kampagne', 'fee', 'promoCode', 'orgUmsatz', 'gesROAS'])
  const [form, setForm] = useState(emptyForm)
  const [detailTab, setDetailTab] = useState('overview')
  const [saveState, setSaveState] = useState<'idle'|'loading'|'done'>('idle')
  const [refreshing, setRefreshing] = useState(false)
  const [postings, setPostings] = useState<any[]>([])
  const [showPostings, setShowPostings] = useState<string|null>(null)
  const [showAddPosting, setShowAddPosting] = useState(false)
  const [postingSaving, setPostingSaving] = useState(false)
  const [expandedCreator, setExpandedCreator] = useState<string|null>(null)
  const [expandedPostings, setExpandedPostings] = useState<Record<string,any[]>>({})
  const [postingForm, setPostingForm] = useState({kampagne:'',buchungstyp:'Reel',datum:'',fee:0,produkt:0,promo_code:'',org_umsatz:0,org_klicks:0,ad_spend:0,ad_umsatz:0,notizen:''})
  const [tableLoading, setTableLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [snapshots, setSnapshots] = useState<any[]>([])
  const [snapshotLoading, setSnapshotLoading] = useState(false)
  const [followerDays, setFollowerDays] = useState(30)
  const [chartHover, setChartHover] = useState<any>(null)
  const [viewsDays, setViewsDays] = useState(30)
  const [viewsHover, setViewsHover] = useState<any>(null)
  const [kampagnenList, setKampagnenList] = useState<string[]>([])

  const toggleCol = (key: string) => setVisibleCols(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  const toggleGroup = (group: string) => {
    const keys = allColumns.filter(c => c.group === group).map(c => c.key)
    const allOn = keys.every(k => visibleCols.includes(k))
    setVisibleCols(prev => allOn ? prev.filter(k => !keys.includes(k)) : [...new Set([...prev, ...keys])])
  }

  const openAdd = () => { setForm(emptyForm); setEditMode(false); setFetchDone(false); setFetchedData(null); setFetchError(''); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setEditMode(false); setFetchDone(false); setFetchedData(null); setFetchError(''); setForm(emptyForm) }

  const doFetch = async () => {
    if (!form.igHandle && !form.ttHandle) return
    setFetching(true); setFetchDone(false); setFetchError(''); setFetchedData(null)
    try {
      const params = new URLSearchParams()
      if (form.igHandle) params.append('ig', form.igHandle.replace('@', ''))
      if (form.ttHandle) params.append('tt', form.ttHandle.replace('@', ''))
      const res = await fetch(`/api/creator?${params}`)
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
    setSaving(true)
    const fee = Number(form.fee) || 0
    const produkt = Number(form.produkt) || 0
    const ig = form.igHandle.startsWith('@') ? form.igHandle : '@' + form.igHandle
    const tt = form.ttHandle ? (form.ttHandle.startsWith('@') ? form.ttHandle : '@' + form.ttHandle) : ''
    const d = fetchedData || {}
    const token = await getToken()
    await fetch('/api/creators', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token },
      body: JSON.stringify({
        name: form.name, ig, tt,
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
    const token2 = await getToken()
    const res = await fetch('/api/creators', { headers: { authorization: 'Bearer ' + token2 } })
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
      tkpReel: c.tkp_reel, _id: c.id,
    })))
    // Direkt Snapshot erstellen für den neuen Creator
    // Snapshot für neuen Creator — hole die ID aus der frisch geladenen Liste
    const newCreator = Array.isArray(data) ? data[0] : null
    if (newCreator?.id) {
      const t2 = await getToken()
      await fetch('/api/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + t2 },
        body: JSON.stringify({
          creator_id: newCreator.id,
          ig_follower: newCreator.ig_follower || 0,
          tt_follower: newCreator.tt_follower || 0,
          ig_avg_likes: newCreator.ig_avg_likes || 0,
          ig_er: newCreator.ig_er || 0,
          tt_avg_video_views: newCreator.tt_avg_video_views || 0,
          tt_er: newCreator.tt_er || 0,
        })
      })
    }
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
    const token = await getToken()
    await fetch(`/api/creators/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token },
      body: JSON.stringify(body)
    })
  }

  const filtered = creators.filter(c => {
    const s = search.toLowerCase()
    return (!s || c.name.toLowerCase().includes(s) || c.ig.includes(s) || c.promoCode.toLowerCase().includes(s))
      && (!filterStatus || c.status === filterStatus)
      && (!filterTier || c.overallTier === filterTier)
  })

  const fmt = (n?: number) => n && n > 0 ? n.toLocaleString('de-DE') : '—'
  const fmtEur = (n?: number) => n && n > 0 ? `${n.toLocaleString('de-DE')} €` : '—'
  const dash = '—'

  const renderCell = (c: Creator, key: string) => {
    switch (key) {
      case 'ig': return <span className="text-gray-500 text-sm">{c.ig}</span>
      case 'tt': return <span className="text-gray-500 text-sm">{c.tt || dash}</span>
      case 'status': return <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${statusStyle[c.status]}`}>{c.status}</span>
      case 'prio': return <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${c.prio === 'Hoch' ? 'text-red-400 bg-red-950 border border-red-800/30' : c.prio === 'Mittel' ? 'text-amber-400 bg-amber-950 border border-amber-800/30' : 'text-gray-400 bg-gray-800 border border-gray-700/50'}`}>{c.prio}</span>
      case 'kategorie': return <span className="text-gray-400 text-sm">{c.kategorie}</span>
      case 'igFollower': return <span className="text-gray-300 text-sm">{fmt(c.igFollower)}</span>
      case 'igTier': return c.igTier ? <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${tierStyle[c.igTier]}`}>{c.igTier}</span> : <span className="text-gray-700">{dash}</span>
      case 'igEr': return <span className={`text-sm font-medium ${c.igEr >= 4 ? 'text-emerald-400' : c.igEr >= 2 ? 'text-amber-400' : 'text-red-400'}`}>{c.igEr}%</span>
      case 'igAvgReelViews': return <span className="text-gray-300 text-sm">{fmt(c.igAvgReelViews)}</span>
      case 'igRealFollowers': return c.igRealFollowers ? <span className={`text-sm font-medium ${c.igRealFollowers >= 80 ? 'text-emerald-400' : c.igRealFollowers >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{c.igRealFollowers}%</span> : <span className="text-gray-700">{dash}</span>
      case 'ttFollower': return <span className="text-gray-300 text-sm">{c.ttFollower > 0 ? fmt(c.ttFollower) : dash}</span>
      case 'ttAvgVideoViews': return <span className="text-gray-300 text-sm">{fmt(c.ttAvgVideoViews || c.ttAvgViews)}</span>
      case 'ttEr': return c.ttEr > 0 ? <span className={`text-sm font-medium ${c.ttEr >= 4 ? 'text-emerald-400' : c.ttEr >= 2 ? 'text-amber-400' : 'text-red-400'}`}>{c.ttEr}%</span> : <span className="text-gray-700">{dash}</span>
      case 'overallTier': return <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${tierStyle[c.overallTier]}`}>{c.overallTier}</span>
      case 'gesamtReichweite': return <span className="text-gray-300 text-sm">{fmt(c.gesamtReichweite)}</span>
      case 'kampagne': return <span className="text-gray-400 text-sm">{c.kampagne || dash}</span>
      case 'buchungstyp': return <span className="text-gray-400 text-sm">{c.buchungstyp || dash}</span>
      case 'fee': return <span className="text-gray-300 text-sm">{fmtEur(c.fee)}</span>
      case 'promoCode': return <span className="font-mono text-[#7F77DD] text-xs">{c.promoCode || dash}</span>
      case 'orgUmsatz': return <span className="text-emerald-400 text-sm font-medium">{fmtEur(c.orgUmsatz)}</span>
      case 'orgROAS': return <span className={`text-sm font-semibold ${roasColor(c.orgROAS)}`}>{c.orgROAS > 0 ? `${c.orgROAS}x` : dash}</span>
      case 'gesUmsatz': return <span className="text-emerald-400 text-sm font-semibold">{fmtEur(c.gesUmsatz)}</span>
      case 'gesROAS': return <span className={`text-sm font-bold ${roasColor(c.gesROAS)}`}>{c.gesROAS > 0 ? `${c.gesROAS}x` : dash}</span>
      case 'reelWert': return <span className="text-purple-400 text-sm">{fmtEur(c.reelWert)}</span>
      case 'affiliatePct': return <span className="text-blue-400 text-sm font-medium">{c.affiliatePct}</span>
      default: return <span className="text-gray-700">{dash}</span>
    }
  }

  const inputCls = "w-full bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-[#7F77DD]/40"
  const selectCls = "w-full bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#7F77DD]/40"
  const labelCls = "text-gray-500 text-xs mb-1.5 block font-medium"

  return (
    <div className="flex min-h-screen bg-[#0A0A0A]">
      <Sidebar />
      <main className="flex-1 md:ml-60 min-h-screen">
        <div className="border-b border-white/[0.06] px-6 py-4 flex items-center justify-between bg-[#0A0A0A]/80 backdrop-blur sticky top-0 z-20">
          <div>
            <h1 className="text-white font-semibold text-lg">Creator</h1>
            <p className="text-gray-500 text-xs mt-0.5">{creators.length} Creator · {creators.filter(c => c.status === 'Deal').length} Deals</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setShowColPicker(!showColPicker)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-colors ${showColPicker ? 'border-[#7F77DD]/50 text-[#7F77DD] bg-[#7F77DD]/10' : 'border-white/[0.08] text-gray-400 hover:bg-white/[0.04]'}`}>
                Spalten ({visibleCols.length})
              </button>
              {showColPicker && (
                <div className="absolute right-0 top-10 bg-[#1A1A1A] border border-white/[0.08] rounded-2xl p-4 w-64 z-50 shadow-2xl max-h-[80vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white text-xs font-semibold">Spalten anpassen</span>
                    <button onClick={() => setShowColPicker(false)} className="text-gray-600 hover:text-gray-300 text-lg leading-none">×</button>
                  </div>
                  {groups.map(group => (
                    <div key={group} className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-600 text-[10px] font-semibold uppercase tracking-widest">{group}</span>
                        <button onClick={() => toggleGroup(group)} className="text-[10px] text-[#7F77DD] hover:underline">
                          {allColumns.filter(c => c.group === group).every(c => visibleCols.includes(c.key)) ? 'Alle aus' : 'Alle ein'}
                        </button>
                      </div>
                      {allColumns.filter(c => c.group === group).map(col => (
                        <label key={col.key} className="flex items-center gap-2 px-1 py-1 rounded-lg hover:bg-white/[0.04] cursor-pointer" onClick={() => toggleCol(col.key)}>
                          <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors flex-shrink-0 ${visibleCols.includes(col.key) ? 'bg-[#7F77DD] border-[#7F77DD]' : 'border-gray-600'}`}>
                            {visibleCols.includes(col.key) && <span className="text-white text-[9px]">✓</span>}
                          </div>
                          <span className="text-gray-300 text-xs">{col.label}</span>
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
                  const res = await fetch('/api/creators', { headers: { authorization: 'Bearer ' + token } })
                  const data = await res.json()
                  if (Array.isArray(data)) {
                    setCreators(data.map((c: any) => ({
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
                      tkpReel: c.tkp_reel, _id: c.id,
                    })))
                  }
                  setRefreshing(false)
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 text-xs hover:bg-white/[0.04] transition-colors"
              >
                <span className={refreshing ? 'animate-spin inline-block' : ''}>↻</span>
                {refreshing ? 'Lädt...' : 'Aktualisieren'}
              </button>
              <button onClick={openAdd} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#7F77DD] text-white text-xs hover:bg-[#534AB7] transition-colors font-medium">
                + Creator hinzufügen
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {tableLoading && (
            <div className="flex items-center justify-center py-20 gap-3">
              <div className="w-5 h-5 border-2 border-white/20 border-t-[#7F77DD] rounded-full animate-spin"/>
              <span className="text-gray-500 text-sm">Creator werden geladen...</span>
            </div>
          )}
          <div className="flex gap-3 mb-5 flex-wrap" style={{display: tableLoading ? 'none' : 'flex'}}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, Handle oder Code..."
              className="flex-1 min-w-48 bg-[#141414] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-700 focus:outline-none" />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="bg-[#141414] border border-white/[0.08] rounded-xl px-4 py-2.5 text-gray-400 text-sm focus:outline-none">
              <option value="">Alle Status</option>
              {['Deal', 'In Verhandlung', 'Kontaktiert', 'Offen', 'Abgelehnt'].map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={filterTier} onChange={e => setFilterTier(e.target.value)}
              className="bg-[#141414] border border-white/[0.08] rounded-xl px-4 py-2.5 text-gray-400 text-sm focus:outline-none">
              <option value="">Alle Tiers</option>
              {['Nano', 'Micro', 'Mid-Tier', 'Macro', 'Top-Tier'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div className="bg-[#141414] rounded-2xl border border-white/[0.06] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: 'max-content' }}>
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left text-xs text-gray-600 px-5 py-3.5 font-medium whitespace-nowrap sticky left-0 bg-[#141414]">Creator</th>
                    {allColumns.filter(c => visibleCols.includes(c.key)).map(col => (
                      <th key={col.key} className="text-left text-xs text-gray-600 px-5 py-3.5 font-medium whitespace-nowrap">{col.label}</th>
                    ))}
                    <th className="text-left text-xs text-gray-600 px-5 py-3.5 font-medium">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <tr key={c.name} onClick={async () => { 
                      setSelected(c); setDetailTab('overview')
                      const id = (c as any)._id
                      if (id) {
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
                      className={`hover:bg-white/[0.02] cursor-pointer transition-colors ${i !== filtered.length - 1 ? 'border-b border-white/[0.04]' : ''}`}>
                      <td className="px-5 py-4 sticky left-0 bg-[#141414] overflow-visible">
                        <div className="flex items-center gap-3">
                          <div className="relative flex-shrink-0 w-12 h-9">
                            <div className="w-9 h-9 rounded-full absolute left-0 top-0 border-2 border-[#141414] bg-[#7F77DD] flex items-center justify-center text-white text-sm font-bold overflow-hidden z-10">
                              <span>{c.name.split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase()}</span>
                              {(c.igImage || c.ttImage) && <img src={c.igImage || c.ttImage} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).remove() }} />}
                            </div>
                            <div className="w-5 h-5 rounded-full absolute left-5 top-4 border-2 border-[#141414] bg-[#555] flex items-center justify-center overflow-hidden z-20">
                              {c.tt
                                ? <span className="text-[6px] text-gray-400 font-bold">{c.name.split(' ').map((n:string)=>n[0]).join('').slice(0,1)}</span>
                                : <span className="text-[6px] text-gray-600">—</span>}
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="text-white text-sm font-medium whitespace-nowrap">{c.name}</span>
                              {c.igVerified && <span className="text-blue-400 text-xs">✓</span>}
                            </div>
                            <span className="text-gray-600 text-xs">{c.ig}</span>
                          </div>
                        </div>
                      </td>
                      {allColumns.filter(col => visibleCols.includes(col.key)).map(col => (
                        <td key={col.key} className="px-5 py-4 whitespace-nowrap">{renderCell(c, col.key)}</td>
                      ))}
                      <td className="px-5 py-4">
                        <button onClick={async e => {
                          e.stopPropagation()
                          const id = (c as any)._id
                          if (!id) return
                          if (expandedCreator === id) { setExpandedCreator(null); return }
                          setExpandedCreator(id)
                          if (!expandedPostings[id]) {
                            const token = await getToken()
                            const res = await fetch('/api/postings?creator_id=' + id, { headers: { authorization: 'Bearer ' + token } })
                            const d = await res.json()
                            setExpandedPostings((prev:any) => ({...prev, [id]: Array.isArray(d) ? d : []}))
                          }
                        }} className="text-gray-500 hover:text-white text-sm px-2 transition-colors">
                          {expandedCreator === (c as any)._id ? '▲' : '▼'} Postings
                        </button>
                        <button onClick={async e => { e.stopPropagation(); if ((c as any)._id) { const t = await getToken(); await fetch(`/api/creators/${(c as any)._id}`, { method: 'DELETE', headers: { authorization: 'Bearer ' + t } }); } setCreators(prev => prev.filter(x => x !== c)) }}
                          className="text-red-500/50 hover:text-red-400 text-xs px-2 py-1 rounded-lg hover:bg-red-950/30 transition-colors">
                          Löschen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* Postings Dropdown Panel */}
        {expandedCreator && expandedPostings[expandedCreator] && (
          <div className="mx-6 mb-4 bg-[#0D0D0D] rounded-2xl border border-white/[0.06] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04]">
              <span className="text-white text-xs font-medium">
                Postings — {creators.find(c => (c as any)._id === expandedCreator)?.name}
              </span>
              <button onClick={() => setExpandedCreator(null)} className="text-gray-500 hover:text-white text-xs">✕</button>
            </div>
            {expandedPostings[expandedCreator].length === 0 ? (
              <div className="px-5 py-4 text-gray-600 text-xs">Noch keine Postings — im Detail-Panel unter "Postings" hinzufügen</div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {expandedPostings[expandedCreator].map((p:any) => (
                  <div key={p.id} className="flex items-center gap-6 px-5 py-3">
                    <div className="min-w-[120px]">
                      <div className="text-white text-xs font-medium">{p.kampagne||'—'}</div>
                      <div className="text-gray-600 text-[10px]">{p.buchungstyp} · {p.datum||'—'}</div>
                    </div>
                    <div className="flex items-center gap-5 text-xs flex-wrap">
                      <div><div className="text-gray-600 text-[10px]">Fee</div><div className="text-white">{((p.fee||0)+(p.produkt||0)).toLocaleString('de-DE')} €</div></div>
                      <div><div className="text-gray-600 text-[10px]">Org. Umsatz</div><div className="text-emerald-400">{(p.org_umsatz||0).toLocaleString('de-DE')} €</div></div>
                      <div><div className="text-gray-600 text-[10px]">Org. ROAS</div><div className={p.org_roas>=3?'text-emerald-400':p.org_roas>=1?'text-amber-400':'text-gray-400'}>{p.org_roas>0?`${p.org_roas}x`:'—'}</div></div>
                      <div><div className="text-gray-600 text-[10px]">Ad Spend</div><div className="text-white">{(p.ad_spend||0).toLocaleString('de-DE')} €</div></div>
                      <div><div className="text-gray-600 text-[10px]">Ad Umsatz</div><div className="text-emerald-400">{(p.ad_umsatz||0).toLocaleString('de-DE')} €</div></div>
                      <div><div className="text-gray-600 text-[10px]">Ges. ROAS</div><div className={`font-bold ${p.ges_roas>=3?'text-emerald-400':p.ges_roas>=1?'text-amber-400':'text-gray-400'}`}>{p.ges_roas>0?`${p.ges_roas}x`:'—'}</div></div>
                      {p.promo_code && <div><div className="text-gray-600 text-[10px]">Code</div><div className="text-[#7F77DD]">{p.promo_code}</div></div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Detail Slide-over */}
        {selected && (
          <div className="fixed inset-0 z-50 flex" onClick={() => setSelected(null)}>
            <div className="flex-1 bg-black/60 backdrop-blur-sm" />
            <div className="w-full max-w-2xl bg-[#111] border-l border-white/[0.08] h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06] sticky top-0 bg-[#111] z-10">
                <div className="flex items-center gap-4">
                  {selected.igImage ? (
                    <img src={selected.igImage} alt={selected.name} className="w-14 h-14 rounded-full object-cover border-2 border-white/10" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-[#7F77DD]/20 flex items-center justify-center text-[#7F77DD] font-semibold text-xl">
                      {selected.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold text-base">{selected.name}</span>
                      {selected.igVerified && <span className="text-blue-400 text-sm">✓</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-gray-500 text-xs">{selected.ig}</span>
                      {selected.tt && <span className="text-gray-500 text-xs">{selected.tt}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-md ${tierStyle[selected.overallTier]}`}>{selected.overallTier}</span>
                      <select value={selected.status} onChange={e => { const v = e.target.value; setSelected(p => p ? {...p, status: v} : p); updateCreator(selected, {status: v}) }} className={`text-xs px-2 py-0.5 rounded-md border-0 cursor-pointer ${statusStyle[selected.status]} bg-transparent`}>
                        {['Offen','Kontaktiert','In Verhandlung','Deal','Abgelehnt'].map(s => <option key={s} value={s} className="bg-[#1a1a1a] text-white">{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center text-gray-400 hover:text-white text-lg">×</button>
              </div>

              <div className="flex gap-1 px-6 pt-4">
                {[['overview', 'Übersicht'], ['audience', 'Zielgruppe'], ['performance', 'Performance'], ['deal', 'Ergebnisse'], ['postings', 'Postings']].map(([id, label]) => (
                  <button key={id} onClick={() => setDetailTab(id)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${detailTab === id ? 'bg-[#7F77DD]/20 text-[#7F77DD]' : 'text-gray-500 hover:text-gray-300'}`}>
                    {label}
                  </button>
                ))}
              </div>

              <div className="p-6 flex flex-col gap-5">
                {detailTab === 'overview' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#0A0A0A] rounded-xl p-4 border border-white/[0.06]">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-pink-400 text-sm">📸</span>
                          <span className="text-gray-400 text-xs font-medium">Instagram</span>
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
                              <span className="text-gray-600 text-xs">{l}</span>
                              <span className="text-gray-200 text-xs font-medium">{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-[#0A0A0A] rounded-xl p-4 border border-white/[0.06]">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-white text-sm">🎵</span>
                          <span className="text-gray-400 text-xs font-medium">TikTok</span>
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
                                <span className="text-gray-600 text-xs">{l}</span>
                                <span className="text-gray-200 text-xs font-medium">{v}</span>
                              </div>
                            ))}
                          </div>
                        ) : <p className="text-gray-700 text-xs">Kein TikTok</p>}
                      </div>
                    </div>

                    <div className="bg-[#0A0A0A] rounded-xl p-4 border border-white/[0.06]">
                      <p className="text-gray-600 text-[10px] font-semibold uppercase tracking-widest mb-3">Qualität & Echtheit</p>
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        {[
                          { label: 'Echte Follower', value: selected.igRealFollowers ? `${selected.igRealFollowers}%` : '—', color: (selected.igRealFollowers || 0) >= 80 ? 'text-emerald-400' : (selected.igRealFollowers || 0) >= 60 ? 'text-amber-400' : 'text-red-400' },
                          { label: 'Fake Follower', value: selected.igFakeFollowers !== undefined ? `${selected.igFakeFollowers}%` : '—', color: (selected.igFakeFollowers || 0) <= 10 ? 'text-emerald-400' : 'text-amber-400' },
                          { label: 'Quality Score', value: selected.igQualityScore ? `${Math.round(selected.igQualityScore * 100)}%` : '—', color: (selected.igQualityScore || 0) >= 0.7 ? 'text-emerald-400' : 'text-amber-400' },
                        ].map(m => (
                          <div key={m.label} className="text-center">
                            <div className={`text-xl font-bold mb-1 ${m.color}`}>{m.value}</div>
                            <div className="text-gray-600 text-xs">{m.label}</div>
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
                      <div className="bg-[#0A0A0A] rounded-xl p-4 border border-white/[0.06]">
                        <p className="text-gray-600 text-[10px] font-semibold uppercase tracking-widest mb-3">Follower Wachstum (7 Tage)</p>
                        <div className="grid grid-cols-2 gap-3">
                          {selected.igFollowerWachstum7d !== undefined && (
                            <div>
                              <div className="text-gray-500 text-xs mb-1">Instagram</div>
                              <div className={`text-lg font-bold ${(selected.igFollowerWachstum7d || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {(selected.igFollowerWachstum7d || 0) >= 0 ? '+' : ''}{selected.igFollowerWachstum7d?.toLocaleString('de-DE')}
                              </div>
                            </div>
                          )}
                          {selected.ttFollowerWachstum7d !== undefined && selected.ttFollower > 0 && (
                            <div>
                              <div className="text-gray-500 text-xs mb-1">TikTok</div>
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
                    <div className="w-4 h-4 border-2 border-white/20 border-t-[#7F77DD] rounded-full animate-spin"/>
                    <span className="text-gray-500 text-xs">Verlauf wird geladen...</span>
                  </div>
                )}
                {detailTab === 'overview' && !snapshotLoading && snapshots.length > 1 && (
                  <div className="bg-[#0A0A0A] rounded-xl border border-white/[0.06] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-gray-500 text-xs font-medium">Follower-Entwicklung</p>
                      <div className="flex items-center gap-1">
                        {[7,15,30].map((d:number) => (
                          <button key={d} onClick={() => setFollowerDays(d)}
                            className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${followerDays===d ? 'bg-[#7F77DD] text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                            {d}T
                          </button>
                        ))}
                      </div>
                    </div>
                    {(() => {
                      const sl = snapshots.slice(-followerDays)
                      if (sl.length < 2) return <div className="text-gray-600 text-xs text-center py-4">Noch nicht genug Daten</div>
                      const igLast = sl[sl.length-1]?.ig_follower||0
                      const ttLast = sl[sl.length-1]?.tt_follower||0
                      const igFirst = sl[0]?.ig_follower||0
                      const ttFirst = sl[0]?.tt_follower||0
                      const igDiff = igLast - igFirst
                      const ttDiff = ttLast - ttFirst
                      const allVals = [...sl.map((s:any)=>s.ig_follower||0),...sl.map((s:any)=>s.tt_follower||0)]
                      const minV = Math.min(...allVals), maxV = Math.max(...allVals), range = maxV-minV||1
                      const w = 100/(sl.length-1)
                      const igPts = sl.map((s:any,i:number)=>`${i*w},${90-(((s.ig_follower||0)-minV)/range)*80}`).join(' ')
                      const ttPts = sl.map((s:any,i:number)=>`${i*w},${90-(((s.tt_follower||0)-minV)/range)*80}`).join(' ')
                      return (<>
                        <div className="flex items-center gap-4 mb-2">
                          <span className="flex items-center gap-1.5 text-[10px] text-gray-300">
                            <span className="w-2 h-0.5 bg-[#E1306C] inline-block rounded"/>
                            IG {igLast.toLocaleString('de-DE')}
                            <span className={igDiff>=0?'text-emerald-400':'text-red-400'}>{igDiff>=0?'+':''}{igDiff.toLocaleString('de-DE')}</span>
                          </span>
                          <span className="flex items-center gap-1.5 text-[10px] text-gray-300">
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
                              <div className="bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-1.5 shadow-xl">
                                <div className="text-gray-400 text-[10px] mb-1">{chartHover.date}</div>
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
                  <div className="bg-[#0A0A0A] rounded-xl border border-white/[0.06] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px]">♪</span>
                        <p className="text-gray-500 text-xs font-medium">Ø TikTok Views</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {[7,15,30].map((d:number) => (
                          <button key={d} onClick={() => setViewsDays(d)}
                            className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${viewsDays===d ? 'bg-[#F59E0B] text-black' : 'text-gray-500 hover:text-gray-300'}`}>
                            {d}T
                          </button>
                        ))}
                      </div>
                    </div>
                    {(() => {
                      const valid = snapshots.filter((s:any) => (s.tt_avg_video_views||0) > 0).slice(-viewsDays)
                      if (valid.length < 2) return <div className="text-gray-600 text-xs text-center py-4">Noch nicht genug Daten</div>
                      const last = valid[valid.length-1].tt_avg_video_views||0
                      const first = valid[0].tt_avg_video_views||0
                      const diff = last - first
                      const vals = valid.map((s:any)=>s.tt_avg_video_views||0)
                      const minV = Math.min(...vals), maxV = Math.max(...vals), range = maxV-minV||1
                      const w = 100/(valid.length-1)
                      const pts = valid.map((s:any,i:number)=>`${i*w},${90-(((s.tt_avg_video_views||0)-minV)/range)*80}`).join(' ')
                      return (<>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] text-gray-300">{last.toLocaleString('de-DE')} Views</span>
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
                              <div className="bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-1.5 shadow-xl">
                                <div className="text-gray-400 text-[10px] mb-1">{viewsHover.date}</div>
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
                    <button onClick={() => setShowAddPosting(true)}
                      className="w-full py-2 rounded-xl border border-dashed border-white/20 text-gray-500 text-xs hover:border-[#7F77DD] hover:text-[#7F77DD] transition-colors">
                      + Neues Posting hinzufügen
                    </button>
                    {showAddPosting && (
                      <div className="bg-[#0A0A0A] rounded-xl border border-white/[0.06] p-4 space-y-3">
                        <p className="text-white text-xs font-medium">Neues Posting</p>
                        <div className="grid grid-cols-2 gap-2">
                          {([
                            {label:'Kampagne',key:'kampagne',type:'text'},
                            {label:'Buchungstyp',key:'buchungstyp',type:'text'},
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
                              <label className="text-gray-600 text-xs block mb-1">{label}</label>
                              <input type={type} value={(postingForm as any)[key]}
                                onChange={e => setPostingForm((p:any) => ({...p, [key]: type==='number' ? Number(e.target.value)||0 : e.target.value}))}
                                className="w-full bg-[#111] border border-white/[0.08] rounded-lg px-2 py-1.5 text-white text-xs"/>
                            </div>
                          ))}
                        </div>
                        <div>
                          <label className="text-gray-600 text-xs block mb-1">Notizen</label>
                          <textarea value={postingForm.notizen} onChange={e => setPostingForm((p:any)=>({...p,notizen:e.target.value}))} rows={2}
                            className="w-full bg-[#111] border border-white/[0.08] rounded-lg px-2 py-1.5 text-white text-xs resize-none"/>
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
                              const res = await fetch('/api/postings', {
                                method: 'POST',
                                headers: {'Content-Type':'application/json', authorization:'Bearer '+token},
                                body: JSON.stringify({...postingForm, creator_id: (selected as any)._id, org_roas, ad_roas, ges_umsatz, ges_roas})
                              })
                              const d = await res.json()
                              if (d.id) {
                                const newPostings = [d, ...postings]
                                setPostings(newPostings)
                                setShowAddPosting(false)
                                setPostingForm({kampagne:'',buchungstyp:'Reel',datum:'',fee:0,produkt:0,promo_code:'',org_umsatz:0,org_klicks:0,ad_spend:0,ad_umsatz:0,notizen:''})
                                // Update Creator ROAS aus allen Postings
                                const totalOrgU = newPostings.reduce((s:number,p:any)=>s+(p.org_umsatz||0),0)
                                const totalAd = newPostings.reduce((s:number,p:any)=>s+(p.ad_umsatz||0),0)
                                const totalFee = newPostings.reduce((s:number,p:any)=>s+(p.fee||0)+(p.produkt||0),0)
                                const totalAdSpend = newPostings.reduce((s:number,p:any)=>s+(p.ad_spend||0),0)
                                const newGesROAS = (totalFee+totalAdSpend) > 0 ? Math.round((totalOrgU+totalAd)/(totalFee+totalAdSpend)*100)/100 : 0
                                const newOrgROAS = totalFee > 0 ? Math.round(totalOrgU/totalFee*100)/100 : 0
                                await updateCreator(selected, { orgUmsatz: totalOrgU, adUmsatz: totalAd, gesUmsatz: totalOrgU+totalAd, gesROAS: newGesROAS, orgROAS: newOrgROAS })
                                setSelected((p:any) => p ? {...p, gesROAS: newGesROAS, orgROAS: newOrgROAS, orgUmsatz: totalOrgU, adUmsatz: totalAd, gesUmsatz: totalOrgU+totalAd} : p)
                              }
                            } finally {
                              setPostingSaving(false)
                              ;(window as any).__postingSaving = false
                            }
                          }} disabled={postingSaving} className={`flex-1 py-2 rounded-xl text-white text-xs transition-colors flex items-center justify-center gap-2 ${postingSaving ? 'bg-[#7F77DD]/50 cursor-not-allowed' : 'bg-[#7F77DD] hover:bg-[#534AB7]'}`}>
                            {postingSaving && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
                            {postingSaving ? 'Wird gespeichert...' : 'Speichern'}
                          </button>
                          <button onClick={() => setShowAddPosting(false)} className="px-4 py-2 rounded-xl border border-white/10 text-gray-500 text-xs">
                            Abbrechen
                          </button>
                        </div>
                      </div>
                    )}
                    {postings.length === 0 && !showAddPosting && (
                      <div className="text-center py-8 text-gray-600 text-xs">Noch keine Postings</div>
                    )}
                    {postings.map((p:any) => (
                      <div key={p.id} className="bg-[#0A0A0A] rounded-xl border border-white/[0.06] p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="text-white text-xs font-medium">{p.kampagne || '—'}</div>
                            <div className="text-gray-600 text-[10px]">{p.buchungstyp} · {p.datum || '—'}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {p.ges_roas > 0 && <span className={`text-xs font-bold ${p.ges_roas>=3?'text-emerald-400':p.ges_roas>=1?'text-amber-400':'text-red-400'}`}>{p.ges_roas}x</span>}
                            <button onClick={async () => {
                              const token = await getToken()
                              await fetch('/api/postings/'+p.id, {method:'DELETE', headers:{authorization:'Bearer '+token}})
                              setPostings((prev:any) => prev.filter((x:any) => x.id !== p.id))
                            }} className="text-red-500/50 hover:text-red-500 text-xs">✕</button>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            ['Fee', `${(p.fee||0)+(p.produkt||0)} €`],
                            ['Org. Umsatz', `${p.org_umsatz||0} €`],
                            ['Org. ROAS', p.org_roas>0?`${p.org_roas}x`:'—'],
                            ['Ad Spend', `${p.ad_spend||0} €`],
                            ['Ad Umsatz', `${p.ad_umsatz||0} €`],
                            ['Ges. ROAS', p.ges_roas>0?`${p.ges_roas}x`:'—'],
                          ].map(([l,v]) => (
                            <div key={l} className="bg-[#111] rounded-lg p-2">
                              <div className="text-gray-600 text-[10px] mb-0.5">{l}</div>
                              <div className="text-white text-xs font-medium">{v}</div>
                            </div>
                          ))}
                        </div>
                        {p.promo_code && <div className="mt-2 text-gray-500 text-[10px]">Code: <span className="text-[#7F77DD]">{p.promo_code}</span></div>}
                        {p.notizen && <div className="mt-1 text-gray-600 text-[10px]">{p.notizen}</div>}
                      </div>
                    ))}
                  </div>
                )}
                {detailTab === 'audience' && (
                  <>
                    {(selected.igGenderMale || selected.igGenderFemale) ? (
                      <div className="bg-[#0A0A0A] rounded-xl p-4 border border-white/[0.06]">
                        <p className="text-gray-600 text-[10px] font-semibold uppercase tracking-widest mb-3">Geschlecht</p>
                        <div className="flex items-center gap-4 mb-3">
                          <div className="text-center flex-1">
                            <div className="text-2xl font-bold text-blue-400">{selected.igGenderMale}%</div>
                            <div className="text-gray-600 text-xs">Männlich</div>
                          </div>
                          <div className="text-center flex-1">
                            <div className="text-2xl font-bold text-pink-400">{selected.igGenderFemale}%</div>
                            <div className="text-gray-600 text-xs">Weiblich</div>
                          </div>
                        </div>
                        <div className="h-3 bg-white/[0.05] rounded-full overflow-hidden flex">
                          <div className="h-full bg-blue-500" style={{ width: `${selected.igGenderMale}%` }} />
                          <div className="h-full bg-pink-500 flex-1" />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#0A0A0A] rounded-xl p-4 border border-white/[0.06] text-center text-gray-600 text-sm">
                        Keine Zielgruppen-Daten. Creator mit API hinzufügen.
                      </div>
                    )}

                    {selected.igAgeDistribution && selected.igAgeDistribution.length > 0 && (
                      <div className="bg-[#0A0A0A] rounded-xl p-4 border border-white/[0.06]">
                        <p className="text-gray-600 text-[10px] font-semibold uppercase tracking-widest mb-3">Altersverteilung</p>
                        <div className="flex flex-col gap-2">
                          {selected.igAgeDistribution.map(a => (
                            <div key={a.age}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-500">{a.age.replace('_', '–')}</span>
                                <span className="text-gray-300 font-medium">{a.pct}%</span>
                              </div>
                              <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                                <div className="h-full bg-[#7F77DD] rounded-full" style={{ width: `${Math.min(a.pct * 5, 100)}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selected.igTopCountries && selected.igTopCountries.length > 0 && (
                      <div className="bg-[#0A0A0A] rounded-xl p-4 border border-white/[0.06]">
                        <p className="text-gray-600 text-[10px] font-semibold uppercase tracking-widest mb-3">Top Länder</p>
                        <div className="flex flex-col gap-2">
                          {selected.igTopCountries.map(c => (
                            <div key={c.name}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-400 capitalize">{c.name.replace(/-/g, ' ')}</span>
                                <span className="text-gray-300 font-medium">{c.pct}%</span>
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
                      <div className="bg-[#0A0A0A] rounded-xl p-4 border border-white/[0.06]">
                        <p className="text-gray-600 text-[10px] font-semibold uppercase tracking-widest mb-3">Top Städte</p>
                        {selected.igTopCities.map(c => (
                          <div key={c.name} className="flex justify-between py-1">
                            <span className="text-gray-400 text-xs capitalize">{c.name}</span>
                            <span className="text-gray-300 text-xs font-medium">{c.pct}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {detailTab === 'performance' && (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      {[['Org. ROAS', selected.orgROAS], ['Ad ROAS', selected.adROAS], ['Ges. ROAS', selected.gesROAS]].map(([l, v]) => (
                        <div key={l as string} className="bg-[#0A0A0A] rounded-xl p-3 border border-white/[0.06] text-center">
                          <div className="text-gray-600 text-xs mb-1">{l}</div>
                          <div className={`text-lg font-bold ${roasColor(v as number)}`}>{(v as number) > 0 ? `${v}x` : '—'}</div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-[#0A0A0A] rounded-xl border border-white/[0.06]">
                      {[
                        ['Org. Umsatz', fmtEur(selected.orgUmsatz), 'text-emerald-400'],
                        ['Org. Klicks', selected.orgKlicks > 0 ? fmt(selected.orgKlicks) : '—', ''],
                        ['Org. CPK', selected.orgCPK > 0 ? `${selected.orgCPK.toFixed(2)} €` : '—', ''],
                        ['Org. Bestellungen', selected.orgBestellungen > 0 ? String(selected.orgBestellungen) : '—', ''],
                        ['Ad Spend', fmtEur(selected.adSpend), ''],
                        ['Ad Umsatz', fmtEur(selected.adUmsatz), 'text-emerald-400'],
                        ['Ges. Umsatz', fmtEur(selected.gesUmsatz), 'text-emerald-400 font-semibold'],
                      ].map(([l, v, cls]) => (
                        <div key={l} className="flex justify-between px-4 py-2.5 border-b border-white/[0.04] last:border-0">
                          <span className="text-gray-600 text-xs">{l}</span>
                          <span className={`text-xs font-medium ${cls || 'text-gray-300'}`}>{v}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-[#0A0A0A] rounded-xl p-4 border border-white/[0.06]">
                      <p className="text-gray-600 text-[10px] font-semibold uppercase tracking-widest mb-3">Bewertung & TKP</p>
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
                          <div key={l} className="bg-[#141414] rounded-xl p-3 border border-white/[0.06]">
                            <div className="text-gray-600 text-xs mb-1">{l}</div>
                            <div className="text-white text-sm font-semibold">{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {detailTab === 'deal' && (
                  <div className="space-y-3">
                    <div className="bg-[#0A0A0A] rounded-xl border border-white/[0.06] p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-gray-600 text-xs block mb-1">Status</label>
                          <select value={selected.status} onChange={e => { const v = e.target.value; setSelected(p => p ? {...p, status: v} : p); updateCreator(selected, {status: v}) }} className="w-full bg-[#111] border border-white/[0.08] rounded-lg px-2 py-1.5 text-white text-xs">
                            {['Offen','Kontaktiert','In Verhandlung','Deal','Abgelehnt'].map(s => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-gray-600 text-xs block mb-1">Priorität</label>
                          <select value={selected.prio} onChange={e => { const v = e.target.value; setSelected(p => p ? {...p, prio: v} : p); updateCreator(selected, {prio: v}) }} className="w-full bg-[#111] border border-white/[0.08] rounded-lg px-2 py-1.5 text-white text-xs">
                            {['Hoch','Mittel','Niedrig'].map(s => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-gray-600 text-xs block mb-1">Kampagne</label>
                        <select value={selected.kampagne || ''} onChange={e => { const v = e.target.value; setSelected(p => p ? {...p, kampagne: v} : p); updateCreator(selected, {kampagne: v}) }} className="w-full bg-[#111] border border-white/[0.08] rounded-lg px-2 py-1.5 text-white text-xs">
                          <option value="">— Keine —</option>
                          {kampagnenList.map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-gray-600 text-xs block mb-1">Notizen</label>
                        <textarea value={selected.notizen || ''} onChange={e => setSelected(p => p ? {...p, notizen: e.target.value} : p)} onBlur={e => updateCreator(selected, {notizen: e.target.value})} rows={3} className="w-full bg-[#111] border border-white/[0.08] rounded-lg px-2 py-1.5 text-white text-xs resize-none" placeholder="Agentur, Konditionen..." />
                      </div>
                    </div>
                    <div className="bg-[#0A0A0A] rounded-xl border border-white/[0.06] p-4">
                      <p className="text-gray-500 text-xs font-medium mb-3">Ergebnisse eintragen</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-gray-600 text-xs block mb-1">Org. Umsatz €</label>
                          <input type="number" value={selected.orgUmsatz || ''} onChange={e => setSelected(p => p ? {...p, orgUmsatz: Number(e.target.value)} : p)} onBlur={e => updateCreator(selected, {orgUmsatz: Number(e.target.value)})} className="w-full bg-[#111] border border-white/[0.08] rounded-lg px-2 py-1.5 text-white text-xs" placeholder="0" />
                        </div>
                        <div>
                          <label className="text-gray-600 text-xs block mb-1">Org. Klicks</label>
                          <input type="number" value={selected.orgKlicks || ''} onChange={e => setSelected(p => p ? {...p, orgKlicks: Number(e.target.value)} : p)} onBlur={e => updateCreator(selected, {orgKlicks: Number(e.target.value)})} className="w-full bg-[#111] border border-white/[0.08] rounded-lg px-2 py-1.5 text-white text-xs" placeholder="0" />
                        </div>
                        <div>
                          <label className="text-gray-600 text-xs block mb-1">Ad Spend €</label>
                          <input type="number" value={selected.adSpend || ''} onChange={e => setSelected(p => p ? {...p, adSpend: Number(e.target.value)} : p)} onBlur={e => updateCreator(selected, {adSpend: Number(e.target.value)})} className="w-full bg-[#111] border border-white/[0.08] rounded-lg px-2 py-1.5 text-white text-xs" placeholder="0" />
                        </div>
                        <div>
                          <label className="text-gray-600 text-xs block mb-1">Ad Umsatz €</label>
                          <input type="number" value={selected.adUmsatz || ''} onChange={e => setSelected(p => p ? {...p, adUmsatz: Number(e.target.value)} : p)} onBlur={e => updateCreator(selected, {adUmsatz: Number(e.target.value)})} className="w-full bg-[#111] border border-white/[0.08] rounded-lg px-2 py-1.5 text-white text-xs" placeholder="0" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={async () => {
                      setSaveState('loading')
                      const gesamt = (selected.fee||0) + (selected.produkt||0)
                      const orgROAS = gesamt > 0 ? Math.round(((selected.orgUmsatz||0) / gesamt) * 100) / 100 : 0
                      const adROAS = (selected.adSpend||0) > 0 ? Math.round(((selected.adUmsatz||0) / (selected.adSpend||0)) * 100) / 100 : 0
                      const gesUmsatz = (selected.orgUmsatz||0) + (selected.adUmsatz||0)
                      const gesamtKosten = gesamt + (selected.adSpend||0)
                      const gesROAS = gesamtKosten > 0 ? Math.round((gesUmsatz / gesamtKosten) * 100) / 100 : 0
                      await updateCreator(selected, {
                        status: selected.status,
                        prio: selected.prio,
                        kampagne: selected.kampagne,
                        notizen: selected.notizen,
                        orgUmsatz: selected.orgUmsatz,
                        orgKlicks: selected.orgKlicks,
                        adSpend: selected.adSpend,
                        adUmsatz: selected.adUmsatz,
                        fee: selected.fee,
                        produkt: selected.produkt,
                        promoCode: selected.promoCode,
                        datum: selected.datum,
                        orgROAS, adROAS, gesUmsatz, gesROAS,
                      })
                      setSelected((p:any) => p ? {...p, orgROAS, adROAS, gesUmsatz, gesROAS} : p)
                      setSaveState('done')
                      setTimeout(() => setSaveState('idle'), 2000)
                    }}
                    disabled={saveState === 'loading'}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2
                      ${saveState === 'done' ? 'border-emerald-500/50 text-emerald-400 bg-emerald-950/30' :
                        saveState === 'loading' ? 'border-white/10 text-gray-500 cursor-not-allowed' :
                        'border-white/20 text-white hover:bg-white/[0.06]'}`}
                  >
                    {saveState === 'loading' && <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />}
                    {saveState === 'done' && <span>✓</span>}
                    {saveState === 'loading' ? 'Speichern...' : saveState === 'done' ? 'Gespeichert' : 'Speichern'}
                  </button>
                  <button className="flex-1 py-2.5 rounded-xl bg-[#7F77DD] text-white text-sm hover:bg-[#534AB7] transition-colors font-medium">Outreach senden</button>
                  <button onClick={async () => { if ((selected as any)._id) { const t = await getToken(); await fetch(`/api/creators/${(selected as any)._id}`, { method: 'DELETE', headers: { authorization: 'Bearer ' + t } }); } setCreators(prev => prev.filter(c => c !== selected)); setSelected(null) }}
                    className="px-4 py-2.5 rounded-xl border border-red-900/50 text-red-500 hover:bg-red-950/50 transition-colors text-sm">
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
            <div className="bg-[#141414] rounded-2xl w-full max-w-lg border border-white/[0.08] max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
                <div>
                  <h2 className="text-white font-semibold">Creator hinzufügen</h2>
                  <p className="text-gray-500 text-xs mt-0.5">Handle eingeben → echte Daten werden geladen</p>
                </div>
                <button onClick={closeModal} className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center text-gray-400 hover:text-white text-lg">×</button>
              </div>

              <div className="overflow-y-auto p-6 flex flex-col gap-4">
                <div className="bg-[#0A0A0A] rounded-xl p-4 border border-white/[0.06]">
                  <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-widest mb-3">Auto-Fetch via RapidAPI</p>
                  <div className="flex flex-col gap-2 mb-3">
                    <input value={form.igHandle} onChange={e => setForm(p => ({ ...p, igHandle: e.target.value }))}
                      placeholder="Instagram Handle (z.B. sophiestyle)" className={inputCls} />
                    <input value={form.ttHandle} onChange={e => setForm(p => ({ ...p, ttHandle: e.target.value }))}
                      placeholder="TikTok Handle — optional" className={inputCls} />
                  </div>
                  <button onClick={doFetch} disabled={fetching || (!form.igHandle && !form.ttHandle)}
                    className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all ${fetching ? 'bg-[#7F77DD]/40 text-white/50 cursor-wait' : fetchDone ? 'bg-emerald-700 text-white' : fetchError ? 'bg-red-950 text-red-400' : (form.igHandle || form.ttHandle) ? 'bg-[#7F77DD] text-white hover:bg-[#534AB7]' : 'bg-white/[0.05] text-gray-600 cursor-not-allowed'}`}>
                    {fetching ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Lade Daten...</span> : fetchDone ? '✓ Daten geladen' : fetchError ? fetchError : 'Echte Daten laden (IG + TT)'}
                  </button>
                  {fetchDone && fetchedData && (
                    <div className="mt-3 bg-emerald-950/40 border border-emerald-800/30 rounded-xl p-3 text-xs text-emerald-500 space-y-0.5">
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

                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelCls}>Kategorie</label>
                      <select value={form.kategorie} onChange={e => setForm(p => ({ ...p, kategorie: e.target.value }))} className={selectCls}>
                        {['Schmuck', 'Fashion', 'Beauty', 'Lifestyle', 'Fitness', 'Travel', 'Food', 'Andere'].map(s => <option key={s}>{s}</option>)}
                      </select></div>
                    <div><label className={labelCls}>Buchungstyp</label>
                      <select value={form.buchungstyp} onChange={e => setForm(p => ({ ...p, buchungstyp: e.target.value }))} className={selectCls}>
                        {['Reel', 'TikTok Post', 'Story', 'Reel + TikTok', 'Bundle', 'UGC'].map(s => <option key={s}>{s}</option>)}
                      </select></div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelCls}>Fee €</label>
                      <input value={form.fee} onChange={e => setForm(p => ({ ...p, fee: e.target.value }))} placeholder="850" className={inputCls} /></div>
                    <div><label className={labelCls}>Promo Code</label>
                      <input value={form.promoCode} onChange={e => setForm(p => ({ ...p, promoCode: e.target.value }))} placeholder="SOPHIE15" className={inputCls} /></div>
                  </div>

                  <div><label className={labelCls}>Notizen</label>
                    <textarea value={form.notizen} onChange={e => setForm(p => ({ ...p, notizen: e.target.value }))} placeholder="Agentur, Konditionen..." rows={2}
                      className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-700 focus:outline-none resize-none" /></div>
                </div>

                <button onClick={handleSave} disabled={!form.name || (!form.igHandle && !form.ttHandle) || saving}
                  className={`w-full py-3 rounded-xl text-sm font-medium transition-colors ${form.name && (form.igHandle || form.ttHandle) ? 'bg-[#7F77DD] text-white hover:bg-[#534AB7]' : 'bg-white/[0.05] text-gray-600 cursor-not-allowed'}`}>
                  Creator hinzufügen
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}