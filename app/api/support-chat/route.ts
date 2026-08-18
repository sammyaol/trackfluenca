import { NextRequest, NextResponse } from 'next/server'

// "Claude Support" - beantwortet Fragen zur App direkt im Interface.
// Benoetigt einen Anthropic API-Key (ANTHROPIC_API_KEY) als Vercel Env-Var.
export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({
      error: 'not_configured',
      message: 'Claude Support ist noch nicht eingerichtet. Es fehlt der ANTHROPIC_API_KEY in den Vercel-Umgebungsvariablen.',
    }, { status: 200 })
  }

  const { messages } = await req.json()
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Keine Nachricht erhalten' }, { status: 400 })
  }

  const systemPrompt = `Du bist "Claude Support", ein hilfreicher Assistent innerhalb von Trackfluenca, einer Influencer-Marketing-Tracking-App fuer Kolure. Du hilfst Nutzern (v.a. Sammy und Philipp), Fragen zur Bedienung der App zu beantworten: Creator- und Celeb-Verwaltung, Discovery, Outreach (Nachrichten, Versand/DHL-Tracking, Sammy/Philipp-Kommentare), Postings & ROAS-Berechnung, und die Reels-Sektion (Kooperationsvideos vs. Beispielvideos, automatischer TikTok-Import). Antworte auf Deutsch, kurz und praktisch. Wenn du eine Frage nicht sicher beantworten kannst, sag das ehrlich, anstatt zu raten.`

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map((m: any) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
      }),
    })
    const j = await r.json()
    if (!r.ok) return NextResponse.json({ error: j?.error?.message || 'Anthropic API Fehler' }, { status: 502 })
    const text = j?.content?.[0]?.text || ''
    return NextResponse.json({ reply: text })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unbekannter Fehler' }, { status: 500 })
  }
}
