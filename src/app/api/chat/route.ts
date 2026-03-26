import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { melding, historikk } = await request.json()

  const apiNøkkel = process.env.GEMINI_API_KEY
  if (!apiNøkkel) {
    return NextResponse.json({ feil: 'API-nøkkel mangler' }, { status: 500 })
  }

  const systemPrompt = `Du er Gartner-assistenten, en vennlig og kunnskapsrik planteekspert som spesialiserer seg på norske og nordiske forhold. Du hjelper brukere med å ta vare på stueplanter, hageplanter og nordiske planter. Du gir råd tilpasset norsk klima, årstider og lysforhold. Du svarer alltid på norsk, er kortfattet men grundig, og bruker gjerne emojis.`

  const meldinger = [
    ...(historikk || []),
    { role: 'user', parts: [{ text: melding }] }
  ]

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiNøkkel,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: meldinger,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          }
        })
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error('Gemini feil:', JSON.stringify(data))
      return NextResponse.json({ svar: 'Beklager, kunne ikke koble til AI. Feil: ' + JSON.stringify(data?.error?.message || 'ukjent') }, { status: 200 })
    }

    const svar = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Beklager, jeg kunne ikke svare på det.'
    return NextResponse.json({ svar })
  } catch (e) {
    console.error('Uventet feil:', e)
    return NextResponse.json({ svar: 'Beklager, en uventet feil oppstod.' }, { status: 200 })
  }
}
