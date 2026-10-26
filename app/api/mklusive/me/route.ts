import { NextRequest, NextResponse } from 'next/server'
import { getMember } from '@/lib/mklusive'

export async function GET(req: NextRequest) {
  const m = await getMember(req)
  if (!m) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ role: m.role })
}
