'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-[#2C1F6B] flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M4 12 L12 4" stroke="#0A84FF" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 4 L20 12" stroke="#AFA9EC" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="4" cy="12" r="2" fill="#0A84FF"/>
              <circle cx="12" cy="4" r="2" fill="white"/>
              <circle cx="20" cy="12" r="2" fill="#AFA9EC"/>
              <line x1="4" y1="19" x2="20" y2="19" stroke="#0060DF" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-white text-xl font-bold">Track<span className="text-[#0A84FF] font-normal">fluenca</span></span>
        </div>

        <div className="bg-[#1A1A1A] rounded-2xl p-8 border border-white/10">
          <h1 className="text-white text-lg font-medium mb-1">Anmelden</h1>
          <p className="text-gray-400 text-sm mb-6">Willkommen zurück</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">E-Mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="hello@trackfluenca.com"
                className="w-full bg-[#0E0E0E] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#0A84FF]"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Passwort</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0E0E0E] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#0A84FF]"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#0A84FF] hover:bg-[#0060DF] text-white rounded-xl py-3 text-sm font-medium transition-colors mt-2"
            >
              Anmelden
            </button>
          </form>

          <p className="text-center text-gray-600 text-xs mt-6">
            Demo: beliebige E-Mail + Passwort
          </p>
        </div>
      </div>
    </div>
  )
}
