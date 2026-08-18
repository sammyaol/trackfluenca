import type { SupabaseClient } from '@supabase/supabase-js'

const EPHEMERAL_HOSTS = [/\.cdninstagram\.com$/, /\.fbcdn\.net$/, /\.tiktokcdn(-us|-eu)?\.com$/, /\.ibyteimg\.com$/, /\.tiktokcdn\.com$/]

function isEphemeral(url: string) {
  try {
    const host = new URL(url).hostname
    return EPHEMERAL_HOSTS.some(re => re.test(host))
  } catch {
    return false
  }
}

// Laedt ein zeitlich begrenztes IG/TikTok-CDN-Bild dauerhaft in Supabase Storage,
// damit es nicht nach ein paar Tagen kaputtgeht (abgelaufene signierte URL).
export async function cacheAvatarUrl(
  supabase: SupabaseClient,
  creatorId: string,
  url: string | undefined | null,
  kind: 'ig' | 'tt'
): Promise<string | undefined> {
  if (!url || !isEphemeral(url)) return url || undefined
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' }
    })
    if (!res.ok) return url
    const buffer = await res.arrayBuffer()
    const path = `${creatorId}-${kind}.jpg`
    const { error } = await supabase.storage.from('avatars').upload(path, buffer, {
      contentType: 'image/jpeg',
      upsert: true,
    })
    if (error) return url
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return data.publicUrl
  } catch {
    return url
  }
}
