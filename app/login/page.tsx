'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const handle = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    
    if (isSignup) {
      if (password.length < 6) {
        setError('Passwort muss mindestens 6 Zeichen lang sein')
        setLoading(false)
        return
      }
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: window.location.origin + '/dashboard'
        }
      })
      if (error) {
        setError(error.message === 'User already registered' ? 'Diese E-Mail ist bereits registriert' : error.message)
        setLoading(false)
      } else {
        if (data.session) {
          window.location.href = '/dashboard'
        } else {
          setSuccess('Bestätigungs-E-Mail gesendet! Bitte E-Mail prüfen.')
          setLoading(false)
        }
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message === 'Invalid login credentials' ? 'E-Mail oder Passwort falsch' : error.message)
        setLoading(false)
      } else {
        window.location.href = '/dashboard'
      }
    }
  }

return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.06] via-transparent to-accent/[0.06] pointer-events-none"/>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-accent/[0.08] rounded-full blur-[140px] pointer-events-none"/>

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-9">
          <div className="w-14 h-14 rounded-apple bg-accent flex items-center justify-center mx-auto mb-5 shadow-apple-lg">
            <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
              <path d="M3 10 L8 4" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M8 4 L13 10" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round"/>
              <circle cx="3" cy="10" r="1.5" fill="white"/>
              <circle cx="8" cy="4" r="1.5" fill="white"/>
              <circle cx="13" cy="10" r="1.5" fill="rgba(255,255,255,0.6)"/>
              <line x1="3" y1="13" x2="13" y2="13" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-ink-1 text-[26px] font-semibold tracking-tight">Track<span className="text-accent font-normal">fluenca</span></h1>
          <p className="text-ink-3 text-sm mt-2">{isSignup ? 'Account erstellen' : 'Willkommen zurück'}</p>
        </div>

        <div className="bg-surface-2/80 backdrop-blur-xl border border-hairline rounded-apple-lg p-7 space-y-4 shadow-apple">
          {isSignup && (
            <div>
              <label className="text-ink-3 text-xs block mb-1.5 font-medium">Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full bg-surface-0/80 border border-hairline rounded-apple-sm px-3.5 py-3 text-ink-1 text-sm focus:outline-none focus:border-accent/60 focus:ring-4 focus:ring-accent/10 transition-all duration-200 ease-apple"
                placeholder="Max Mustermann" />
            </div>
          )}

          <div>
            <label className="text-ink-3 text-xs block mb-1.5 font-medium">E-Mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-surface-0/80 border border-hairline rounded-apple-sm px-3.5 py-3 text-ink-1 text-sm focus:outline-none focus:border-accent/60 focus:ring-4 focus:ring-accent/10 transition-all duration-200 ease-apple"
              placeholder="deine@email.com" onKeyDown={e => e.key === 'Enter' && handle()} />
          </div>

          <div>
            <label className="text-ink-3 text-xs block mb-1.5 font-medium">Passwort</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-surface-0/80 border border-hairline rounded-apple-sm px-3.5 py-3 text-ink-1 text-sm focus:outline-none focus:border-accent/60 focus:ring-4 focus:ring-accent/10 transition-all duration-200 ease-apple"
              placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handle()} />
            {isSignup && <p className="text-ink-4 text-[11px] mt-1.5">Mindestens 6 Zeichen</p>}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-apple-sm px-3.5 py-2.5">
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-apple-sm px-3.5 py-2.5">
              <p className="text-emerald-400 text-xs">{success}</p>
            </div>
          )}

          <button onClick={handle} disabled={loading || !email || !password || (isSignup && !name)}
            className="w-full py-3 rounded-apple-sm bg-accent text-white text-sm font-medium hover:bg-accent-hover active:scale-[0.98] transition-all duration-200 ease-apple disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 shadow-[0_6px_20px_-4px_rgba(10,132,255,0.55)]">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                {isSignup ? 'Erstellen...' : 'Anmelden...'}
              </span>
            ) : isSignup ? 'Account erstellen' : 'Anmelden'}
          </button>

          <button onClick={() => { setIsSignup(p => !p); setError(''); setSuccess('') }} 
            className="w-full text-ink-3 text-xs hover:text-ink-1 transition-colors duration-200 py-1">
            {isSignup ? 'Bereits einen Account? Anmelden' : 'Noch kein Account? Registrieren'}
          </button>
        </div>

        <p className="text-center text-ink-4 text-[11px] mt-7 leading-relaxed">
          Mit der Registrierung akzeptierst du unsere <a href="/agb" className="text-ink-3 hover:text-ink-1 transition-colors">AGB</a> und <a href="/datenschutz" className="text-ink-3 hover:text-ink-1 transition-colors">Datenschutzerklärung</a>
        </p>
      </div>
    </div>
  )
}
