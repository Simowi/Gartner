'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Leaf, Droplets, Flame, Home } from 'lucide-react'

interface Statistikk {
  antallPlanter: number
  antallRom: number
  vanningerSisteMåned: number
  streak: number
}

export default function HjemStatistikk() {
  const [stats, setStats] = useState<Statistikk | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function hentStatistikk() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: planter } = await supabase
        .from('planter')
        .select('id, plassering')
        .eq('bruker_id', user.id)

      if (!planter) return

      const antallPlanter = planter.length
      const rom = new Set(planter.map(p => p.plassering).filter(Boolean))
      const antallRom = rom.size
      const planteIds = planter.map(p => p.id)
      let vanningerSisteMåned = 0
      let streak = 0

      if (planteIds.length > 0) {
        const månedSiden = new Date()
        månedSiden.setDate(månedSiden.getDate() - 30)

        const [{ data: logg }, { data: alleVanninger }] = await Promise.all([
          supabase
            .from('vanningslogg')
            .select('vannet_at')
            .in('plante_id', planteIds)
            .gte('vannet_at', månedSiden.toISOString()),
          supabase
            .from('vanningslogg')
            .select('vannet_at')
            .in('plante_id', planteIds)
            .order('vannet_at', { ascending: false })
            .limit(60)
        ])

        vanningerSisteMåned = logg?.length || 0

        if (alleVanninger && alleVanninger.length > 0) {
          const datoer = new Set(
            alleVanninger.map(v => new Date(v.vannet_at).toISOString().split('T')[0])
          )
          const dag = new Date()
          dag.setHours(0, 0, 0, 0)
          const iDagStr = dag.toISOString().split('T')[0]
          if (datoer.has(iDagStr)) streak++
          dag.setDate(dag.getDate() - 1)
          while (datoer.has(dag.toISOString().split('T')[0]) && streak < 60) {
            streak++
            dag.setDate(dag.getDate() - 1)
          }
        }
      }

      setStats({ antallPlanter, antallRom, vanningerSisteMåned, streak })
    }
    hentStatistikk()
  }, [])

  const skjelett = (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '32px' }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
      {[0,1,2,3].map(i => (
        <div key={i} style={{ borderRadius: '16px', padding: '16px', backgroundColor: '#f0ece3', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(90deg, #e8e4db 25%, #f0ece3 50%, #e8e4db 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', flexShrink: 0 }} />
          <div>
            <div style={{ width: '32px', height: '22px', borderRadius: '6px', background: 'linear-gradient(90deg, #e8e4db 25%, #f0ece3 50%, #e8e4db 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', marginBottom: '6px' }} />
            <div style={{ width: '60px', height: '11px', borderRadius: '4px', background: 'linear-gradient(90deg, #e8e4db 25%, #f0ece3 50%, #e8e4db 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
          </div>
        </div>
      ))}
    </div>
  )

  if (!stats) return skjelett

  const kort = [
    { ikon: <Leaf size={18} color="#154212" />, verdi: String(stats.antallPlanter), label: stats.antallPlanter === 1 ? 'plante' : 'planter' },
    { ikon: <Home size={18} color="#154212" />, verdi: String(stats.antallRom), label: 'rom' },
    { ikon: <Droplets size={18} color="#154212" />, verdi: String(stats.vanningerSisteMåned), label: 'vanninger (30d)' },
    { ikon: <Flame size={18} color={stats.streak > 0 ? '#e67e22' : '#c4c0b7'} />, verdi: String(stats.streak), label: stats.streak === 1 ? 'dag i rute' : 'dager i rute' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '32px' }}>
      {kort.map(({ ikon, verdi, label }) => (
        <div key={label} style={{ borderRadius: '16px', padding: '16px', backgroundColor: '#f0ece3', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#d4e8d0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {ikon}
          </div>
          <div>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '22px', fontWeight: 800, color: '#1c1c18', lineHeight: 1 }}>
              {verdi}
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#4a4a42', marginTop: '2px' }}>
              {label}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
