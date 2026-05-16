'use client'
import { useState } from 'react'
import Sidebar from '../components/Sidebar'

const gesendet = [
  { name: 'Sophie Müller', handle: '@sophiestyle', datum: 'vor 2 Tagen', status: 'Geantwortet', antwort: 'Klingt super, bin dabei!', grad: 'from-violet-500 to-purple-700' },
  { name: 'Jana Koch', handle: '@janakoch', datum: 'vor 4 Tagen', status: 'Geantwortet', antwort: 'Ja gerne, schick mir Details', grad: 'from-blue-500 to-cyan-600' },
  { name: 'Mia Wagner', handle: '@miafashion', datum: 'vor 6 Tagen', status: 'Gesendet', antwort: '', grad: 'from-amber-500 to-orange-600' },
  { name: 'Klara Becker', handle: '@klarabecker', datum: 'vor 8 Tagen', status: 'Kein Reply', antwort: '', grad: 'from-rose-500 to-pink-600' },
  { name: 'Nina Krause', handle: '@ninakrause', datum: 'vor 1 Tag', status: 'Gesendet', antwort: '', grad: 'from-emerald-500 to-teal-600' },
]

const statusStyle: Record<string, string> = {
  'Geantwortet': 'text-emerald-400 bg-emerald-950 border border-emerald-800/30',
  'Gesendet': 'text-blue-400 bg-blue-950 border border-blue-800/30',
  'Kein Reply': 'text-gray-400 bg-gray-800 border border-gray-700/50',
}

const templates = [
  {
    name: 'Standard Kollaboration',
    betreff: 'Kollaboration mit {{marke}} 💎',
    text: `Hey {{name}},\n\nwir sind {{marke}} — eine Schmuckmarke aus Deutschland. Dein Content passt perfekt zu unserem Stil und wir würden uns eine Zusammenarbeit vorstellen.\n\nWir bieten:\n• Fee + Produkte\n• {{provision}}% Provision auf jeden Verkauf\n• Deinen eigenen Code {{code}}\n\nInteresse? Meld dich gerne!\n\nLiebe Grüße,\n{{marke}} Team`,
  },
  {
    name: 'UGC Anfrage',
    betreff: 'UGC Kollaboration — {{marke}}',
    text: `Hey {{name}},\n\nwir suchen kreative Köpfe für UGC Content. Kein Posting nötig — nur authentische Videos für uns.\n\nVergütung: {{fee}}€ pro Video\n\nInteressiert?\n\n{{marke}} Team`,
  },
]

export default function Outreach() {
  const [selectedTemplate, setSelectedTemplate] = useState(0)
  const [vars, setVars] = useState({ name: 'Sophie', marke: 'Kolure', provision: '15', code: 'SOPHIE15', fee: '200' })

  const render = (text: string) => Object.entries(vars).reduce((t, [k, v]) => t.replaceAll(`{{${k}}}`, v), text)

  return (
    <div className="flex min-h-screen bg-[#0A0A0A]">
      <Sidebar />
      <main className="flex-1 md:ml-60 min-h-screen">
        <div className="border-b border-white/[0.06] px-8 py-4 flex items-center justify-between bg-[#0A0A0A]/80 backdrop-blur sticky top-0 z-20">
          <div>
            <h1 className="text-white font-semibold text-lg">Outreach</h1>
            <p className="text-gray-600 text-xs mt-0.5">E-Mail Templates und Anfragen-Tracking</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="text-emerald-400 font-medium">{gesendet.filter(g => g.status === 'Geantwortet').length} Antworten</span>
            <span>·</span>
            <span>{gesendet.filter(g => g.status === 'Gesendet').length} ausstehend</span>
            <span>·</span>
            <span className="text-gray-600">{gesendet.filter(g => g.status === 'Kein Reply').length} kein Reply</span>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Template Editor */}
            <div className="flex flex-col gap-4">
              <div className="bg-[#141414] rounded-2xl border border-white/[0.06] p-5">
                <h2 className="text-white font-semibold text-sm mb-4">Template</h2>
                <div className="flex flex-col gap-2 mb-4">
                  {templates.map((t, i) => (
                    <button key={i} onClick={() => setSelectedTemplate(i)}
                      className={`text-left px-4 py-3 rounded-xl text-sm transition-all ${selectedTemplate === i ? 'bg-[#7F77DD]/20 text-[#7F77DD] border border-[#7F77DD]/30' : 'text-gray-400 border border-white/[0.06] hover:border-white/[0.12]'}`}>
                      <div className="font-medium">{t.name}</div>
                    </button>
                  ))}
                </div>

                <h2 className="text-white font-semibold text-sm mb-3">Variablen</h2>
                <div className="flex flex-col gap-2">
                  {Object.entries(vars).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-gray-600 text-xs font-mono w-24 flex-shrink-0 bg-[#0A0A0A] px-2 py-1 rounded-lg border border-white/[0.06]">{`{{${key}}}`}</span>
                      <input value={val} onChange={e => setVars(p => ({ ...p, [key]: e.target.value }))}
                        className="flex-1 bg-[#0A0A0A] border border-white/[0.08] rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-[#7F77DD]/40" />
                    </div>
                  ))}
                </div>
              </div>

              <button className="w-full py-3 rounded-xl bg-[#7F77DD] text-white text-sm hover:bg-[#534AB7] transition-colors font-medium flex items-center justify-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                An {gesendet.filter(g => g.status !== 'Geantwortet').length} Creator senden
              </button>
            </div>

            {/* Preview */}
            <div className="bg-[#141414] rounded-2xl border border-white/[0.06] p-5">
              <h2 className="text-white font-semibold text-sm mb-4">Vorschau</h2>
              <div className="bg-[#0A0A0A] rounded-xl border border-white/[0.06] p-5">
                <div className="text-gray-500 text-xs mb-1 font-medium">Betreff</div>
                <div className="text-white text-sm font-semibold mb-4 pb-4 border-b border-white/[0.06]">
                  {render(templates[selectedTemplate].betreff)}
                </div>
                <div className="text-gray-300 text-xs leading-relaxed whitespace-pre-line">
                  {render(templates[selectedTemplate].text)}
                </div>
              </div>
            </div>
          </div>

          {/* Sent History */}
          <div className="bg-[#141414] rounded-2xl border border-white/[0.06] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06]">
              <h2 className="text-white font-semibold text-sm">Gesendet</h2>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {gesendet.map(g => (
                <div key={g.name} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${g.grad} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {g.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium">{g.name}</div>
                    <div className="text-gray-600 text-xs">{g.handle} · {g.datum}</div>
                    {g.antwort && <div className="text-emerald-400 text-xs mt-1">"{g.antwort}"</div>}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-md font-medium flex-shrink-0 ${statusStyle[g.status]}`}>{g.status}</span>
                  {g.status === 'Kein Reply' && (
                    <button className="text-xs text-[#7F77DD] hover:underline flex-shrink-0">Erneut senden</button>
                  )}
                  {g.status === 'Geantwortet' && (
                    <button className="px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-400 text-xs hover:bg-emerald-900 transition-colors border border-emerald-800/30 flex-shrink-0">
                      Deal erstellen
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}