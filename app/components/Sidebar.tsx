'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const nav = [
  {
    section: 'Übersicht',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
      { href: '/discovery', label: 'Discovery', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg> },
    ]
  },
  {
    section: 'Management',
    items: [
      { href: '/creator', label: 'Creator', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
      { href: '/outreach', label: 'Outreach', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
      { href: '/kampagnen', label: 'Kampagnen', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
      { href: '/affiliate', label: 'Affiliate', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
    ]
  },
  {
    section: 'System',
    items: [
      { href: '/einstellungen', label: 'Einstellungen', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
    ]
  }
]

export default function Sidebar() {
  const path = usePathname()

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 flex-col bg-[#111] border-r border-white/[0.06] fixed h-full z-30">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
          <div className="w-8 h-8 rounded-xl bg-[#7F77DD] flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 10 L8 4" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M8 4 L13 10" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round"/>
              <circle cx="3" cy="10" r="1.5" fill="white"/>
              <circle cx="8" cy="4" r="1.5" fill="white"/>
              <circle cx="13" cy="10" r="1.5" fill="rgba(255,255,255,0.6)"/>
              <line x1="3" y1="13" x2="13" y2="13" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div className="text-white font-semibold text-sm tracking-tight">Track<span className="text-[#7F77DD] font-normal">fluenca</span></div>
            <div className="text-gray-600 text-xs">Influencer OS</div>
          </div>
        </div>

        <div className="px-3 py-4 flex-1 overflow-y-auto">
          {nav.map(group => (
            <div key={group.section} className="mb-5">
              <div className="text-gray-600 text-[10px] font-medium uppercase tracking-widest px-3 mb-1.5">{group.section}</div>
              {group.items.map(item => {
                const active = path === item.href
                return (
                  <Link key={item.href} href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all mb-0.5 group ${active ? 'bg-white/[0.08] text-white' : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.04]'}`}>
                    <span className={`transition-colors ${active ? 'text-[#7F77DD]' : 'group-hover:text-gray-300'}`}>{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                    {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#7F77DD]"></span>}
                  </Link>
                )
              })}
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] cursor-pointer transition-all group">
            <div className="w-7 h-7 rounded-full bg-[#7F77DD] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">K</div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-medium truncate">Kolure</div>
              <div className="text-gray-500 text-xs">Pro Plan</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-gray-600 group-hover:text-gray-400 transition-colors">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#111]/95 backdrop-blur border-t border-white/[0.06] flex justify-around py-2 z-50">
        {nav.flatMap(g => g.items).slice(0, 5).map(item => {
          const active = path === item.href
          return (
            <Link key={item.href} href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${active ? 'text-[#7F77DD]' : 'text-gray-600 hover:text-gray-300'}`}>
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}