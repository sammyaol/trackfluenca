import { NextRequest, NextResponse } from 'next/server'

export async function proxy(req: NextRequest) {
    // Die Link-Domain ist komplett oeffentlich (nur Weiterleitungen)
    if ((req.headers.get('host') || '').startsWith('link.')) return NextResponse.next()
    const isPublic = req.nextUrl.pathname.startsWith('/login') || 
                         req.nextUrl.pathname.startsWith('/api') ||
                         req.nextUrl.pathname.startsWith('/r/') ||
                         req.nextUrl.pathname.startsWith('/v/') ||
                         req.nextUrl.pathname.startsWith('/p/') ||
                         req.nextUrl.pathname.startsWith('/w/') ||
                         req.nextUrl.pathname.startsWith('/galerie/') ||
                         req.nextUrl.pathname === '/koluere-logo.png' ||
                         req.nextUrl.pathname.startsWith('/_next')

  if (isPublic) return NextResponse.next()

  // Check for any supabase auth cookie
  const hasCookie = [...req.cookies.getAll()].some(c => 
                                                       c.name.includes('supabase') || c.name.includes('sb-')
                                                     )

  if (!hasCookie) {
        return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
