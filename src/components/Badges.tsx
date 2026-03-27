'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

interface Badge {
  id: string
  ikon: string
  navn: string
  beskrivelse: string
  oppnådd: boolean
  dato?: string
}

function Confetti() {
  const farger = ['#ffd700', '#ff69b4', '#98fb98', '#87ceeb', '#dda0dd', '#ffa500']
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, pointerEvents: 'none' }}>
      {Array.from({ length: 30 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: Math.random() * 100 + '%',
          top: '-10px',
          width: '8px',
          height: '8px',
          backgroundColor: farger[Math.floor(Math.random() * farger.length)],
          borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          animation: `confetti-fall ${1 + Math.random()}s ease-in ${Math.random() * 0.5}s forwards`,
        }} />
      ))}
    </div>
  )
}

export default function Badges() {
  const [badges, setBadges] = useState<Badge[]>([])
  const [nyBadge, setNyBadge] = useState<Badge | null>(null)
  const [visConfetti, setVisConfetti] = useState(false)
  const [laster, setLaster] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    sjekkBadges()
  }, [])

  async function sjekkBadges() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [
      { data: planter },
      { data: vanninger },
      { data: tidslinje },
    ] = await Promise.all([
      supabase.from('planter').select('id, rom, opprettet_at').eq('bruker_id', user.id),
      supabase.from('vanningslogg').select('vannet_at').order('vannet_at', { ascending: false }),
      supabase.from('plante_tidslinje').select('id').eq('bruker_id', user.id),
    ])

    const antallPlanter = planter?.length ?? 0
    const antallRom = new Set(planter?.map(p => p.rom).filter(Boolean)).size
    const antallVanninger = vanninger?.length ?? 0
    const harTidslinjeBilde = (tidslinje?.length ?? 0) > 0

    // Streak-beregning
    let streak = 0
    if (vanninger && vanninger.length > 0) {
      const datoer = new Set(vanninger.map(v => new Date(v.vannet_at).toISOString().split('T')[0]))
      const dag = new Date()
      while (datoer.has(dag.toISOString().split('T')[0]) && streak < 30) {
        streak++
        dag.setDate(dag.getDate() - 1)
      }
    }

    // Dager siden registrering
    const førstePlanteDato = planter && planter.length > 0 
      ? new Date(planter.sort((a,b) => new Date(a.opprettet_at).getTime() - new Date(b.opprettet_at).getTime())[0].opprettet_at)
      : null
    const dagerSidenStart = førstePlanteDato 
      ? Math.floor((Date.now() - førstePlanteDato.getTime()) / 86400000) 
      : 0

    const alleBadges: Badge[] = [
      {
        id: 'første-plante',
        ikon: '🌱',
        navn: 'Første steg',
        beskrivelse: 'La til sin første plante',
        oppnådd: antallPlanter >= 1,
      },
      {
        id: 'grønn-tommel',
        ikon: '🪴',
        navn: 'Grønn tommel',
        beskrivelse: 'Har 3 planter i samlingen',
        oppnådd: antallPlanter >= 3,
      },
      {
        id: 'samler',
        ikon: '🌿',
        navn: 'Samler',
        beskrivelse: 'Har 5 planter i samlingen',
        oppnådd: antallPlanter >= 5,
      },
      {
        id: 'entusiast',
        ikon: '🌻',
        navn: 'Hageentusiast',
        beskrivelse: 'Har 10 planter i samlingen',
        oppnådd: antallPlanter >= 10,
      },
      {
        id: 'jungelkonge',
        ikon: '🌴',
        navn: 'Jungelkonge',
        beskrivelse: 'Har 15 planter i samlingen',
        oppnådd: antallPlanter >= 15,
      },
      {
        id: 'romorganisator',
        ikon: '🏡',
        navn: 'Romorganisator',
        beskrivelse: 'Planter i 3 ulike rom',
        oppnådd: antallRom >= 3,
      },
      {
        id: 'full-bolig',
        ikon: '🏠',
        navn: 'Full bolig',
        beskrivelse: 'Planter i 5 ulike rom',
        oppnådd: antallRom >= 5,
      },
      {
        id: 'første-vanning',
        ikon: '💧',
        navn: 'Første vanning',
        beskrivelse: 'Registrerte første vanning',
        oppnådd: antallVanninger >= 1,
      },
      {
        id: 'tre-dager',
        ikon: '🔥',
        navn: '3 dager i rute',
        beskrivelse: 'Vannet 3 dager på rad',
        oppnådd: streak >= 3,
      },
      {
        id: 'dedikert',
        ikon: '🌳',
        navn: 'Dedikert gartner',
        beskrivelse: 'Vannet 7 dager på rad',
        oppnådd: streak >= 7,
      },
      {
        id: 'vanningsvenn',
        ikon: '🌊',
        navn: 'Vanningsvenn',
        beskrivelse: 'Vannet 14 dager på rad',
        oppnådd: streak >= 14,
      },
      {
        id: 'vannmester',
        ikon: '🏆',
        navn: 'Vannmester',
        beskrivelse: 'Vannet 30 dager på rad',
        oppnådd: streak >= 30,
      },
      {
        id: 'fotografen',
        ikon: '📸',
        navn: 'Fotografen',
        beskrivelse: 'Lastet opp første bilde til tidslinje',
        oppnådd: harTidslinjeBilde,
      },
      {
        id: 'historiker',
        ikon: '🎞️',
        navn: 'Historiker',
        beskrivelse: '5 bilder i tidslinje',
        oppnådd: (tidslinje?.length ?? 0) >= 5,
      },
      {
        id: 'dokumentarist',
        ikon: '📽️',
        navn: 'Dokumentarist',
        beskrivelse: '10 bilder i tidslinje',
        oppnådd: (tidslinje?.length ?? 0) >= 10,
      },
      {
        id: 'jubilant',
        ikon: '🎂',
        navn: 'Jubilant',
        beskrivelse: 'Brukt appen i 30 dager',
        oppnådd: dagerSidenStart >= 30,
      },
      {
        id: 'trofast',
        ikon: '💚',
        navn: 'Trofaste',
        beskrivelse: 'Brukt appen i 90 dager',
        oppnådd: dagerSidenStart >= 90,
      },
    ]

    // Sjekk om nye badges er oppnådd siden sist
    const tidligereLåst = JSON.parse(localStorage.getItem('oppnådde-badges') || '[]')
    const nyttOppnådd = alleBadges.find(b => b.oppnådd && !tidligereLåst.includes(b.id))

    if (nyttOppnådd) {
      setNyBadge(nyttOppnådd)
      setVisConfetti(true)
      localStorage.setItem('oppnådde-badges', JSON.stringify([
        ...tidligereLåst,
        ...alleBadges.filter(b => b.oppnådd).map(b => b.id)
      ]))
      setTimeout(() => {
        setVisConfetti(false)
        setTimeout(() => setNyBadge(null), 400)
      }, 3000)
    } else {
      localStorage.setItem('oppnådde-badges', JSON.stringify(
        alleBadges.filter(b => b.oppnådd).map(b => b.id)
      ))
    }

    setBadges(alleBadges)
    setLaster(false)
  }

  if (laster) return null

  const oppnådde = badges.filter(b => b.oppnådd)
  const ikkeOppnådde = badges.filter(b => !b.oppnådd)

  return (
    <>
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes badge-inn {
          0% { opacity: 0; transform: scale(0.5) translateY(20px); }
          60% { transform: scale(1.1) translateY(-5px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes badge-ut {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.8) translateY(10px); }
        }
      `}</style>

      {visConfetti && <Confetti />}

      {nyBadge && (
        <div style={{ position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)', zIndex: 400, backgroundColor: 'white', borderRadius: '20px', padding: '20px 28px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', textAlign: 'center', animation: 'badge-inn 0.5s ease-out', minWidth: '240px' }}>
          <p style={{ fontSize: '48px', marginBottom: '8px' }}>{nyBadge.ikon}</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4a7c59', marginBottom: '4px' }}>Ny prestasjon!</p>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '18px', fontWeight: 800, color: '#1c1c18', marginBottom: '4px' }}>{nyBadge.navn}</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#4a4a42' }}>{nyBadge.beskrivelse}</p>
        </div>
      )}

      <div style={{ marginBottom: '32px' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4a7c59', marginBottom: '6px' }}>
          Prestasjoner
        </p>
        <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '22px', fontWeight: 800, color: '#1c1c18', letterSpacing: '-0.02em', marginBottom: '16px' }}>
          {oppnådde.length} av {badges.length} oppnådd
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {oppnådde.map(b => (
            <div key={b.id} style={{ borderRadius: '16px', padding: '16px', backgroundColor: '#f0ece3', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <p style={{ fontSize: '28px' }}>{b.ikon}</p>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '13px', fontWeight: 700, color: '#1c1c18' }}>{b.navn}</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#4a4a42', lineHeight: 1.4 }}>{b.beskrivelse}</p>
            </div>
          ))}
          {ikkeOppnådde.map(b => (
            <div key={b.id} style={{ borderRadius: '16px', padding: '16px', backgroundColor: '#f7f4ed', display: 'flex', flexDirection: 'column', gap: '6px', opacity: 0.5 }}>
              <p style={{ fontSize: '28px', filter: 'grayscale(1)' }}>{b.ikon}</p>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '13px', fontWeight: 700, color: '#1c1c18' }}>{b.navn}</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#4a4a42', lineHeight: 1.4 }}>{b.beskrivelse}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
