import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch(
      'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=59.9439&lon=10.747',
      {
        headers: {
          'User-Agent': 'Gartner/1.0 github.com/Simowi/Gartner',
        },
        next: { revalidate: 3600 }
      }
    )
    const data = await res.json()

    const dagligData: Record<string, { maks: number; min: number; nedbør: number; kode: string }> = {}

    for (const tidspunkt of data.properties.timeseries) {
      const dato = tidspunkt.time.split('T')[0]
      const detaljer = tidspunkt.data.instant.details
      const temp = detaljer.air_temperature

      if (!dagligData[dato]) {
        dagligData[dato] = { maks: temp, min: temp, nedbør: 0, kode: '' }
      }

      dagligData[dato].maks = Math.max(dagligData[dato].maks, temp)
      dagligData[dato].min = Math.min(dagligData[dato].min, temp)

      const nesteTime = tidspunkt.data.next_1_hours || tidspunkt.data.next_6_hours
      if (nesteTime) {
        dagligData[dato].nedbør += nesteTime.details.precipitation_amount || 0
        if (!dagligData[dato].kode && nesteTime.summary?.symbol_code) {
          dagligData[dato].kode = nesteTime.summary.symbol_code
        }
      }
    }

    const dager = Object.entries(dagligData)
      .slice(0, 14)
      .map(([dato, v]) => ({
        dato,
        maks: Math.round(v.maks),
        min: Math.round(v.min),
        nedbør: Math.round(v.nedbør * 10) / 10,
        kode: v.kode,
      }))

    return NextResponse.json({ dager }, {
      headers: {
        'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200',
      }
    })
  } catch (e) {
    console.error('Vær-feil:', e)
    return NextResponse.json({ feil: 'Kunne ikke hente vær' }, { status: 500 })
  }
}
