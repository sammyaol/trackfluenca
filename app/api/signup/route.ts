import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Registrierung ohne E-Mail-Bestaetigung: Account wird direkt als bestaetigt angelegt,
// danach meldet sich der Browser sofort mit E-Mail + Passwort an.
export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json().catch(() => ({}))
  const mail = String(email || '').trim().toLowerCase()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) return NextResponse.json({ error: 'Bitte eine gültige E-Mail eingeben' }, { status: 400 })
  if (typeof password !== 'string' || password.length < 6) return NextResponse.json({ error: 'Passwort muss mindestens 6 Zeichen lang sein' }, { status: 400 })

  const { error } = await admin.auth.admin.createUser({ email: mail, password, email_confirm: true, user_metadata: { name: String(name || '').slice(0, 120) } })
  if (error) {
    const msg = /already|exists|registered/i.test(error.message) ? 'Diese E-Mail ist bereits registriert' : error.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}
