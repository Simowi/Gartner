export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ feil: 'Ikke autorisert' }, { status: 401 })
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Sjekk om det finnes en ulest melding for i dag
    const iDag = new Date().toISOString().split('T')[0]
    const { data: meldinger } = await supabase
      .from('daglige_meldinger')
      .select('id, dag_nummer')
      .eq('dato', iDag)
      .limit(1)

    if (!meldinger || meldinger.length === 0) {
      return NextResponse.json({ melding: 'Ingen melding i dag' })
    }

    const { data: abonnementer } = await supabase
      .from('push_abonnementer')
      .select('*')

    if (!abonnementer || abonnementer.length === 0) {
      return NextResponse.json({ melding: 'Ingen abonnenter' })
    }

    const webpush = await import('web-push')
    webpush.default.setVapidDetails(
      'mailto:sivertmw@gmail.com',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    )

    let sendt = 0
    for (const abonnement of abonnementer) {
      try {
        await webpush.default.sendNotification(
          abonnement.abonnement,
          JSON.stringify({
            title: '💌 En ny hilsen fra S venter på deg',
            body: 'Trykk for å åpne meldingen din',
            data: { url: '/hjem' }
          })
        )
        sendt++
      } catch (e) {
        console.error('Push-feil:', e)
      }
    }

    return NextResponse.json({ sendt, dato: iDag })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ feil: 'Noe gikk galt' }, { status: 500 })
  }
}
