export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'

interface VærDag {
  dato: string
  maks: number
  min: number
  nedbør: number
}

async function hentVær(): Promise<VærDag[]> {
  const res = await fetch(
    'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=59.9540&lon=10.7520',
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

  return Object.entries(dagligData).slice(0, 3).map(([dato, v]) => ({
    dato,
    maks: Math.round(v.maks),
    min: Math.round(v.min),
    nedbør: Math.round(v.nedbør * 10) / 10,
  }))
}

function lagVarsler(dager: VærDag[]): { tittel: string; melding: string }[] {
  const varsler: { tittel: string; melding: string }[] = []
  const iMorgen = dager[1]
  if (!iMorgen) return varsler

  if (iMorgen.min <= 0) {
    varsler.push({
      tittel: '🌡️ Frostvarsel i natt!',
      melding: `Det er meldt ${iMorgen.min}°C i natt. Husk å ta inn sarte planter og dekke til bedene!`
    })
  }

  if (iMorgen.nedbør >= 10) {
    varsler.push({
      tittel: '🌧️ Kraftig regn i morgen',
      melding: `Det er meldt ${iMorgen.nedbør}mm nedbør. Ikke vann uteplantene – naturen gjør jobben!`
    })
  }

  if (iMorgen.maks >= 25) {
    varsler.push({
      tittel: '☀️ Hetebølge i morgen!',
      melding: `Det er meldt ${iMorgen.maks}°C. Vann plantene tidlig om morgenen og gi dem skygge på ettermiddagen.`
    })
  }

  const måned = new Date().getMonth()
  const erSårbarSesong = (måned >= 2 && måned <= 4) || (måned >= 8 && måned <= 10)
  if (erSårbarSesong && iMorgen.min <= 2 && !varsler.find(v => v.tittel.includes('Frost'))) {
    varsler.push({
      tittel: '🥶 Nær frysepunktet i natt',
      melding: `${iMorgen.min}°C er meldt – pass på sarte vår/høstplanter og ta inn potteplanter.`
    })
  }

  return varsler
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ feil: 'Ikke autorisert' }, { status: 401 })
  }

  try {
    const dager = await hentVær()
    const varsler = lagVarsler(dager)

    if (varsler.length === 0) {
      return NextResponse.json({ melding: 'Ingen varsler i dag', dager })
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: abonnementer } = await supabase
      .from('push_abonnementer')
      .select('*')

    if (!abonnementer || abonnementer.length === 0) {
      return NextResponse.json({ melding: 'Ingen abonnenter', varsler })
    }

    const webpush = await import('web-push')
    webpush.default.setVapidDetails(
      'mailto:sivertmw@gmail.com',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    )

    let sendt = 0
    for (const abonnement of abonnementer) {
      for (const varsel of varsler) {
        try {
          await webpush.default.sendNotification(
            abonnement.abonnement,
            JSON.stringify({ title: varsel.tittel, body: varsel.melding })
          )
          sendt++
        } catch (e) {
          console.error('Push-feil:', e)
        }
      }
    }

    return NextResponse.json({ sendt, varsler })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ feil: 'Noe gikk galt' }, { status: 500 })
  }
}
