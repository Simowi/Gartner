import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { latinskNavn } = await request.json()
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ feil: 'Mangler API-nøkkel' }, { status: 500 })

  try {
    const res = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Hvor mange dager mellom hver gjødsling anbefales for ' + latinskNavn + ' som stueplante i vekstsesong (april-september)? Svar kun med et tall mellom 7 og 60, ingen annen tekst.'
            }]
          }]
        })
      }
    )
    const data = await res.json()
    const tekst = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    const dager = parseInt(tekst)
    if (isNaN(dager) || dager < 7 || dager > 60) {
      return NextResponse.json({ dager: 30 })
    }
    return NextResponse.json({ dager })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ dager: 30 })
  }
}
