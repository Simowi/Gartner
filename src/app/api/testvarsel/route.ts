export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const urlAuth = request.nextUrl.searchParams.get('auth')
  
  // Tillater nå både vanlig passord og URL-passord for testing
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && urlAuth !== process.env.CRON_SECRET) {
    return NextResponse.json({ feil: 'Ikke autorisert' }, { status: 401 })
  }

  try {
    const varsler = [{ tittel: '🚀 Test-varsel!', melding: 'Dette er en manuell test av hage-varslene dine.' }]
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: abonnementer } = await supabase.from('push_abonnementer').select('*')

    const webpush = await import('web-push')
    webpush.default.setVapidDetails('mailto:sivertmw@gmail.com', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!)

    for (const sub of abonnementer || []) {
      await webpush.default.sendNotification(sub.abonnement, JSON.stringify({ title: varsler[0].tittel, body: varsler[0].melding }))
    }
    return NextResponse.json({ suksess: true, melding: 'Varsel sendt til alle enheter!' })
  } catch (e) {
    return NextResponse.json({ feil: 'Feil ved utsending' }, { status: 500 })
  }
}
