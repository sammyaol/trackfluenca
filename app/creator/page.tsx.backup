'use client'
import { useState } from 'react'
import Sidebar from '../components/Sidebar'

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
}

const initialCreators: Creator[] = [
  { name: 'Sophie Müller', ig: '@sophiestyle', tt: '@sophiett', igFollower: 125000, ttFollower: 98000, igTier: 'Micro', ttTier: 'Micro', igEr: 4.8, ttEr: 3.2, ttAvgViews: 48200, ttAvgLikes: 3200, ttAvgComments: 180, overallTier: 'Micro', gesamtReichweite: 223000, status: 'Deal', prio: 'Hoch', kategorie: 'Schmuck', mgmt: 'Nein', notizen: 'Sehr responsive', kampagne: 'SS25', buchungstyp: 'Reel + TikTok', fee: 850, produkt: 150, gesamt: 1000, promoCode: 'SOPHIE15', datum: '01.05.2026', orgUmsatz: 12750, orgKlicks: 2840, orgCPK: 0.35, orgROAS: 15.0, orgBestellungen: 143, orgBW: 89, adSpend: 0, adUmsatz: 0, adKlicks: 0, adCPK: 0, adROAS: 0, adBestellungen: 0, gesUmsatz: 12750, gesROAS: 15.0, gesKlicks: 2840, storyViews: 14800, storyWert: 1250, ttWert: 980, reelWert: 1250, affiliatePct: '12%', tkpTT: 2.1, tkpStory: 0.85, tkpPost: 1.2 },
  { name: 'Jana Koch', ig: '@janakoch', tt: '@janatt', igFollower: 18500, ttFollower: 42000, igTier: 'Nano', ttTier: 'Micro', igEr: 6.2, ttEr: 5.1, ttAvgViews: 32000, ttAvgLikes: 1800, ttAvgComments: 95, overallTier: 'Nano', gesamtReichweite: 60500, status: 'Deal', prio: 'Mittel', kategorie: 'Fashion', mgmt: 'Nein', notizen: '', kampagne: 'SS25', buchungstyp: 'TikTok Post', fee: 300, produkt: 0, gesamt: 300, promoCode: 'JANA10', datum: '03.05.2026', orgUmsatz: 3900, orgKlicks: 890, orgCPK: 0.34, orgROAS: 13.0, orgBestellungen: 44, orgBW: 89, adSpend: 0, adUmsatz: 0, adKlicks: 0, adCPK: 0, adROAS: 0, adBestellungen: 0, gesUmsatz: 3900, gesROAS: 13.0, gesKlicks: 890, storyViews: 3200, storyWert: 320, ttWert: 630, reelWert: 278, affiliatePct: '15%', tkpTT: 1.4, tkpStory: 3.2, tkpPost: 2.1 },
  { name: 'Lena Hoffmann', ig: '@lena.jewelry', tt: '', igFollower: 450000, ttFollower: 0, igTier: 'Mid-Tier', ttTier: '', igEr: 3.2, ttEr: 0, ttAvgViews: 0, ttAvgLikes: 0, ttAvgComments: 0, overallTier: 'Mid-Tier', gesamtReichweite: 450000, status: 'In Verhandlung', prio: 'Hoch', kategorie: 'Schmuck', mgmt: 'Ja', notizen: 'Agentur: MGM', kampagne: 'AW25', buchungstyp: 'Reel', fee: 2200, produkt: 200, gesamt: 2400, promoCode: 'LENA20', datum: '10.05.2026', orgUmsatz: 8800, orgKlicks: 1420, orgCPK: 1.69, orgROAS: 4.0, orgBestellungen: 98, orgBW: 90, adSpend: 1200, adUmsatz: 4800, adKlicks: 620, adCPK: 1.94, adROAS: 4.0, adBestellungen: 54, gesUmsatz: 13600, gesROAS: 3.8, gesKlicks: 2040, storyViews: 45000, storyWert: 4500, ttWert: 0, reelWert: 4500, affiliatePct: '12%', tkpTT: 0, tkpStory: 2.1, tkpPost: 3.5 },
  { name: 'Mia Wagner', ig: '@miafashion', tt: '@miawagner', igFollower: 1250000, ttFollower: 890000, igTier: 'Macro', ttTier: 'Macro', igEr: 2.1, ttEr: 1.8, ttAvgViews: 210000, ttAvgLikes: 8400, ttAvgComments: 320, overallTier: 'Macro', gesamtReichweite: 2140000, status: 'Kontaktiert', prio: 'Mittel', kategorie: 'Lifestyle', mgmt: 'Agentur', notizen: '', kampagne: '', buchungstyp: '', fee: 5500, produkt: 300, gesamt: 5800, promoCode: '', datum: '', orgUmsatz: 2100, orgKlicks: 340, orgCPK: 17.06, orgROAS: 1.8, orgBestellungen: 23, orgBW: 91, adSpend: 0, adUmsatz: 0, adKlicks: 0, adCPK: 0, adROAS: 0, adBestellungen: 0, gesUmsatz: 2100, gesROAS: 1.8, gesKlicks: 340, storyViews: 125000, storyWert: 12500, ttWert: 8750, reelWert: 8750, affiliatePct: '10%', tkpTT: 4.8, tkpStory: 1.2, tkpPost: 2.8 },
  { name: 'Klara Becker', ig: '@klarabecker', tt: '@klaratt', igFollower: 3800000, ttFollower: 2100000, igTier: 'Top-Tier', ttTier: 'Top-Tier', igEr: 1.4, ttEr: 1.2, ttAvgViews: 890000, ttAvgLikes: 24000, ttAvgComments: 980, overallTier: 'Top-Tier', gesamtReichweite: 5900000, status: 'Offen', prio: 'Niedrig', kategorie: 'Lifestyle', mgmt: 'Agentur', notizen: 'Sehr teuer', kampagne: '', buchungstyp: '', fee: 15000, produkt: 500, gesamt: 15500, promoCode: '', datum: '', orgUmsatz: 0, orgKlicks: 0, orgCPK: 0, orgROAS: 0, orgBestellungen: 0, orgBW: 0, adSpend: 0, adUmsatz: 0, adKlicks: 0, adCPK: 0, adROAS: 0, adBestellungen: 0, gesUmsatz: 0, gesROAS: 0, gesKlicks: 0, storyViews: 380000, storyWert: 38000, ttWert: 10500, reelWert: 19000, affiliatePct: '8%', tkpTT: 0, tkpStory: 0, tkpPost: 0 },
]

