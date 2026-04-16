import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { bilde, type } = await request.json()

  const apiNøkkel = process.env.PLANT_ID_API_KEY
  if (!apiNøkkel) {
    return NextResponse.json({ feil: 'API-nøkkel mangler' }, { status: 500 })
  }

  try {
    const url = type === 'diagnose'
      ? 'https://plant.id/api/v3/health_assessment?details=local_name,description,treatment&language=no'
      : 'https://plant.id/api/v3/identification?details=common_names,description,watering,image&language=no'

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Api-Key': apiNøkkel,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        images: [bilde],
      })
    })

    const tekst = await res.text()
    console.log('Plant.id status:', res.status)
    console.log('Plant.id svar:', tekst.substring(0, 300))

    if (!res.ok) {
      return NextResponse.json({ feil: 'Plant.id feil: ' + tekst.substring(0, 100) }, { status: 500 })
    }

    const data = JSON.parse(tekst)
    return NextResponse.json(data)
  } catch (e) {
    console.error('Plant.id feil:', e)
    return NextResponse.json({ feil: 'Kunne ikke kontakte Plant.id' }, { status: 500 })
  }
}
