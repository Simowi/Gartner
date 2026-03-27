'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Droplets } from 'lucide-react'

interface Aktivitet {
  planteNavn: string
  vannetAv: string
  tidSiden: string
  profilBilde: string
  initial: string
}

function tidSiden(dato: string): string {
  const diff = Math.floor((Date.now() - new Date(dato).getTime()) / 60000)
  if (diff < 1) return 'akkurat nå'
  if (diff < 60) return 'for ' + diff + ' min siden'
  const timer = Math.floor(diff / 60)
  if (timer < 24) return 'for ' + timer + ' t siden'
  const dager = Math.floor(timer / 24)
  if (dager === 1) return 'i går'
  return 'for ' + dager + ' dager siden'
}

const KJENTE_BRUKERE: Record<string, { navn: string }> = {
  'oda.v.lunder@gmail.com': { navn: 'Oda' },
  'sivertmw@gmail.com': { navn: 'Sivert' },
}

export default function DeltAktivitet() {
  const [aktiviteter, setAktiviteter] = useState<Aktivitet[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function hent() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: logg } = await supabase
        .from('vanningslogg')
        .select('vannet_at, plante_id')
        .order('vannet_at', { ascending: false })
        .limit(20)

      if (!logg || logg.length === 0) return

      const planteIds = [...new Set(logg.map(l => l.plante_id))]
      const { data: planter } = await supabase
        .from('planter')
        .select('id, navn, bruker_id')
        .in('id', planteIds)

      if (!planter) return

      const brukerIds = [...new Set(planter.map(p => p.bruker_id))]
      const { data: profiler } = await supabase
        .from('profiles')
        .select('id, navn, bilde_url')
        .in('id', brukerIds)



      const result: Aktivitet[] = []
      for (const innslag of logg.slice(0, 5)) {
        const plante = planter.find(p => p.id === innslag.plante_id)
        if (!plante) continue
        if (plante.bruker_id === user.id) continue

        const profil = profiler?.find(p => p.id === plante.bruker_id)
        const navn = profil?.navn || 'Noen'
        const initial = navn[0].toUpperCase()

        result.push({
          planteNavn: plante.navn,
          vannetAv: navn,
          tidSiden: tidSiden(innslag.vannet_at),
          profilBilde: profil?.bilde_url || '',
          initial,
        })
      }

      setAktiviteter(result)
    }
    hent()
  }, [])

  if (aktiviteter.length === 0) return null

  return (
    <div style={{ marginBottom: '32px' }}>
      <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '22px', fontWeight: 700, color: '#1c1c18', marginBottom: '14px', letterSpacing: '-0.01em' }}>
        Siste aktivitet
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {aktiviteter.map((a, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '14px', padding: '12px 14px', backgroundColor: '#f0ece3' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#d4e8d0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
              {a.profilBilde ? (
                <img src={a.profilBilde} alt={a.vannetAv} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '14px', fontWeight: 700, color: '#154212' }}>{a.initial}</span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#1c1c18', lineHeight: 1.4 }}>
                <span style={{ fontWeight: 700 }}>{a.vannetAv}</span> vannet <span style={{ fontWeight: 700 }}>{a.planteNavn}</span>
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#4a4a42', marginTop: '2px' }}>
                {a.tidSiden}
              </p>
            </div>
            <Droplets size={16} color="#4a7c59" />
          </div>
        ))}
      </div>
    </div>
  )
}
