import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_HOSTS = [/\.cdninstagram\.com$/, /\.fbcdn\.net$/]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const target = searchParams.get('url')
  if (!target) return NextResponse.json({ error: 'url fehlt' }, { status: 400 })

  let parsed: URL
  try { parsed = new URL(target) } catch { return NextResponse.json({ error: 'ungueltige url' }, { status: 400 }) }
  if (!ALLOWED_HOSTS.some((re) => re.test(parsed.hostname))) {
    return NextResponse.json({ error: 'host nicht erlaubt' }, { status: 400 })
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/*,*/*;q=0.8',
      },
    })
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: 'upstream fehlgeschlagen' }, { status: 502 })
    }
    const contentType = upstream.headers.get('content-type') || 'image/jpeg'
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    })
  } catch {
    return NextResponse.json({ error: 'proxy fehlgeschlagen' }, { status: 502 })
  }
}
