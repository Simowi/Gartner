'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Leaf } from 'lucide-react'

interface Plante {
  id: string
  navn: string
  bilde_url: string
  plassering: string
}

export default function Plantegalleri() {
  const [planter, setPlanter] = useState<Plante[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function hent() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('planter')
        .select('id, navn, bilde_url, plassering')
        .eq('bruker_id', user.id)
        .order('opprettet_at', { ascending: false })
      if (data) setPlanter(data)
    }
    hent()
  }, [])

  if (planter.length === 0) return null

  return (
    <div style={{ marginBottom: '32px' }}>
      <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '22px', fontWeight: 700, color: '#1c1c18', marginBottom: '14px', letterSpacing: '-0.01em' }}>
        Samlingen din
      </h2>
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '6px' }}>
        {planter.map((plante) => (
          <a key={plante.id} href={'/planter/' + plante.id} style={{ flexShrink: 0, textDecoration: 'none', display: 'block', width: '110px' }}>
            <div style={{ width: '110px', height: '140px', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#d4e8d0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: '6px' }}>
              {plante.bilde_url ? (
                <img src={plante.bilde_url} alt={plante.navn} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Leaf size={32} color="#154212" />
              )}
              {plante.plassering && (
                <div style={{ position: 'absolute', bottom: '6px', left: '6px', backgroundColor: 'rgba(21, 66, 18, 0.75)', borderRadius: '6px', padding: '2px 6px' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: 'white', fontWeight: 600 }}>
                    {plante.plassering}
                  </p>
                </div>
              )}
            </div>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '12px', fontWeight: 700, color: '#1c1c18', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {plante.navn}
            </p>
          </a>
        ))}
      </div>
    </div>
  )
}
