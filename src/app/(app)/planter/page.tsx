'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Leaf, Plus, Droplets } from 'lucide-react'

interface Plante {
  id: string
  navn: string
  art: string
  plassering: string
  neste_vanning: string
  bilde_url: string
}

export default function PlanterPage() {
  const [planter, setPlanter] = useState<Plante[]>([])
  const [laster, setLaster] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function hentPlanter() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('planter')
        .select('*')
        .eq('bruker_id', user.id)
        .order('plassering', { ascending: true })
      if (data) setPlanter(data)
      setLaster(false)
    }
    hentPlanter()
  }, [])

  if (laster) return (
    <div style={{ paddingTop: '52px', paddingBottom: '32px' }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .skeleton { background: linear-gradient(90deg, #f0ece3 25%, #e8e4db 50%, #f0ece3 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 12px; }
      `}</style>
      <div className="skeleton" style={{ width: '140px', height: '36px', marginBottom: '24px' }} />
      {[1,2,3,4,5].map(i => (
        <div key={i} className="skeleton" style={{ width: '100%', height: '72px', marginBottom: '10px' }} />
      ))}
    </div>
  )

  const dagTilVanning = (dato: string) => {
    if (!dato) return null
    const diff = Math.ceil((new Date(dato).getTime() - Date.now()) / 86400000)
    if (diff < 0) return 'Forfalt!'
    if (diff === 0) return 'I dag'
    if (diff === 1) return 'I morgen'
    return 'Om ' + diff + ' dager'
  }

  const grupperPerRom = (planter: Plante[]) => {
    const grupper: Record<string, Plante[]> = {}
    for (const plante of planter) {
      const rom = plante.plassering || 'Uten plassering'
      if (!grupper[rom]) grupper[rom] = []
      grupper[rom].push(plante)
    }
    return Object.entries(grupper).sort(([a], [b]) => {
      if (a === 'Uten plassering') return 1
      if (b === 'Uten plassering') return -1
      return a.localeCompare(b, 'nb')
    })
  }

  const miniatyrbilde = (url: string) => url + '?width=104&height=104&resize=cover'

  return (
    <div style={{ paddingTop: '52px', paddingBottom: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '36px' }}>
        <div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: '#4a7c59', marginBottom: '6px', textTransform: 'uppercase' }}>
            Samlingen din
          </p>
          <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '42px', fontWeight: 800, color: '#1c1c18', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Planter
          </h1>
        </div>
        <a href="/planter/ny" style={{ width: '44px', height: '44px', borderRadius: '14px', backgroundColor: '#154212', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0, marginTop: '8px' }}>
          <Plus size={20} color="white" />
        </a>
      </div>

      {planter.length === 0 ? (
        <div style={{ borderRadius: '20px', padding: '48px 24px', textAlign: 'center', backgroundColor: '#f0ece3' }}>
          <Leaf size={40} color="#c4c0b7" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '18px', fontWeight: 700, color: '#1c1c18', marginBottom: '8px' }}>
            Ingen planter ennå
          </h3>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4a4a42', marginBottom: '20px' }}>
            Legg til din første plante for å komme i gang
          </p>
          <a href="/planter/ny" style={{ display: 'inline-block', padding: '12px 24px', borderRadius: '12px', backgroundColor: '#154212', color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '14px', fontWeight: 700, textDecoration: 'none' }}>
            Legg til plante
          </a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {grupperPerRom(planter).map(([rom, romPlanter]) => (
            <div key={rom}>

              {/* Seksjonsoverskrift */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4a7c59', flexShrink: 0 }}>
                  {rom}
                </p>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e8e4db' }} />
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#c4c0b7', flexShrink: 0 }}>
                  {romPlanter.length} {romPlanter.length === 1 ? 'plante' : 'planter'}
                </p>
              </div>

              {/* Plantekort */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {romPlanter.map((plante) => (
                  <a key={plante.id} href={'/planter/' + plante.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '16px', padding: '14px', backgroundColor: '#f0ece3', textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '52px', height: '52px', borderRadius: '14px', backgroundColor: '#d4e8d0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {plante.bilde_url ? (
                          <img src={miniatyrbilde(plante.bilde_url)} alt={plante.navn} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                        ) : (
                          <Leaf size={20} color="#154212" />
                        )}
                      </div>
                      <div>
                        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '15px', fontWeight: 700, color: '#1c1c18', marginBottom: '2px' }}>
                          {plante.navn}
                        </p>
                        {plante.art && (
                          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#4a4a42', fontStyle: 'italic' }}>
                            {plante.art}
                          </p>
                        )}
                      </div>
                    </div>
                    {plante.neste_vanning && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                        <Droplets size={13} color="#4a7c59" />
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 500, color: '#4a7c59' }}>
                          {dagTilVanning(plante.neste_vanning)}
                        </span>
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
