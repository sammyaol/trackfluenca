import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!
const TT_HOST = 'tiktok-api23.p.rapidapi.com'

function isTikTokLink(link: string) {
  return /tiktok\.com/i.test(link || '')
}

// Laedt ein TikTok-Video (ohne Wasserzeichen) automatisch in die Reels-Sektion,
// wenn ein neues Kooperations-Posting bei einem Creator hinzugefuegt wird.
export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const { data: { user } } = token ? await supabase.auth.getUser(token) : { data: { user: null } }
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { postLink, creatorId } = await req.json()
  if (!postLink || !isTikTokLink(postLink)) {
    return NextResponse.json({ skipped: true, reason: 'Kein TikTok-Link' }, { status: 200 })
  }

  try {
    // Bereits importiert? -> nur Creator verknuepfen falls noch nicht geschehen
    const { data: existing } = await supabase.from('reels').select('id, creator_ids').eq('source_link', postLink).maybeSingle()
    if (existing) {
      if (creatorId && !(existing.creator_ids || []).includes(creatorId)) {
        const newIds = [...(existing.creator_ids || []), creatorId]
        await supabase.from('reels').update({ creator_ids: newIds }).eq('id', existing.id)
      }
      return NextResponse.json({ alreadyImported: true, id: existing.id })
    }

    // Download-URL (ohne Wasserzeichen) von TikTok holen
    const dlRes = await fetch(`https://${TT_HOST}/api/download/video?url=${encodeURIComponent(postLink)}`, {
      headers: { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': TT_HOST },
    })
    if (!dlRes.ok) return NextResponse.json({ error: `TikTok Download-API Fehler ${dlRes.status}` }, { status: 502 })
    const dlJson = await dlRes.json()
    const videoUrl = dlJson.play || dlJson.play_watermark
    if (!videoUrl) return NextResponse.json({ error: 'Keine Video-URL erhalten' }, { status: 502 })

    // Video-Bytes laden
    const videoRes = await fetch(videoUrl)
    if (!videoRes.ok) return NextResponse.json({ error: 'Video konnte nicht heruntergeladen werden' }, { status: 502 })
    const buf = Buffer.from(await videoRes.arrayBuffer())

    // In Supabase Storage hochladen
    const path = `${user.id}/auto-${crypto.randomUUID()}.mp4`
    const { error: upErr } = await supabase.storage.from('reels').upload(path, buf, { contentType: 'video/mp4' })
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
    const { data: urlData } = supabase.storage.from('reels').getPublicUrl(path)

    // In Reels-Tabelle eintragen
    const title = (dlJson.title || dlJson.desc || 'Kooperationsvideo').toString().slice(0, 120)
    const { data, error } = await supabase.from('reels').insert([{
      user_id: user.id,
      title,
      category: null,
      video_type: 'kooperation',
      video_path: path,
      video_url: urlData.publicUrl,
      creator_ids: creatorId ? [creatorId] : [],
      source_link: postLink,
    }]).select().single()

    if (error) {
      // Duplikat-Race (unique index auf source_link) -> kein harter Fehler
      if (error.code === '23505') return NextResponse.json({ alreadyImported: true })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unbekannter Fehler beim Auto-Import' }, { status: 500 })
  }
}
