import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export default async function VarslingsLogg() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
  )
  const { data: logg } = await supabase
    .from('varsel_logg')
    .select('*')
    .order('opprettet_at', { ascending: false })
    .limit(20)

  function formaterDato(dato: string) {
    return new Date(dato).toLocaleDateString('nb-NO', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  function typeIkon(type: string) {
    if (type?.includes('frost') || type?.includes('frys')) return '🌡️'
    if (type?.includes('regn')) return '🌧️'
    if (type?.includes('hete') || type?.includes('sol')) return '☀️'
    if (type?.includes('vind')) return '💨'
    return '🔔'
  }

  return (
    <div style={{ paddingTop: '52px', paddingBottom: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: '#4a7c59', marginBottom: '6px', textTransform: 'uppercase' }}>
          Historikk
        </p>
        <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '36px', fontWeight: 800, color: '#1c1c18', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          Varsler
        </h1>
      </div>

      {!logg || logg.length === 0 ? (
        <div style={{ borderRadius: '20px', padding: '40px 24px', textAlign: 'center', backgroundColor: '#f0ece3' }}>
          <p style={{ fontSize: '32px', marginBottom: '12px' }}>🔔</p>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '16px', fontWeight: 700, color: '#1c1c18', marginBottom: '6px' }}>
            Ingen varsler ennå
          </p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4a4a42' }}>
            Værvarsler sendes automatisk hver kveld kl. 20:00 hvis det er noe å passe på.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {logg.map((v) => (
            <div key={v.id} style={{ borderRadius: '18px', padding: '18px', backgroundColor: '#f0ece3' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '14px', backgroundColor: '#d4e8d0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '20px' }}>
                  {typeIkon(v.type || v.tittel)}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '15px', fontWeight: 700, color: '#1c1c18', marginBottom: '4px' }}>
                    {v.tittel}
                  </p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#4a4a42', lineHeight: 1.5, marginBottom: '8px' }}>
                    {v.melding}
                  </p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#c4c0b7' }}>
                    {formaterDato(v.opprettet_at)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
