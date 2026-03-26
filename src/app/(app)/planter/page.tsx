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
        .order('opprettet_at', { ascending: false })
      if (data) setPlanter(data)
      setLaster(false)
    }
    hentPlanter()
  }, [])

  const dagTilVanning = (dato: string) => {
    if (!dato) return null
    const diff = Math.ceil((new Date(dato).getTime() - Date.now()) / 86400000)
    if (diff < 0) return 'Forfalt!'
    if (diff === 0) return 'I dag'
    if (diff === 1) return 'I morgen'
    return 'Om ' + diff + ' dager'
  }

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

      {laster ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4a4a42' }}>Laster planter...</p>
        </div>
      ) : planter.length === 0 ? (
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {planter.map((plante) => (
            <a key={plante.id} href={'/planter/' + plante.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '20px', padding: '16px', backgroundColor: '#f0ece3', textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#d4e8d0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  {plante.bilde_url ? (
                    <img src={plante.bilde_url} alt={plante.navn} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Leaf size={22} color="#154212" />
                  )}
                </div>
                <div>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '16px', fontWeight: 700, color: '#1c1c18', marginBottom: '2px' }}>
                    {plante.navn}
                  </p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#4a4a42' }}>
                    {plante.art || 'Ukjent art'}{plante.plassering ? ' · ' + plante.plassering : ''}
                  </p>
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
      )}
    </div>
  )
}
