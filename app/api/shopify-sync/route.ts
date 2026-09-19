import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Manueller Trigger fuer die shopify-analytics-sync Edge Function - dieselbe
// Function, die pg_cron stuendlich aufruft (siehe cron.job "shopify-daily-sync").
// Damit muss man nicht bis zu einer Stunde warten, bis neu eingetragene
// Rabattcodes/Ziellinks ihre Einloesungen, Bestellungen und Umsatz ziehen.
export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const { data: { user } } = token ? await supabase.auth.getUser(token) : { data: { user: null } }
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/shopify-analytics-sync`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    })
    const text = await res.text()
    if (!res.ok) return NextResponse.json({ error: text || 'Sync fehlgeschlagen' }, { status: 502 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Sync fehlgeschlagen' }, { status: 500 })
  }
}
