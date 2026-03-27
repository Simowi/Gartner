export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'

async function hentVær() {
  const res = await fetch(
    'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=59.9463&lon=10.7488',
    { headers: { 'User-Agent': 'Gartner/1.0 github.com/Simowi/Gartner' } }
  )
  const data = await res.json()
  const dagligData: Record<string, { maks: number; min: number; nedbør: number }> = {}
  for (const t of data.properties.timeseries) {
    const dato = t.time.split('T')[0]
    const temp = t.data.instant.details.air_temperature
    if (!dagligData[dato]) dagligData[dato] = { maks: temp, min: temp, nedbør: 0 }
    dagligData[dato].maks = Math.max(dagligData[dato].maks, temp)
    dagligData[dato].min = Math.min(dagligData[dato].min, temp)
    const neste = t.data.next_1_hours || t.data.next_6_hours
    if (neste) dagligData[dato].nedbør += neste.details.precipitation_amount || 0
  }
  return Object.entries(dagligData).slice(0, 2).map(([dato, v]) => ({
    dato, maks: Math.round(v.maks), min: Math.round(v.min), nedbør: Math.round(v.nedbør * 10) / 10,
  }))
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const urlAuth = request.nextUrl.searchParams.get('auth')
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && urlAuth !== process.env.CRON_SECRET) {
    return NextResponse.json({ feil: 'Ikke autorisert' }, { status: 401 })
  }

  try {
    // 1. Definer varselet (enten fra vær-data eller manuelt test-varsel)
    const dager = await hentVær()
    const iMorgen = dager[1]
    let varsler = []

    // Hvis dette er en manuell test (via URL), lag et test-varsel
    if (urlAuth) {
      varsler.push({ 
        tittel: '🧪 Test-varsel fra Gartner!', 
        melding: 'Dette er en sjekk av logg-systemet. Se den i varslingssenteret!',
        type: 'test'
      })
    } else if (iMorgen && iMorgen.min <= 2) {
      varsler.push({ 
        tittel: '🌡️ Frostvarsel!', 
        melding: `Det er meldt ${iMorgen.min}°C i Løvåsveien. Pass på plantene!`,
        type: 'frost'
      })
    }

    if (varsler.length === 0) return NextResponse.json({ melding: 'Ingen varsler nødvendig.' })

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // 2. Lagre i databasen først
    await supabase.from('varsel_logg').insert(varsler.map(v => ({
      tittel: v.tittel,
      melding: v.melding,
      type: v.type
    })))

    // 3. Send Push
    const { data: abonnementer } = await supabase.from('push_abonnementer').select('*')
    const webpush = await import('web-push')
    webpush.default.setVapidDetails('mailto:sivertmw@gmail.com', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!)

    for (const sub of abonnementer || []) {
      for (const v of varsler) {
        await webpush.default.sendNotification(
          sub.abonnement, 
          JSON.stringify({ 
            title: v.tittel, 
            body: v.melding,
            data: { url: '/varsler' } // Sender brukeren til logg-siden ved klikk
          })
        )
      }
    }
    return NextResponse.json({ suksess: true, varsler })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ feil: 'Feil ved utsending' }, { status: 500 })
  }
}
