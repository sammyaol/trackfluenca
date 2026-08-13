'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

const nav = [
  {
    section: 'Übersicht',
    items: [
      { href: '/dashboard', label: 'Dashboard', color: '#0A84FF', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg> },
      { href: '/discovery', label: 'Discovery', color: '#64D2FF', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg> },
    ],
  },
  {
    section: 'Management',
    items: [
      { href: '/creator', label: 'Creator', color: '#FF375F', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
      { href: '/celebs', label: 'Celebs', color: '#BF5AF2', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.4H22l-6 4.4 2.3 7.2L12 16.6l-6.3 4.4L8 13.8 2 9.4h7.6z"/></svg> },
      { href: '/outreach', label: 'Outreach', color: '#30D158', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg> },
      { href: '/kampagnen', label: 'Kampagnen', color: '#FF9F0A', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg> },
      { href: '/bestellungen', label: 'Bestellungen', color: '#5E5CE6', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> },
      { href: '/affiliate', label: 'Affiliate', color: '#FFD60A', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg> },
    ],
  },
  {
    section: 'System',
    items: [
      { href: '/einstellungen', label: 'Einstellungen', color: '#98989D', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg> },
    ],
  },
];

export default function Sidebar() {
  const path = usePathname();
  const [email, setEmail] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  useEffect(() => { sb.auth.getSession().then(({ data }) => setEmail(data.session?.user?.email || '')) }, []);
  const logout = async () => { await sb.auth.signOut(); window.location.href = '/login' };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 flex-col bg-surface-0/98 backdrop-blur-sm border-r border-hairline-soft fixed h-full z-30">
        <div className="flex items-center gap-3 px-5 py-6">
          <div className="w-8 h-8 rounded-apple-sm bg-accent flex items-center justify-center flex-shrink-0 shadow-apple-sm">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 10 8 4 13 10" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="3" cy="10" r="1.5" fill="white"/>
              <circle cx="8" cy="4" r="1.5" fill="rgba(255,255,255,0.6)"/>
              <circle cx="13" cy="10" r="1.5" fill="rgba(255,255,255,0.6)"/>
              <line x1="3" y1="13" x2="13" y2="13" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div className="text-ink-1 font-semibold text-sm tracking-tight">Track<span className="text-accent font-normal">fluenca</span></div>
            <div className="text-ink-4 text-[11px]">Influencer OS</div>
          </div>
        </div>

        <div className="px-3 py-2 flex-1 overflow-y-auto">
          {nav.map(group => (
            <div key={group.section} className="mb-6">
              <div className="text-ink-4 text-[10px] font-medium uppercase tracking-widest px-3 mb-2">{group.section}</div>
              {group.items.map(item => {
                const active = path === item.href;
                return (
                  <Link key={item.href} href={item.href}
                    className={`flex items-center gap-3 px-2.5 py-2 rounded-apple-sm text-sm transition-all duration-200 ease-apple mb-0.5 group ${active ? 'bg-white/[0.07] text-ink-1' : 'text-ink-3 hover:text-ink-1 hover:bg-white/[0.035]'}`}>
                    <span className="w-7 h-7 rounded-[9px] flex items-center justify-center flex-shrink-0 shadow-apple-sm" style={{ background: item.color }}>
                      {item.icon}
                    </span>
                    <span className="font-medium">{item.label}</span>
                    {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent"></span>}
                  </Link>
                )
              })}
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-hairline-soft">
          <div className="relative">
            <button onClick={() => setShowMenu(p => !p)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-apple-sm hover:bg-white/[0.035] cursor-pointer transition-colors duration-200 ease-apple group">
              <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                {email ? email[0].toUpperCase() : 'U'}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-ink-1 text-xs font-medium truncate">{email || 'Mein Account'}</div>
                <div className="text-ink-3 text-xs">Profil</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-ink-4 group-hover:text-ink-2 transition-colors"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {showMenu && (
              <div className="absolute bottom-12 left-0 right-0 bg-surface-3/98 backdrop-blur-sm border border-hairline rounded-apple-lg p-2 space-y-1 shadow-apple-lg">
                <Link href="/einstellungen" onClick={() => setShowMenu(false)} className="flex items-center gap-2 px-3 py-2 rounded-apple-sm hover:bg-white/[0.05] text-ink-2 text-xs transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
                  Profil bearbeiten
                </Link>
                <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-apple-sm hover:bg-red-500/10 text-red-400 text-xs transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Abmelden
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-0/97 backdrop-blur-sm border-t border-hairline-soft flex justify-around gap-0.5 overflow-x-auto py-2 px-1 z-50">
        {nav.flatMap(g => g.items).slice(0, 7).map(item => {
          const active = path === item.href;
          return (
            <Link key={item.href} href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1 transition-all duration-200 ease-apple ${active ? 'text-ink-1' : 'text-ink-4'}`}>
              <span className="w-6 h-6 rounded-[7px] flex items-center justify-center transition-opacity" style={{ background: item.color, opacity: active ? 1 : 0.45 }}>
                {item.icon}
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
