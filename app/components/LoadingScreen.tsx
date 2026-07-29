'use client'

export default function LoadingScreen({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-surface-0 flex flex-col items-center justify-center z-50">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent/5 pointer-events-none"/>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px] pointer-events-none"/>

      <div className="relative flex flex-col items-center gap-6">
        {/* Logo mit pulsierendem Hintergrund */}
        <div className="relative">
          <div className="absolute inset-0 bg-accent rounded-apple blur-xl opacity-40 animate-pulse"/>
          <div className="relative w-16 h-16 rounded-apple bg-accent flex items-center justify-center shadow-apple-lg">
            <svg width="28" height="28" viewBox="0 0 16 16" fill="none">
              <path d="M3 10 L8 4" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M8 4 L13 10" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round"/>
              <circle cx="3" cy="10" r="1.5" fill="white"/>
              <circle cx="8" cy="4" r="1.5" fill="white"/>
              <circle cx="13" cy="10" r="1.5" fill="rgba(255,255,255,0.6)"/>
              <line x1="3" y1="13" x2="13" y2="13" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        {/* App Name */}
        <div className="text-center">
          <h1 className="text-ink-1 text-xl font-semibold tracking-tight">
            Track<span className="text-accent font-normal">fluenca</span>
          </h1>
        </div>

        {/* Ladekreis */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-white/[0.08] border-t-accent rounded-full animate-spin"/>
          {message && <span className="text-ink-3 text-xs">{message}</span>}
        </div>
      </div>
    </div>
  )
}
