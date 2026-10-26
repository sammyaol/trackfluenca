import { NextRequest, NextResponse } from 'next/server'
import { db, getMember } from '@/lib/mklusive'

// Zugang freigeben: nur Admin. Die Person registriert sich selbst unter /login,
// danach wird die E-Mail hier freigeschaltet (es werden keine Passwoerter gesetzt).
export async function POST(req: NextRequest) {
  const m = await getMember(req)
  if (m?.role !== 'admin') return NextResponse.json({ error: 'Nur für Admins' }, { status: 403 })
  const { email } = await req.json().catch(() => ({}))
  const mail = String(email || '').trim().toLowerCase()
  if (!mail.includes('@')) return NextResponse.json({ error: 'Bitte gültige E-Mail eingeben' }, { status: 400 })
  let found: { id: string; email?: string } | null = null
  for (let page = 1; page <= 5 && !found; page++) {
    const { data } = await db.auth.admin.listUsers({ page, perPage: 200 })
    found = data?.users.find(u => (u.email || '').toLowerCase() === mail) || null
    if (!data?.users.length || data.users.length < 200) break
  }
  if (!found) return NextResponse.json({ error: 'Zu dieser E-Mail gibt es noch keinen Account. Bitte zuerst auf trackfluenca.com/login registrieren (und die Bestätigungsmail anklicken), dann hier erneut freigeben.' }, { status: 404 })
  const { error } = await db.from('agency_members').upsert({ user_id: found.id, email: mail, role: 'agency', agency: m.agency }, { onConflict: 'user_id', ignoreDuplicates: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const m = await getMember(req)
  if (m?.role !== 'admin') return NextResponse.json({ error: 'Nur für Admins' }, { status: 403 })
  const { user_id } = await req.json().catch(() => ({}))
  if (!user_id || user_id === m.user.id) return NextResponse.json({ error: 'Nicht möglich' }, { status: 400 })
  await db.from('agency_members').delete().eq('user_id', user_id).eq('agency', m.agency).eq('role', 'agency')
  return NextResponse.json({ ok: true })
}