const getTier = (f: number) => f >= 1000000 ? 'Top-Tier' : f >= 500000 ? 'Macro' : f >= 50000 ? 'Mid-Tier' : f >= 10000 ? 'Micro' : 'Nano'
const getAffPct = (f: number) => f >= 1000000 ? '8%' : f >= 500000 ? '10%' : f >= 50000 ? '12%' : '15%'
const calcPostWert = (f: number) => f < 10000 ? Math.round(f * 0.01) : f < 50000 ? Math.round(f * 0.015) : f < 500000 ? Math.round(f * 0.01) : f < 1000000 ? Math.round(f * 0.007) : Math.round(f * 0.005)

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
  { key: 'tt', label: 'TT Handle', group: 'TikTok' },
  { key: 'ttFollower', label: 'TT Follower', group: 'TikTok' },
  { key: 'ttAvgViews', label: 'TT Ø Views', group: 'TikTok' },
  { key: 'ttEr', label: 'TT ER%', group: 'TikTok' },
  { key: 'ttAvgLikes', label: 'TT Ø Likes', group: 'TikTok' },
  { key: 'ttAvgComments', label: 'TT Ø Komm.', group: 'TikTok' },
  { key: 'overallTier', label: 'Overall Tier', group: 'Overall' },
  { key: 'gesamtReichweite', label: 'Reichweite', group: 'Overall' },
  { key: 'kampagne', label: 'Kampagne', group: 'Deal' },
  { key: 'buchungstyp', label: 'Buchungstyp', group: 'Deal' },
  { key: 'fee', label: 'Fee €', group: 'Deal' },
  { key: 'produkt', label: 'Produkt €', group: 'Deal' },
  { key: 'gesamt', label: 'Gesamt €', group: 'Deal' },
  { key: 'promoCode', label: 'Promo Code', group: 'Deal' },
  { key: 'datum', label: 'Datum', group: 'Deal' },
  { key: 'orgUmsatz', label: 'Org. Umsatz', group: 'Organisch' },
  { key: 'orgKlicks', label: 'Org. Klicks', group: 'Organisch' },
  { key: 'orgCPK', label: 'Org. CPK', group: 'Organisch' },
  { key: 'orgROAS', label: 'Org. ROAS', group: 'Organisch' },
  { key: 'orgBestellungen', label: 'Org. Best.', group: 'Organisch' },
  { key: 'adSpend', label: 'Ad Spend', group: 'Ads' },
  { key: 'adUmsatz', label: 'Ad Umsatz', group: 'Ads' },
  { key: 'adROAS', label: 'Ad ROAS', group: 'Ads' },
  { key: 'gesUmsatz', label: 'Ges. Umsatz', group: 'Gesamt' },
  { key: 'gesROAS', label: 'Ges. ROAS', group: 'Gesamt' },
  { key: 'gesKlicks', label: 'Ges. Klicks', group: 'Gesamt' },
  { key: 'storyWert', label: 'Story €', group: 'Bewertung' },
  { key: 'ttWert', label: 'TikTok €', group: 'Bewertung' },
  { key: 'reelWert', label: 'Reel €', group: 'Bewertung' },
  { key: 'affiliatePct', label: 'Affiliate %', group: 'Bewertung' },
  { key: 'tkpTT', label: 'TKP TT', group: 'TKP' },
  { key: 'tkpStory', label: 'TKP Story', group: 'TKP' },
  { key: 'tkpPost', label: 'TKP Post', group: 'TKP' },
]

