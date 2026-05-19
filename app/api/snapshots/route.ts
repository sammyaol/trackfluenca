import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { creator_id, ig_follower, tt_follower, ig_avg_likes, ig_er, tt_avg_video_views, tt_er } = await req.json()
  if (!creator_id) return NextResponse.json({ error: 'Missing creator_id' }, { status: 400 })

  // Only save one snapshot per day per creator
  const today = new Date().toISOString().split('T')[0]
  const { data: existing } = await supabase
    .from('creator_snapshots')
    .select('id')
    .eq('creator_id', creator_id)
    .gte('created_at', today)
    .single()

  if (!ig_follower && !tt_follower) return NextResponse.json({ skipped: true })

  if (existing) {
    const { data: ex } = await supabase.from('creator_snapshots').select('ig_follower,tt_follower').eq('id', existing.id).single()
    if (ex && (ex.ig_follower || 0) === 0 && (ex.tt_follower || 0) === 0) {
      await supabase.from('creator_snapshots').update({ ig_follower, tt_follower, ig_avg_likes, ig_er, tt_avg_video_views, tt_er }).eq('id', existing.id)
      return NextResponse.json({ updated: true })
    }
    return NextResponse.json({ skipped: true })
  }

  const { data, error } = await supabase
    .from('creator_snapshots')
    .insert([{ creator_id, ig_follower, tt_follower, ig_avg_likes, ig_er, tt_avg_video_views, tt_er }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const creator_id = searchParams.get('creator_id')
  if (!creator_id) return NextResponse.json([], { status: 200 })

  const { data, error } = await supabase
    .from('creator_snapshots')
    .select('*')
    .eq('creator_id', creator_id)
    .order('created_at', { ascending: true })
    .limit(30)

  if (error) return NextResponse.json([], { status: 200 })
  return NextResponse.json(data)
}
