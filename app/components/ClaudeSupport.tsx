'use client'
import { useState, useRef, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

type Msg = { role: 'user' | 'assistant', content: string }

export default function ClaudeSupport() {
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const [loggedIn, setLoggedIn] = useState(false)
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: 'Hi, ich bin Claude Support. Frag mich alles rund um Trackfluenca – Creator, Outreach, Reels, ROAS, etc.' }
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [notConfigured, setNotConfigured] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setLoggedIn(!!data.session))
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open])

  if (!loggedIn) return null

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return
    const next = [...messages, { role: 'user', content: text } as Msg]
    setMessages(next)
    setInput('')
    setSending(true)
    try {
      const res = await fetch('/api/support-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })
      const d = await res.json()
      if (d.error === 'not_configured') {
        setNotConfigured(true)
        setMessages(m => [...m, { role: 'assistant', content: d.message }])
      } else if (d.reply) {
        setMessages(m => [...m, { role: 'assistant', content: d.reply }])
      } else {
        setMessages(m => [...m, { role: 'assistant', content: 'Entschuldige, da ist etwas schiefgelaufen: ' + (d.error || 'Unbekannter Fehler') }])
      }
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Netzwerkfehler. Bitte spaeter erneut versuchen.' }])
    }
    setSending(false)
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 w-80 sm:w-96 h-[28rem] bg-surface-1 border border-hairline rounded-apple-lg shadow-2xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-hairline-soft flex items-center justify-between bg-surface-2">
            <div className="text-ink-1 text-sm font-medium">Claude Support</div>
            <button onClick={() => setOpen(false)} className="text-ink-3 hover:text-ink-1 text-lg leading-none">×</button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5">
            {messages.map((m, i) => (
              <div key={i} className={`max-w-[85%] text-xs rounded-apple-sm px-3 py-2 ${m.role === 'user' ? 'self-end bg-accent text-ink-1' : 'self-start bg-white/[0.06] text-ink-2'}`}>
                {m.content}
              </div>
            ))}
            {sending && <div className="self-start text-ink-4 text-xs px-3">Claude tippt...</div>}
          </div>
          <div className="p-3 border-t border-hairline-soft flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              disabled={notConfigured}
              placeholder={notConfigured ? 'Noch nicht eingerichtet...' : 'Frage stellen...'}
              className="flex-1 bg-surface-0 border border-hairline rounded-apple-sm px-3 py-2 text-xs text-ink-1 placeholder-gray-600 focus:outline-none focus:border-accent/50 disabled:opacity-50"
            />
            <button onClick={send} disabled={sending || notConfigured} className="px-3 py-2 rounded-apple-sm bg-accent text-ink-1 text-xs hover:bg-accent-hover disabled:opacity-40 transition-colors">
              Senden
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-12 h-12 rounded-full bg-accent shadow-[0_6px_20px_-4px_rgba(10,132,255,0.55)] flex items-center justify-center text-ink-1 hover:bg-accent-hover transition-colors"
        title="Claude Support">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
      </button>
    </div>
  )
}
