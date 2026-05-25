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
          emailRedirectTo: window.location.origin + '/creator'
        }
      })
      if (error) {
        setError(error.message === 'User already registered' ? 'Diese E-Mail ist bereits registriert' : error.message)
        setLoading(false)
      } else {
        if (data.session) {
          window.location.href = '/creator'
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
        window.location.href = '/creator'
      }
    }
  }

return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#7F77DD]/5 via-transparent to-[#7F77DD]/5 pointer-events-none"/>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#7F77DD]/10 rounded-full blur-[120px] pointer-events-none"/>

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#7F77DD] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#7F77DD]/30">
            <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
              <path d="M3 10 L8 4" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M8 4 L13 10" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round"/>
              <circle cx="3" cy="10" r="1.5" fill="white"/>
              <circle cx="8" cy="4" r="1.5" fill="white"/>
              <circle cx="13" cy="10" r="1.5" fill="rgba(255,255,255,0.6)"/>
              <line x1="3" y1="13" x2="13" y2="13" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-white text-2xl font-semibold tracking-tight">Track<span className="text-[#7F77DD] font-normal">fluenca</span></h1>
          <p className="text-gray-500 text-sm mt-1.5">{isSignup ? 'Account erstellen' : 'Willkommen zurück'}</p>
        </div>

        <div className="bg-[#141414] border border-white/[0.06] rounded-2xl p-6 space-y-4">
          {isSignup && (
            <div>
              <label className="text-gray-400 text-xs block mb-1.5">Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#7F77DD]/50 transition-colors"
                placeholder="Max Mustermann" />
            </div>
          )}

          <div>
            <label className="text-gray-400 text-xs block mb-1.5">E-Mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#7F77DD]/50 transition-colors"
              placeholder="deine@email.com" onKeyDown={e => e.key === 'Enter' && handle()} />
          </div>

          <div>
            <label className="text-gray-400 text-xs block mb-1.5">Passwort</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#7F77DD]/50 transition-colors"
              placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handle()} />
            {isSignup && <p className="text-gray-600 text-[10px] mt-1">Mindestens 6 Zeichen</p>}
          </div>

          {error && (
            <div className="bg-red-950/30 border border-red-500/20 rounded-lg px-3 py-2">
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-lg px-3 py-2">
              <p className="text-emerald-400 text-xs">{success}</p>
            </div>
          )}

          <button onClick={handle} disabled={loading || !email || !password || (isSignup && !name)}
            className="w-full py-2.5 rounded-xl bg-[#7F77DD] text-white text-sm font-medium hover:bg-[#534AB7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                {isSignup ? 'Erstellen...' : 'Anmelden...'}
              </span>
            ) : isSignup ? 'Account erstellen' : 'Anmelden'}
          </button>

          <button onClick={() => { setIsSignup(p => !p); setError(''); setSuccess('') }} 
            className="w-full text-gray-500 text-xs hover:text-gray-300 transition-colors">
            {isSignup ? 'Bereits einen Account? Anmelden' : 'Noch kein Account? Registrieren'}
          </button>
        </div>

        <p className="text-center text-gray-600 text-[10px] mt-6">
          Mit der Registrierung akzeptierst du unsere <a href="/agb" className="text-gray-500 hover:text-gray-300">AGB</a> und <a href="/datenschutz" className="text-gray-500 hover:text-gray-300">Datenschutzerklärung</a>
        </p>
      </div>
    </div>
  )
}
