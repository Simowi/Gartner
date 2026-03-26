import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=59.9439&longitude=10.747&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=Europe/Oslo&forecast_days=7',
      { next: { revalidate: 3600 } }
    )
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ feil: 'Kunne ikke hente vær' }, { status: 500 })
  }
}
