import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!
const TT_HOST = 'tiktok-api23.p.rapidapi.com'
const IG_HOST = 'flashapi1.p.rapidapi.com'
const ALLOWED_TYPES = ['kooperation', 'kunde', 'beispiel', 'inspo']

function isTikTokLink(link: string) {
  return /tiktok\.com/i.test(link || '')
}
function isInstagramLink(link: string) {
  return /instagram\.com/i.test(link || '')
}
function igShortcode(link: string): string | null {
  const m = link.match(/\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/)
  return m ? m[1] : null
}
function ttVideoId(link: string): string | null {
  const m = link.match(/\/video\/(\d+)/)
  return m ? m[1] : null
}

// Laedt ein TikTok- oder Instagram-Video automatisch in die Reels-Sektion und merkt sich
// den urspruenglichen Account (Handle, Plattform, Follower, Profilbild), damit man die
// Person spaeter direkt anschreiben kann -- auch wenn sie noch kein angelegter Creator ist.
// Wird sowohl automatisch beim Anlegen eines Kooperations-Postings aufgerufen
// (postLink + creatorId) als auch manuell von der Reels-Seite (Link statt Datei-Upload).
export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const { data: { user } } = token ? await supabase.auth.getUser(token) : { data: { user: null } }
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const postLink = (body.postLink || '').trim()
  const creatorIds: string[] = Array.isArray(body.creatorIds)
    ? body.creatorIds
    : (body.creatorId ? [body.creatorId] : [])
  const videoType = ALLOWED_TYPES.includes(body.videoType) ? body.videoType : 'kooperation'
  const category = body.category || null
  const titleOverride = (body.title || '').trim()
  const geschlecht = body.geschlecht || null

  const isTT = isTikTokLink(postLink)
  const isIG = isInstagramLink(postLink)
  if (!isTT && !isIG) {
    return NextResponse.json({ skipped: true, reason: 'Kein Instagram- oder TikTok-Link' }, { status: 200 })
  }

  try {
    // Bereits importiert? -> nur Creator verknuepfen falls noch nicht geschehen
    const { data: existing } = await supabase.from('reels').select('id, creator_ids').eq('source_link', postLink).maybeSingle()
    if (existing) {
      const merged = Array.from(new Set([...(existing.creator_ids || []), ...creatorIds]))
      if (merged.length !== (existing.creator_ids || []).length) {
        await supabase.from('reels').update({ creator_ids: merged }).eq('id', existing.id)
      }
      return NextResponse.json({ alreadyImported: true, id: existing.id })
    }

    let videoUrl: string | null = null
    let title = titleOverride
    let sourceHandle: string | null = null
    let sourcePlatform: string | null = null
    let sourceFollower: number | null = null
    let sourceImage: string | null = null

    if (isTT) {
      const dlRes = await fetch(`https://${TT_HOST}/api/download/video?url=${encodeURIComponent(postLink)}`, {
        headers: { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': TT_HOST },
      })
      if (!dlRes.ok) return NextResponse.json({ error: `TikTok Download-API Fehler ${dlRes.status}` }, { status: 502 })
      const dlJson = await dlRes.json()
      videoUrl = dlJson.play || dlJson.play_watermark || null
      if (!title) title = (dlJson.title || dlJson.desc || 'TikTok-Video').toString().slice(0, 120)

      // Urspruenglichen Account ermitteln (best effort, darf den Import nicht blockieren)
      try {
        const vid = ttVideoId(postLink)
        if (vid) {
          const detailRes = await fetch(`https://${TT_HOST}/api/post/detail?videoId=${encodeURIComponent(vid)}`, {
            headers: { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': TT_HOST },
          })
          if (detailRes.ok) {
            const detailJson = await detailRes.json()
            const author = detailJson?.itemInfo?.itemStruct?.author
            const uniqueId = author?.uniqueId
            if (uniqueId) {
              sourceHandle = uniqueId
              sourcePlatform = 'tiktok'
              sourceImage = author?.avatarThumb || author?.avatarMedium || null
              const infoRes = await fetch(`https://${TT_HOST}/api/user/info?uniqueId=${encodeURIComponent(uniqueId)}`, {
                headers: { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': TT_HOST },
              })
              if (infoRes.ok) {
                const infoJson = await infoRes.json()
                const stats = infoJson?.userInfo?.statsV2 || infoJson?.userInfo?.stats
                const f = parseInt(String(stats?.followerCount ?? ''), 10)
                if (Number.isFinite(f)) sourceFollower = f
                const u = infoJson?.userInfo?.user
                if (u?.avatarThumb || u?.avatarMedium) sourceImage = u.avatarThumb || u.avatarMedium || sourceImage
              }
            }
          }
        }
      } catch {}
    } else {
      const code = igShortcode(postLink)
      if (!code) return NextResponse.json({ error: 'Instagram-Link nicht erkannt. Format: instagram.com/p/... oder /reel/...' }, { status: 400 })
      const igRes = await fetch(`https://${IG_HOST}/ig/post_info/?shortcode=${encodeURIComponent(code)}&nocors=false`, {
        headers: { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': IG_HOST, 'Content-Type': 'application/json' },
      })
      if (!igRes.ok) return NextResponse.json({ error: `Instagram-API Fehler ${igRes.status}` }, { status: 502 })
      const igJson = await igRes.json()
      const it = igJson?.items?.[0]
      if (!it) return NextResponse.json({ error: 'Keine Daten zum Instagram-Post gefunden' }, { status: 404 })
      videoUrl = it.video_versions?.[0]?.url || it.video_url || it.video_dl_url || it.media?.video_url || null
      if (!videoUrl) return NextResponse.json({ error: 'Kein Video an diesem Instagram-Link gefunden (evtl. ein reines Bild-Post)' }, { status: 400 })
      if (!title) title = (it.caption?.text || 'Instagram-Video').toString().slice(0, 120)

      // Urspruenglichen Account ermitteln (best effort, darf den Import nicht blockieren)
      try {
        const username = it.user?.username
        if (username) {
          sourceHandle = username
          sourcePlatform = 'instagram'
          sourceImage = it.user?.profile_pic_url || null
          const profRes = await fetch(`https://${IG_HOST}/ig/info_username/?user=${encodeURIComponent(username)}&nocors=false`, {
            headers: { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': IG_HOST, 'Content-Type': 'application/json' },
          })
          if (profRes.ok) {
            const profJson = await profRes.json()
            const u = profJson?.user || profJson?.data?.user || profJson
            const f = parseInt(String(u?.follower_count ?? ''), 10)
            if (Number.isFinite(f)) sourceFollower = f
            const img = u?.hd_profile_pic_url_info?.url || u?.profile_pic_url
            if (img) sourceImage = img
          }
        }
      } catch {}
    }

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
    const { data, error } = await supabase.from('reels').insert([{
      user_id: user.id,
      title: title || (isIG ? 'Instagram-Video' : 'TikTok-Video'),
      category,
      video_type: videoType,
      video_path: path,
      video_url: urlData.publicUrl,
      creator_ids: creatorIds,
      source_link: postLink,
      geschlecht,
      source_handle: sourceHandle,
      source_platform: sourcePlatform,
      source_follower: sourceFollower,
      source_image: sourceImage,
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