const groups = ['Basis', 'Instagram', 'TikTok', 'Overall', 'Deal', 'Organisch', 'Ads', 'Gesamt', 'Bewertung', 'TKP']
const emptyForm = { name: '', igHandle: '', ttHandle: '', status: 'Offen', prio: 'Mittel', kategorie: 'Schmuck', kampagne: '', buchungstyp: 'Reel', fee: '', produkt: '', promoCode: '', datum: '', notizen: '' }

export default function Creator() {
  const [creators, setCreators] = useState<Creator[]>(initialCreators)
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
  const [fetchedData, setFetchedData] = useState<Partial<Creator> | null>(null)
  const [visibleCols, setVisibleCols] = useState(['status', 'igFollower', 'ttFollower', 'overallTier', 'kampagne', 'fee', 'promoCode', 'orgUmsatz', 'gesROAS'])
  const [form, setForm] = useState(emptyForm)

  const toggleCol = (key: string) => setVisibleCols(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  const toggleGroup = (group: string) => {
    const keys = allColumns.filter(c => c.group === group).map(c => c.key)
    const allOn = keys.every(k => visibleCols.includes(k))
    setVisibleCols(prev => allOn ? prev.filter(k => !keys.includes(k)) : [...new Set([...prev, ...keys])])
  }

  const openAdd = () => { setForm(emptyForm); setEditMode(false); setFetchDone(false); setFetchedData(null); setFetchError(''); setShowModal(true) }
  const openEdit = (c: Creator) => {
    setForm({ name: c.name, igHandle: c.ig, ttHandle: c.tt, status: c.status, prio: c.prio, kategorie: c.kategorie, kampagne: c.kampagne, buchungstyp: c.buchungstyp, fee: String(c.fee), produkt: String(c.produkt), promoCode: c.promoCode, datum: c.datum, notizen: c.notizen })
    setEditMode(true); setFetchDone(false); setFetchedData(null); setSelected(null); setShowModal(true)
  }
  const closeModal = () => { setShowModal(false); setEditMode(false); setFetchDone(false); setFetchedData(null); setFetchError(''); setForm(emptyForm) }

  const simulateFetch = async () => {
    if (!form.igHandle) return
    setFetching(true)
    setFetchDone(false)
    setFetchError('')
    setFetchedData(null)
    try {
      const params = new URLSearchParams()
      if (form.igHandle) params.append('ig', form.igHandle.replace('@', ''))
      if (form.ttHandle) params.append('tt', form.ttHandle.replace('@', ''))
      const res = await fetch(`/api/creator?${params.toString()}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setFetchedData(data)
      if (data.fullName && !form.name) setForm(p => ({ ...p, name: data.fullName }))
      setFetchDone(true)
    } catch (e: any) {
      setFetchError(e.message || 'Fehler beim Laden')
    } finally {
      setFetching(false)
    }
  }

  const handleSave = () => {
    if (!form.name || !form.igHandle) return
    const fee = Number(form.fee) || 0
    const produkt = Number(form.produkt) || 0
    const ig = form.igHandle.startsWith('@') ? form.igHandle : '@' + form.igHandle
    const tt = form.ttHandle ? (form.ttHandle.startsWith('@') ? form.ttHandle : '@' + form.ttHandle) : ''

    if (editMode) {
      setCreators(prev => prev.map(c => c.name === (selected?.name || form.name) ? {
        ...c, name: form.name, ig, tt, status: form.status, prio: form.prio,
        kategorie: form.kategorie, kampagne: form.kampagne, buchungstyp: form.buchungstyp,
        fee, produkt, gesamt: fee + produkt, promoCode: form.promoCode, notizen: form.notizen,
      } : c))
    } else {
      const base = fetchedData || {}
      const igF = (base as any).igFollower || 0
      const ttF = (base as any).ttFollower || 0
      setCreators(prev => [...prev, {
        name: form.name, ig, tt,
        igFollower: igF, ttFollower: ttF,
        igTier: (base as any).igTier || getTier(igF),
        ttTier: (base as any).ttTier || '',
        igEr: (base as any).igEr || 0,
        ttEr: (base as any).ttEr || 0,
        ttAvgViews: (base as any).ttAvgViews || 0,
        ttAvgLikes: (base as any).ttAvgLikes || 0,
        ttAvgComments: (base as any).ttAvgComments || 0,
        overallTier: (base as any).overallTier || getTier(igF),
        gesamtReichweite: (base as any).gesamtReichweite || igF + ttF,
        status: form.status, prio: form.prio, kategorie: form.kategorie,
        mgmt: 'Nein', notizen: form.notizen,
        kampagne: form.kampagne, buchungstyp: form.buchungstyp,
        fee, produkt, gesamt: fee + produkt,
        promoCode: form.promoCode, datum: form.datum,
        orgUmsatz: 0, orgKlicks: 0, orgCPK: 0, orgROAS: 0, orgBestellungen: 0, orgBW: 0,
        adSpend: 0, adUmsatz: 0, adKlicks: 0, adCPK: 0, adROAS: 0, adBestellungen: 0,
        gesUmsatz: 0, gesROAS: 0, gesKlicks: 0, storyViews: 0,
        storyWert: (base as any).storyWert || 0,
        ttWert: (base as any).ttWert || 0,
        reelWert: (base as any).reelWert || 0,
        affiliatePct: (base as any).affiliatePct || getAffPct(igF),
        tkpTT: 0, tkpStory: 0, tkpPost: 0,
      }])
    }
    closeModal()
  }

  const filtered = creators.filter(c => {
    const s = search.toLowerCase()
    return (!s || c.name.toLowerCase().includes(s) || c.ig.includes(s) || c.promoCode.toLowerCase().includes(s))
      && (!filterStatus || c.status === filterStatus)
      && (!filterTier || c.overallTier === filterTier)
  })

  const dash = <span className="text-gray-700">—</span>
  const fmt = (n: number) => n > 0 ? n.toLocaleString('de-DE') : '—'
  const fmtEur = (n: number) => n > 0 ? `${n.toLocaleString('de-DE')} €` : '—'

  const renderCell = (c: Creator, key: string) => {
    switch (key) {
      case 'ig': return <span className="text-gray-500 text-sm whitespace-nowrap">{c.ig}</span>
      case 'tt': return <span className="text-gray-500 text-sm whitespace-nowrap">{c.tt || dash}</span>
      case 'status': return <span className={`text-xs px-2 py-0.5 rounded-md font-medium whitespace-nowrap ${statusStyle[c.status]}`}>{c.status}</span>
      case 'prio': return <span className={`text-xs px-2 py-0.5 rounded-md font-medium whitespace-nowrap ${c.prio === 'Hoch' ? 'text-red-400 bg-red-950 border border-red-800/30' : c.prio === 'Mittel' ? 'text-amber-400 bg-amber-950 border border-amber-800/30' : 'text-gray-400 bg-gray-800 border border-gray-700/50'}`}>{c.prio}</span>
      case 'kategorie': return <span className="text-gray-400 text-sm whitespace-nowrap">{c.kategorie}</span>
      case 'igFollower': return <span className="text-gray-300 text-sm whitespace-nowrap">{fmt(c.igFollower)}</span>
      case 'igTier': return c.igTier ? <span className={`text-xs px-2 py-0.5 rounded-md font-medium whitespace-nowrap ${tierStyle[c.igTier]}`}>{c.igTier}</span> : dash
      case 'igEr': return <span className={`text-sm font-medium ${c.igEr >= 4 ? 'text-emerald-400' : c.igEr >= 2 ? 'text-amber-400' : 'text-red-400'}`}>{c.igEr}%</span>
      case 'ttFollower': return <span className="text-gray-300 text-sm whitespace-nowrap">{c.ttFollower > 0 ? fmt(c.ttFollower) : dash}</span>
      case 'ttAvgViews': return <span className="text-gray-300 text-sm whitespace-nowrap">{c.ttAvgViews > 0 ? fmt(c.ttAvgViews) : dash}</span>
      case 'ttEr': return c.ttEr > 0 ? <span className={`text-sm font-medium ${c.ttEr >= 4 ? 'text-emerald-400' : c.ttEr >= 2 ? 'text-amber-400' : 'text-red-400'}`}>{c.ttEr}%</span> : dash
      case 'ttAvgLikes': return <span className="text-gray-300 text-sm">{c.ttAvgLikes > 0 ? fmt(c.ttAvgLikes) : dash}</span>
      case 'ttAvgComments': return <span className="text-gray-300 text-sm">{c.ttAvgComments > 0 ? fmt(c.ttAvgComments) : dash}</span>
      case 'overallTier': return <span className={`text-xs px-2 py-0.5 rounded-md font-medium whitespace-nowrap ${tierStyle[c.overallTier]}`}>{c.overallTier}</span>
      case 'gesamtReichweite': return <span className="text-gray-300 text-sm whitespace-nowrap">{fmt(c.gesamtReichweite)}</span>
      case 'kampagne': return <span className="text-gray-400 text-sm whitespace-nowrap">{c.kampagne || dash}</span>
      case 'buchungstyp': return <span className="text-gray-400 text-sm whitespace-nowrap">{c.buchungstyp || dash}</span>
      case 'fee': return <span className="text-gray-300 text-sm whitespace-nowrap">{fmtEur(c.fee)}</span>
      case 'produkt': return <span className="text-gray-300 text-sm whitespace-nowrap">{fmtEur(c.produkt)}</span>
      case 'gesamt': return <span className="text-white text-sm font-medium whitespace-nowrap">{fmtEur(c.gesamt)}</span>
      case 'promoCode': return <span className="font-mono text-[#7F77DD] text-xs whitespace-nowrap">{c.promoCode || dash}</span>
      case 'datum': return <span className="text-gray-400 text-sm whitespace-nowrap">{c.datum || dash}</span>
      case 'orgUmsatz': return <span className="text-emerald-400 text-sm font-medium whitespace-nowrap">{fmtEur(c.orgUmsatz)}</span>
      case 'orgKlicks': return <span className="text-gray-300 text-sm whitespace-nowrap">{c.orgKlicks > 0 ? fmt(c.orgKlicks) : dash}</span>
      case 'orgCPK': return c.orgCPK > 0 ? <span className={`text-sm font-medium ${c.orgCPK <= 1 ? 'text-emerald-400' : c.orgCPK <= 3 ? 'text-amber-400' : 'text-red-400'}`}>{c.orgCPK.toFixed(2)} €</span> : dash
      case 'orgROAS': return <span className={`text-sm font-semibold ${roasColor(c.orgROAS)}`}>{c.orgROAS > 0 ? `${c.orgROAS}x` : dash}</span>
      case 'orgBestellungen': return <span className="text-gray-300 text-sm">{c.orgBestellungen > 0 ? c.orgBestellungen : dash}</span>
      case 'adSpend': return <span className="text-gray-300 text-sm whitespace-nowrap">{fmtEur(c.adSpend)}</span>
      case 'adUmsatz': return <span className="text-emerald-400 text-sm font-medium whitespace-nowrap">{fmtEur(c.adUmsatz)}</span>
      case 'adROAS': return <span className={`text-sm font-semibold ${roasColor(c.adROAS)}`}>{c.adROAS > 0 ? `${c.adROAS}x` : dash}</span>
      case 'gesUmsatz': return <span className="text-emerald-400 text-sm font-semibold whitespace-nowrap">{fmtEur(c.gesUmsatz)}</span>
      case 'gesROAS': return <span className={`text-sm font-bold ${roasColor(c.gesROAS)}`}>{c.gesROAS > 0 ? `${c.gesROAS}x` : dash}</span>
      case 'gesKlicks': return <span className="text-gray-300 text-sm">{c.gesKlicks > 0 ? fmt(c.gesKlicks) : dash}</span>
      case 'storyWert': return <span className="text-purple-400 text-sm whitespace-nowrap">{fmtEur(c.storyWert)}</span>
      case 'ttWert': return <span className="text-purple-400 text-sm whitespace-nowrap">{c.ttWert > 0 ? fmtEur(c.ttWert) : dash}</span>
      case 'reelWert': return <span className="text-purple-400 text-sm whitespace-nowrap">{fmtEur(c.reelWert)}</span>
      case 'affiliatePct': return <span className="text-blue-400 text-sm font-medium">{c.affiliatePct}</span>
      case 'tkpTT': return c.tkpTT > 0 ? <span className={`text-sm font-medium ${c.tkpTT <= 1 ? 'text-emerald-400' : c.tkpTT <= 3 ? 'text-amber-400' : 'text-red-400'}`}>{c.tkpTT} €</span> : dash
      case 'tkpStory': return c.tkpStory > 0 ? <span className={`text-sm font-medium ${c.tkpStory <= 1 ? 'text-emerald-400' : c.tkpStory <= 3 ? 'text-amber-400' : 'text-red-400'}`}>{c.tkpStory} €</span> : dash
      case 'tkpPost': return c.tkpPost > 0 ? <span className={`text-sm font-medium ${c.tkpPost <= 1 ? 'text-emerald-400' : c.tkpPost <= 3 ? 'text-amber-400' : 'text-red-400'}`}>{c.tkpPost} €</span> : dash
      default: return dash
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
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.08] text-gray-400 text-xs hover:bg-white/[0.04] transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export
            </button>
            <div className="relative">
              <button onClick={() => setShowColPicker(!showColPicker)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-colors ${showColPicker ? 'border-[#7F77DD]/50 text-[#7F77DD] bg-[#7F77DD]/10' : 'border-white/[0.08] text-gray-400 hover:bg-white/[0.04]'}`}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                Spalten ({visibleCols.length})
              </button>
              {showColPicker && (
                <div className="absolute right-0 top-10 bg-[#1A1A1A] border border-white/[0.08] rounded-2xl p-4 w-64 z-50 shadow-2xl max-h-[80vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white text-xs font-semibold">Spalten anpassen</span>
                    <button onClick={() => setShowColPicker(false)} className="text-gray-600 hover:text-gray-300">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
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
                            {visibleCols.includes(col.key) && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                          </div>
                          <span className="text-gray-300 text-xs">{col.label}</span>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={openAdd} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#7F77DD] text-white text-xs hover:bg-[#534AB7] transition-colors font-medium">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Creator hinzufügen
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex gap-3 mb-5 flex-wrap">
            <div className="flex-1 min-w-48 relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, Handle oder Code..."
                className="w-full bg-[#141414] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-[#7F77DD]/40" />
            </div>
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
            <div style={{ overflowX: 'auto', maxWidth: 'calc(100vw - 17rem)' }}>
              <table className="w-full" style={{ minWidth: 'max-content' }}>
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left text-xs text-gray-600 px-5 py-3.5 font-medium whitespace-nowrap sticky left-0 bg-[#141414] z-10">Creator</th>
                    {allColumns.filter(c => visibleCols.includes(c.key)).map(col => (
                      <th key={col.key} className="text-left text-xs text-gray-600 px-5 py-3.5 font-medium whitespace-nowrap">{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <tr key={c.name} onClick={() => setSelected(c)}
                      className={`hover:bg-white/[0.02] cursor-pointer transition-colors ${i !== filtered.length - 1 ? 'border-b border-white/[0.04]' : ''}`}>
                      <td className="px-5 py-4 sticky left-0 bg-[#141414] z-10">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#7F77DD]/20 flex items-center justify-center text-[#7F77DD] text-xs font-semibold flex-shrink-0">
                            {c.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="text-white text-sm font-medium whitespace-nowrap">{c.name}</div>
                            {c.notizen && <div className="text-gray-600 text-xs truncate max-w-28">{c.notizen}</div>}
                          </div>
                        </div>
                      </td>
                      {allColumns.filter(col => visibleCols.includes(col.key)).map(col => (
                        <td key={col.key} className="px-5 py-4">{renderCell(c, col.key)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Detail Slide-over */}
        {selected && (
          <div className="fixed inset-0 z-50 flex" onClick={() => setSelected(null)}>
            <div className="flex-1 bg-black/60 backdrop-blur-sm" />
            <div className="w-full max-w-xl bg-[#111] border-l border-white/[0.08] h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06] sticky top-0 bg-[#111] z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#7F77DD]/20 flex items-center justify-center text-[#7F77DD] font-semibold text-lg">
                    {selected.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{selected.name}</div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-gray-500 text-xs">{selected.ig}</span>
                      {selected.tt && <span className="text-gray-500 text-xs">{selected.tt}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-md ${tierStyle[selected.overallTier]}`}>{selected.overallTier}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-md ${statusStyle[selected.status]}`}>{selected.status}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center text-gray-400 hover:text-white">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <div className="p-6 flex flex-col gap-5">
                <div>
                  <p className="text-gray-600 text-[10px] font-semibold uppercase tracking-widest mb-3">Plattform Daten</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#0A0A0A] rounded-xl p-4 border border-white/[0.06]">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 rounded bg-pink-500/20 flex items-center justify-center">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#f472b6" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.5"/></svg>
                        </div>
                        <span className="text-gray-400 text-xs font-medium">Instagram</span>
                      </div>
                      <div className="space-y-2">
                        {[['Follower', selected.igFollower.toLocaleString('de-DE')], ['Tier', selected.igTier], ['ER', `${selected.igEr}%`]].map(([l, v]) => (
                          <div key={l} className="flex justify-between"><span className="text-gray-600 text-xs">{l}</span><span className="text-gray-200 text-xs font-medium">{v}</span></div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-[#0A0A0A] rounded-xl p-4 border border-white/[0.06]">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="white"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9a8.16 8.16 0 0 0 4.77 1.52V7.07a4.85 4.85 0 0 1-1-.38z"/></svg>
                        </div>
                        <span className="text-gray-400 text-xs font-medium">TikTok</span>
                      </div>
                      {selected.ttFollower > 0 ? (
                        <div className="space-y-2">
                          {[['Follower', selected.ttFollower.toLocaleString('de-DE')], ['Ø Views', selected.ttAvgViews.toLocaleString('de-DE')], ['ER', `${selected.ttEr}%`], ['Ø Likes', selected.ttAvgLikes.toLocaleString('de-DE')], ['Ø Komm.', selected.ttAvgComments.toLocaleString('de-DE')]].map(([l, v]) => (
                            <div key={l} className="flex justify-between"><span className="text-gray-600 text-xs">{l}</span><span className="text-gray-200 text-xs font-medium">{v}</span></div>
                          ))}
                        </div>
                      ) : <p className="text-gray-700 text-xs">Kein TikTok</p>}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-gray-600 text-[10px] font-semibold uppercase tracking-widest mb-3">Performance</p>
                  <div className="grid grid-cols-3 gap-2 mb-3">
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
                      ['Org. Best.', selected.orgBestellungen > 0 ? String(selected.orgBestellungen) : '—', ''],
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
                </div>

                <div>
                  <p className="text-gray-600 text-[10px] font-semibold uppercase tracking-widest mb-3">Deal & Kosten</p>
                  <div className="bg-[#0A0A0A] rounded-xl border border-white/[0.06]">
                    {[
                      ['Kampagne', selected.kampagne || '—', ''],
                      ['Buchungstyp', selected.buchungstyp || '—', ''],
                      ['Fee', fmtEur(selected.fee), ''],
                      ['Produkt', fmtEur(selected.produkt), ''],
                      ['Gesamt', fmtEur(selected.gesamt), 'text-white font-semibold'],
                      ['Promo Code', selected.promoCode || '—', 'font-mono text-[#7F77DD]'],
                    ].map(([l, v, cls]) => (
                      <div key={l} className="flex justify-between px-4 py-2.5 border-b border-white/[0.04] last:border-0">
                        <span className="text-gray-600 text-xs">{l}</span>
                        <span className={`text-xs ${cls || 'text-gray-300'}`}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-gray-600 text-[10px] font-semibold uppercase tracking-widest mb-3">Bewertung & TKP</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ['Story Wert', fmtEur(selected.storyWert)],
                      ['TikTok Wert', selected.ttWert > 0 ? fmtEur(selected.ttWert) : '—'],
                      ['Reel Wert', fmtEur(selected.reelWert)],
                      ['Affiliate %', selected.affiliatePct],
                      ['TKP TikTok', selected.tkpTT > 0 ? `${selected.tkpTT} €` : '—'],
                      ['TKP Story', selected.tkpStory > 0 ? `${selected.tkpStory} €` : '—'],
                      ['TKP Post', selected.tkpPost > 0 ? `${selected.tkpPost} €` : '—'],
                    ].map(([l, v]) => (
                      <div key={l} className="bg-[#0A0A0A] rounded-xl p-3 border border-white/[0.06]">
                        <div className="text-gray-600 text-xs mb-1">{l}</div>
                        <div className="text-white text-sm font-semibold">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button className="flex-1 py-2.5 rounded-xl bg-[#7F77DD] text-white text-sm hover:bg-[#534AB7] transition-colors font-medium">Outreach senden</button>
                  <button onClick={() => openEdit(selected)} className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-gray-300 text-sm hover:bg-white/[0.04] transition-colors font-medium">Bearbeiten</button>
                  <button onClick={() => { setCreators(prev => prev.filter(c => c.name !== selected.name)); setSelected(null) }}
                    className="w-10 h-10 rounded-xl border border-red-900/50 text-red-500 hover:bg-red-950/50 transition-colors flex items-center justify-center flex-shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeModal}>
            <div className="bg-[#141414] rounded-2xl w-full max-w-lg border border-white/[0.08] overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06] flex-shrink-0">
                <div>
                  <h2 className="text-white font-semibold">{editMode ? 'Creator bearbeiten' : 'Creator hinzufügen'}</h2>
                  <p className="text-gray-500 text-xs mt-0.5">{editMode ? 'Daten anpassen und speichern' : 'Handle eingeben → echte Daten werden geladen'}</p>
                </div>
                <button onClick={closeModal} className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center text-gray-400 hover:text-white">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <div className="overflow-y-auto p-6 flex flex-col gap-4">
                {!editMode && (
                  <div className="bg-[#0A0A0A] rounded-xl p-4 border border-white/[0.06]">
                    <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-widest mb-3">Auto-Fetch via RapidAPI</p>
                    <div className="flex flex-col gap-2 mb-3">
                      <input value={form.igHandle} onChange={e => setForm(p => ({ ...p, igHandle: e.target.value }))}
                        placeholder="Instagram Handle (@sophiestyle)" className={inputCls} />
                      <input value={form.ttHandle} onChange={e => setForm(p => ({ ...p, ttHandle: e.target.value }))}
                        placeholder="TikTok Handle — optional" className={inputCls} />
                    </div>
                    <button onClick={simulateFetch} disabled={fetching || !form.igHandle}
                      className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${fetching ? 'bg-[#7F77DD]/40 text-white/50 cursor-wait' : fetchDone ? 'bg-emerald-700 text-white' : fetchError ? 'bg-red-950 text-red-400 border border-red-800/30' : form.igHandle ? 'bg-[#7F77DD] text-white hover:bg-[#534AB7]' : 'bg-white/[0.05] text-gray-600 cursor-not-allowed'}`}>
                      {fetching ? (
                        <><svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/><circle cx="12" cy="12" r="10" strokeOpacity="0.2"/></svg>Echte Daten werden geladen...</>
                      ) : fetchDone ? (
                        <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Daten geladen ✓</>
                      ) : fetchError ? (
                        <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{fetchError}</>
                      ) : (
                        <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.73-7.78"/></svg>Echte Daten laden (IG + TT API)</>
                      )}
                    </button>
                    {fetchDone && fetchedData && (
                      <div className="mt-3 bg-emerald-950/40 border border-emerald-800/30 rounded-xl p-3 text-xs text-emerald-500 space-y-0.5">
                        <p className="text-emerald-400 font-medium mb-1">✓ Echte Daten von RapidAPI:</p>
                        {(fetchedData as any).igFollower > 0 && <p>· IG: {(fetchedData as any).igFollower?.toLocaleString('de-DE')} Follower · {(fetchedData as any).igTier} · ER: {(fetchedData as any).igEr}%</p>}
                        {(fetchedData as any).ttFollower > 0 && <p>· TT: {(fetchedData as any).ttFollower?.toLocaleString('de-DE')} Follower · Ø Views: {(fetchedData as any).ttAvgViews?.toLocaleString('de-DE')} · Ø Likes: {(fetchedData as any).ttAvgLikes?.toLocaleString('de-DE')}</p>}
                        <p>· Reel: ~{(fetchedData as any).reelWert?.toLocaleString('de-DE')} € · Affiliate: {(fetchedData as any).affiliatePct}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <div><label className={labelCls}>Name *</label>
                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Sophie Müller" className={inputCls} /></div>

                  {editMode && (
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className={labelCls}>IG Handle</label>
                        <input value={form.igHandle} onChange={e => setForm(p => ({ ...p, igHandle: e.target.value }))} placeholder="@sophiestyle" className={inputCls} /></div>
                      <div><label className={labelCls}>TT Handle</label>
                        <input value={form.ttHandle} onChange={e => setForm(p => ({ ...p, ttHandle: e.target.value }))} placeholder="@sophiett" className={inputCls} /></div>
                    </div>
                  )}

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
                    <div><label className={labelCls}>Kampagne</label>
                      <select value={form.kampagne} onChange={e => setForm(p => ({ ...p, kampagne: e.target.value }))} className={selectCls}>
                        <option value="">Keine</option>
                        {['SS25 Launch', 'AW25 Schmuck', 'Black Friday 2026', 'Evergreen'].map(s => <option key={s}>{s}</option>)}
                      </select></div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelCls}>Buchungstyp</label>
                      <select value={form.buchungstyp} onChange={e => setForm(p => ({ ...p, buchungstyp: e.target.value }))} className={selectCls}>
                        {['Reel', 'TikTok Post', 'Story', 'Reel + TikTok', 'Story + Reel', 'Bundle', 'UGC'].map(s => <option key={s}>{s}</option>)}
                      </select></div>
                    <div><label className={labelCls}>Promo Code</label>
                      <input value={form.promoCode} onChange={e => setForm(p => ({ ...p, promoCode: e.target.value }))} placeholder="SOPHIE15" className={inputCls + ' font-mono'} /></div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelCls}>Fee €</label>
                      <input value={form.fee} onChange={e => setForm(p => ({ ...p, fee: e.target.value }))} placeholder="850" className={inputCls} /></div>
                    <div><label className={labelCls}>Produkt €</label>
                      <input value={form.produkt} onChange={e => setForm(p => ({ ...p, produkt: e.target.value }))} placeholder="150" className={inputCls} /></div>
                  </div>

                  <div><label className={labelCls}>Notizen</label>
                    <textarea value={form.notizen} onChange={e => setForm(p => ({ ...p, notizen: e.target.value }))} placeholder="Agentur, Konditionen..." rows={2}
                      className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-[#7F77DD]/40 resize-none" /></div>
                </div>

                <button onClick={handleSave} disabled={!form.name || !form.igHandle}
                  className={`w-full py-3 rounded-xl text-sm font-medium transition-colors ${form.name && form.igHandle ? 'bg-[#7F77DD] text-white hover:bg-[#534AB7]' : 'bg-white/[0.05] text-gray-600 cursor-not-allowed'}`}>
                  {editMode ? 'Änderungen speichern' : 'Creator hinzufügen'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}