import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cacheAvatarUrl } from '@/lib/avatarCache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Einmaliger Backfill: cached bestehende IG/TT-Profilbilder dauerhaft in Supabase Storage,
// damit abgelaufene signierte CDN-URLs nicht mehr zu kaputten Profilbildern fuehren.
// Aufruf: /api/admin/backfill-avatars?key=trackfluenca-avatar-backfill-2026
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key')
  if (key !== 'trackfluenca-avatar-backfill-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: creators, error } = await supabase
    .from('creators')
    .select('id, ig_image, tt_image')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let checked = 0
  let cached = 0
  let failed = 0

  for (const c of creators || []) {
    checked++
    const updates: any = {}
    try {
      const newIg = await cacheAvatarUrl(supabase, c.id, c.ig_image, 'ig')
      if (newIg && newIg !== c.ig_image) updates.ig_image = newIg
    } catch { failed++ }
    try {
      const newTt = await cacheAvatarUrl(supabase, c.id, c.tt_image, 'tt')
      if (newTt && newTt !== c.tt_image) updates.tt_image = newTt
    } catch { failed++ }
    if (Object.keys(updates).length) {
      await supabase.from('creators').update(updates).eq('id', c.id)
      cached++
    }
  }

  return NextResponse.json({ checked, cached, failed })
}
