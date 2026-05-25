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

  const handleGoogle = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/creator' }
    })
    if (error) {
      setError(error.message)
      setLoading(false)
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
          <button onClick={handleGoogle} disabled={loading}
            className="w-full py-2.5 rounded-xl bg-white text-black text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
            </svg>
            Mit Google anmelden
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/[0.06]"/>
            <span className="text-gray-600 text-xs">oder</span>
            <div className="flex-1 h-px bg-white/[0.06]"/>
          </div>

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
