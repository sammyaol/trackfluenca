import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('sb-whiomaberauihdwiaaoz-auth-token')?.value
    || req.cookies.get('sb-access-token')?.value

  const isPublic = req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/api')
  
  if (!isPublic && !token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
