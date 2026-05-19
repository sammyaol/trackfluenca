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
  const [isSignup, setIsSignup] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    setLoading(true)
    setError('')
    const { error } = isSignup
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        localStorage.setItem('sb_token', session.access_token)
      }
      window.location.href = '/creator'
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#7F77DD] flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          <h1 className="text-white text-2xl font-semibold">Trackfluenca</h1>
          <p className="text-gray-500 text-sm mt-1">{isSignup ? 'Account erstellen' : 'Willkommen zurück'}</p>
        </div>
        <div className="bg-[#141414] border border-white/[0.06] rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-gray-400 text-xs block mb-1.5">E-Mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#7F77DD]/50"
              placeholder="deine@email.com" onKeyDown={e => e.key === 'Enter' && handle()} />
          </div>
          <div>
            <label className="text-gray-400 text-xs block mb-1.5">Passwort</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#7F77DD]/50"
              placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handle()} />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button onClick={handle} disabled={loading || !email || !password}
            className="w-full py-2.5 rounded-xl bg-[#7F77DD] text-white text-sm font-medium hover:bg-[#534AB7] transition-colors disabled:opacity-50">
            {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>{isSignup ? 'Erstellen...' : 'Anmelden...'}</span> : isSignup ? 'Account erstellen' : 'Anmelden'}
          </button>
          <button onClick={() => setIsSignup(p => !p)} className="w-full text-gray-500 text-xs hover:text-gray-300 transition-colors">
            {isSignup ? 'Bereits einen Account? Anmelden' : 'Noch kein Account? Registrieren'}
          </button>
        </div>
      </div>
    </div>
  )
}
