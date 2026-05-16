'use client'
import { useState } from 'react'
import Link from 'next/link'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/discovery', label: 'Discovery', icon: '◎' },
  { href: '/creator', label: 'Creator', icon: '👤' },
  { href: '/outreach', label: 'Outreach', icon: '✉' },
  { href: '/kampagnen', label: 'Kampagnen', icon: '📢' },
  { href: '/affiliate', label: 'Affiliate', icon: '%' },
  { href: '/einstellungen', label: 'Einstellungen', icon: '⚙' },
]

const gesendet = [
  { name: 'Sophie Müller', handle: '@sophiestyle', datum: 'vor 2 Tagen', status: 'Geantwortet', antwort: 'Klingt super, bin dabei!' },
  { name: 'Jana Koch', handle: '@janakoch', datum: 'vor 4 Tagen', status: 'Geantwortet', antwort: 'Ja gerne, schick mir Details' },
  { name: 'Mia Wagner', handle: '@miafashion', datum: 'vor 6 Tagen', status: 'Gesendet', antwort: '' },
  { name: 'Klara Becker', handle: '@klarabecker', datum: 'vor 8 Tagen', status: 'Kein Reply', antwort: '' },
  { name: 'Nina Krause', handle: '@ninakrause', datum: 'vor 1 Tag', status: 'Gesendet', antwort: '' },
]

const statusColor: Record<string, string> = {
  'Geantwortet': 'bg-green-900 text-green-300',
  'Gesendet': 'bg-blue-900 text-blue-300',
  'Kein Reply': 'bg-gray-800 text-gray-400',
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
  const [previewVars, setPreviewVars] = useState({
    name: 'Sophie',
    marke: 'Kolure',
    provision: '15',
    code: 'SOPHIE15',
    fee: '200',
  })

  const renderTemplate = (text: string) => {
    return text
      .replace(/{{name}}/g, previewVars.name)
      .replace(/{{marke}}/g, previewVars.marke)
      .replace(/{{provision}}/g, previewVars.provision)
      .replace(/{{code}}/g, previewVars.code)
      .replace(/{{fee}}/g, previewVars.fee)
  }

  return (
    <div className="flex min-h-screen bg-[#0E0E0E]">
      <aside className="hidden md:flex w-52 flex-col bg-[#111] border-r border-white/5 fixed h-full">
        <div className="flex items-center gap-2 px-4 py-5 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-[#2C1F6B] flex items-center justify-center text-xs">⟆</div>
          <span className="text-white font-bold text-sm">Track<span className="text-[#7F77DD] font-normal">fluenca</span></span>
        </div>
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${item.href === '/outreach' ? 'bg-[#7F77DD]/20 text-[#7F77DD]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
              <span>{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#2C1F6B] flex items-center justify-center text-xs text-purple-300">KO</div>
            <div>
              <div className="text-white text-xs font-medium">Kolure</div>
              <div className="text-gray-500 text-xs">Pro Plan</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 md:ml-52 p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-white text-xl font-medium">Outreach</h1>
          <p className="text-gray-500 text-sm mt-1">E-Mail Templates und Anfragen-Tracking</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="bg-[#1A1A1A] rounded-xl border border-white/5 p-5 mb-4">
              <h2 className="text-white text-sm font-medium mb-3">Template wählen</h2>
              <div className="flex flex-col gap-2 mb-4">
                {templates.map((t, i) => (
                  <button key={i} onClick={() => setSelectedTemplate(i)}
                    className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedTemplate === i ? 'bg-[#7F77DD]/20 text-[#7F77DD] border border-[#7F77DD]/30' : 'text-gray-400 border border-white/5 hover:border-white/10'}`}>
                    {t.name}
                  </button>
                ))}
              </div>

              <h2 className="text-white text-sm font-medium mb-3">Variablen</h2>
              <div className="flex flex-col gap-2">
                {Object.entries(previewVars).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-gray-500 text-xs w-20 flex-shrink-0">{`{{${key}}}`}</span>
                    <input value={val}
                      onChange={e => setPreviewVars(prev => ({ ...prev, [key]: e.target.value }))}
                      className="flex-1 bg-[#0E0E0E] border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-[#7F77DD]" />
                  </div>
                ))}
              </div>
            </div>

            <button className="w-full py-3 rounded-xl bg-[#7F77DD] text-white text-sm hover:bg-[#534AB7] transition-colors">
              An {gesendet.filter(g => g.status !== 'Geantwortet').length} Creator senden
            </button>
          </div>

          <div className="bg-[#1A1A1A] rounded-xl border border-white/5 p-5">
            <h2 className="text-white text-sm font-medium mb-3">Vorschau</h2>
            <div className="bg-[#0E0E0E] rounded-xl p-4">
              <div className="text-gray-400 text-xs mb-1">Betreff</div>
              <div className="text-white text-sm font-medium mb-4 pb-3 border-b border-white/10">
                {renderTemplate(templates[selectedTemplate].betreff)}
              </div>
              <div className="text-gray-300 text-xs leading-relaxed whitespace-pre-line">
                {renderTemplate(templates[selectedTemplate].text)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#1A1A1A] rounded-xl border border-white/5 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <h2 className="text-white text-sm font-medium">Gesendet</h2>
            <div className="flex gap-3 text-xs text-gray-500">
              <span className="text-green-400">{gesendet.filter(g => g.status === 'Geantwortet').length} Antworten</span>
              <span>{gesendet.filter(g => g.status === 'Gesendet').length} ausstehend</span>
              <span className="text-gray-600">{gesendet.filter(g => g.status === 'Kein Reply').length} kein Reply</span>
            </div>
          </div>
          <div className="divide-y divide-white/5">
            {gesendet.map(g => (
              <div key={g.name} className="flex items-center gap-4 px-5 py-4 hover:bg-white/2 transition-colors">
                <div className="w-8 h-8 rounded-full bg-[#2C1F6B] flex items-center justify-center text-purple-300 text-xs font-medium flex-shrink-0">
                  {g.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium">{g.name}</div>
                  <div className="text-gray-500 text-xs">{g.handle} · {g.datum}</div>
                  {g.antwort && <div className="text-green-400 text-xs mt-1">"{g.antwort}"</div>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColor[g.status]}`}>{g.status}</span>
                  {g.status === 'Kein Reply' && (
                    <button className="text-xs text-[#7F77DD] hover:underline">Erneut senden</button>
                  )}
                  {g.status === 'Geantwortet' && (
                    <button className="text-xs px-3 py-1 rounded-lg bg-green-700/30 text-green-300 hover:bg-green-700/50">
                      Deal erstellen
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#111] border-t border-white/10 flex justify-around py-2 z-40">
          {navItems.slice(0, 5).map(item => (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 text-gray-500 hover:text-white px-3 py-1">
              <span className="text-lg">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </Link>
          ))}
        </nav>
      </main>
    </div>
  )
}