import { NextRequest, NextResponse } from 'next/server'
import { db, getUser } from '@/lib/ads'

// Filter-Zustand der Ad Library pro Nutzer speichern, damit er auf jedem Geraet und nach jedem Neuladen erhalten bleibt.
export async function GET(req: NextRequest) {
  const user = await getUser(req); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await db.from('ads_settings').select('filters').eq('user_id', user.id).maybeSingle()
  return NextResponse.json({ filters: data?.filters || null, user_id: user.id })
}

export async function PUT(req: NextRequest) {
  const user = await getUser(req); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = await req.json().catch(() => ({}))
  const filters = b && typeof b.filters === 'object' ? b.filters : null
  const { error } = await db.from('ads_settings').upsert({ user_id: user.id, filters, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
