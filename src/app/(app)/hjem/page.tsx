'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Droplets, Leaf, Sun } from 'lucide-react'

interface Plante {
  id: string
  navn: string
  art: string
  neste_vanning: string
  bilde_url: string
}

export default function HjemPage() {
  const [planter, setPlanter] = useState<Plante[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function hentData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('planter')
        .select('*')
        .eq('bruker_id', user.id)
        .order('neste_vanning', { ascending: true })
        .limit(5)
      if (data) setPlanter(data)
    }
    hentData()
  }, [])

  const dagTilVanning = (dato: string) => {
    if (!dato) return null
    const diff = Math.ceil((new Date(dato).getTime() - Date.now()) / 86400000)
    if (diff < 0) return 'Forfalt!'
    if (diff === 0) return 'I dag'
    if (diff === 1) return 'I morgen'
    return `Om ${diff} dager`
  }

  const tips = [
    'Sjekk jordfuktigheten før du vanner – stikk fingeren 2–3 cm ned i jorda.',
    'Tørk støv av bladene jevnlig så planten kan puste ordentlig.',
    'Norsk vinter betyr hvileperiode – vann sjeldnere fra oktober til februar.',
    'Kalkholdig Oslo-vann kan svi bladspissene. La vannet stå natten over.',
    'De fleste stueplanter trives best mellom 18–24°C.',
  ]

  const dagensTips = tips[new Date().getDay() % tips.length]

  return (
    <div style={{ paddingTop: '52px', paddingBottom: '32px' }}>

      {/* Header */}
      <div style={{ marginBottom: '36px' }}>
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.12em',
          color: '#4a7c59',
          marginBottom: '6px',
          textTransform: 'uppercase',
        }}>
          God dag
        </p>
        <h1 style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: '42px',
          fontWeight: 800,
          color: '#1c1c18',
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
        }}>
          Din hage
        </h1>
      </div>

      {/* Dagens tips kort */}
      <div style={{
        borderRadius: '20px',
        padding: '20px',
        marginBottom: '32px',
        background: 'linear-gradient(135deg, #154212 0%, #2d5a27 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Sun size={13} color="rgba(255,255,255,0.6)" />
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.6)',
          }}>
            Dagens tips
          </p>
        </div>
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          lineHeight: 1.6,
          color: 'rgba(255,255,255,0.92)',
        }}>
          {dagensTips}
        </p>
      </div>

      {/* Vanning snart */}
      <div>
        <h2 style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: '22px',
          fontWeight: 700,
          color: '#1c1c18',
          marginBottom: '16px',
          letterSpacing: '-0.01em',
        }}>
          Trenger vann snart
        </h2>

        {planter.length === 0 ? (
          <div style={{
            borderRadius: '20px',
            padding: '40px 24px',
            textAlign: 'center',
            backgroundColor: '#f0ece3',
          }}>
            <Leaf size={32} color="#c4c0b7" style={{ margin: '0 auto 12px' }} />
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              color: '#4a4a42',
            }}>
              Du har ingen planter ennå.{' '}
              <a href="/planter/ny" style={{ color: '#154212', fontWeight: 600 }}>
                Legg til din første!
              </a>
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {planter.map((plante) => (
              <div
                key={plante.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: '16px',
                  padding: '16px',
                  backgroundColor: '#f0ece3',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    backgroundColor: '#d4e8d0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Leaf size={20} color="#154212" />
                  </div>
                  <div>
                    <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '15px', fontWeight: 600, color: '#1c1c18' }}>
                      {plante.navn}
                    </p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#4a4a42' }}>
                      {plante.art || 'Ukjent art'}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Droplets size={14} color="#4a7c59" />
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 500, color: '#4a7c59' }}>
                    {dagTilVanning(plante.neste_vanning) ?? '–'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
