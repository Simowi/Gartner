'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Droplets, Leaf, Sun, Sparkles, Bell } from 'lucide-react'
import { tips } from '@/lib/tips'
import PushVarsler from '@/components/PushVarsler'
import VærStripe from '@/components/VærStripe'
import DagligMelding from '@/components/DagligMelding'
import Minneskrin from '@/components/Minneskrin'
import HjemStatistikk from '@/components/HjemStatistikk'
import Sesongkort from '@/components/Sesongkort'
import Plantegalleri from '@/components/Plantegalleri'
import DeltAktivitet from '@/components/DeltAktivitet'
import InspoGalleri from '@/components/InspoGalleri'

interface Plante {
  id: string
  navn: string
  art: string
  neste_vanning: string
  bilde_url: string
  vanning_intervall_dager: number
}

function hentNavn(epost: string): string {
  if (epost === 'oda.v.lunder@gmail.com') return 'Oda'
  if (epost === 'sivertmw@gmail.com') return 'Sivert'
  return epost.split('@')[0]
}

function hentHilsen(navn: string): string {
  const time = new Date().getHours()
  if (time >= 5 && time < 10) return 'God morgen, ' + navn + '!'
  if (time >= 10 && time < 13) return 'God formiddag, ' + navn + '!'
  if (time >= 13 && time < 17) return 'God ettermiddag, ' + navn + '!'
  if (time >= 17 && time < 22) return 'God kveld, ' + navn + '!'
  return 'God natt, ' + navn + '!'
}

function hentPersonligTittel(epost: string): string {
  if (typeof window === 'undefined') return 'Plantene dine'
  const time = new Date().getHours()
  const dag = new Date().getDay()
  const erHelg = dag === 0 || dag === 5 || dag === 6
  const velg = (liste: string[]) => liste[Math.floor(Math.random() * liste.length)]
  const erOda = epost === 'oda.v.lunder@gmail.com'

  if (!erOda) {
    if (time >= 5 && time < 10) return erHelg ? velg([
      'Helgemorgen i hagen ☀️',
      'Plantene er våkne 🌱',
      'Rolig morgen med grønt 🌿',
    ]) : velg([
      'Plantene dine 🌱',
      'God morgen, hagen 🌿',
      'En ny dag i grønnsaken ☀️',
      'Hva vokser i dag? 🪴',
    ])
    if (time >= 10 && time < 13) return velg([
      'Hagen din 🌿',
      'Samlingen din 🪴',
      'En sjekkerunde? 🌱',
      'Plantene dine ☀️',
      'Grønn formiddag 🌸',
    ])
    if (time >= 13 && time < 18) return velg([
      'Plantene dine 🌿',
      'Ettermiddagen er grønn 🌱',
      'Hagen din venter 🪴',
      'Et grønt øyeblikk ☀️',
      'Samlingen din 🌿',
    ])
    if (time >= 18 && time < 22) return velg([
      'Kveldshagen 🌙',
      'Plantene dine 🌿',
      'En stille kveldsrunde 🕯️',
      'Hagen din i kveld 🌙',
    ])
    return velg([
      'Plantene dine 🌛',
      'Nattehagen 🌙',
      'Sent oppe? 🌿',
    ])
  }

  if (time >= 5 && time < 10) return erHelg ? velg([
    'God helgemorgen, Shnæffen 🌸',
    'Søndagsro og grønne blader 🌿',
    'Lørdag med plantene ☀️',
    'En rolig morgen i hagen 🪴',
    'Kaffe og planter? ☕🌱',
  ]) : velg([
    'God morgen, grønne sjel 🌱',
    'En ny dag for plantene ☀️',
    'Hva vokser i dag? 🌿',
    'Morgenstund har grønne blader 🌸',
    'Dagens første sollys 🌤️',
    'Opp og vann! 💧🌱',
    'Plantene sier god morgen 🌸',
  ])
  if (time >= 10 && time < 13) return erHelg ? velg([
    'Hva blomstrer i dag? 🌸',
    'Helgens grønne øyeblikk 🌿',
    'Litt plantetid? 🪴',
    'Søndag = plantedag 🌱',
    'Kanskje litt vanning? 💧',
  ]) : velg([
    'Hva trenger plantene i dag? 🌿',
    'En liten sjekkerunde 🪴',
    'Midtdagens grønne pause 🌱',
    'Plantene venter på deg 🌸',
    'Er noen tørste? 💧🌿',
    'Grønn formiddag 🌸',
  ])
  if (time >= 13 && time < 18) return erHelg ? velg([
    'Helgens grønne stund ☀️',
    'Ettermiddagsro med plantene 🌿',
    'En rolig helgeettermiddag 🌸',
    'Planteparade? 🪴🌸',
  ]) : velg([
    'Et øyeblikk med plantene ☀️',
    'Ettermiddagsrunden 🌿',
    'Dagens grønne pause 🪴',
    'Litt ro midt i dagen 🌱',
    'Plantene savnet deg 🌸',
    'Grønn ettermiddag ☀️',
  ])
  if (time >= 18 && time < 22) return velg([
    'Kveldsrunden 🌙',
    'God kveld i hagen 🌿',
    'Kveldsstemning 🕯️',
    'Plantene sover snart 🌙',
    'En stille kveld med grønt 🌿',
    'Kveldssjekk 🌿🌙',
    'Nesten leggetid for plantene 🌛',
  ])
  return velg([
    'Sent oppe igjen? 🌛',
    'Nattevakt i hagen 🌙',
    'Stille natt, grønne planter 🌿',
    'Plantene sover – du da? 🌛',
    'Nattehagen 🌙',
  ])
}

export default function HjemPage() {
  const [planter, setPlanter] = useState<Plante[]>([])
  const [laster, setLaster] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [visPlanteTips, setVisPlanteTips] = useState(false)
  const [vannetPlanter, setVannetPlanter] = useState<Set<string>>(new Set())
  const [fjernPlanter, setFjernPlanter] = useState<Set<string>>(new Set())

  useEffect(() => {
    setMounted(true)
    setDagensKort(tips[new Date().getDate() % tips.length])
    const key = 'plante_tips_vist'
    const data = localStorage.getItem(key)
    const na = Date.now()
    if (!data) {
      localStorage.setItem(key, JSON.stringify({ antall: 1, sistVist: na }))
      setTimeout(() => setVisPlanteTips(true), 2000)
    } else {
      const parsed = JSON.parse(data)
      const dagerSiden = (na - parsed.sistVist) / (1000 * 60 * 60 * 24)
      if (parsed.antall < 3 && dagerSiden >= 2) {
        localStorage.setItem(key, JSON.stringify({ antall: parsed.antall + 1, sistVist: na }))
        setTimeout(() => setVisPlanteTips(true), 2000)
      }
    }
  }, [])
  const [hilsen, setHilsen] = useState('')
  const [brukerEpost, setBrukerEpost] = useState('')
  const [tittel, setTittel] = useState('Plantene dine')
  const [profilBilde, setProfilBilde] = useState('')
  const [profilInitial, setProfilInitial] = useState('')
  const [dagensKort, setDagensKort] = useState<typeof tips[0] | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function hentData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const navn = hentNavn(user.email || '')
      setHilsen(hentHilsen(navn))
      const epost = user.email || ''
      setBrukerEpost(epost)
      setTittel(hentPersonligTittel(epost))
      setProfilInitial(navn ? navn[0].toUpperCase() : (user.email || 'G')[0].toUpperCase())

      const [{ data: profil }, { data }] = await Promise.all([
        supabase.from('profiles').select('bilde_url, navn').eq('id', user.id).single(),
        supabase.from('planter').select('*').eq('bruker_id', '4f386062-795a-4853-a34c-2f9023fd83f6').order('neste_vanning', { ascending: true })
      ])
      if (profil?.bilde_url) setProfilBilde(profil.bilde_url)
      if (profil?.navn) setProfilInitial(profil.navn[0].toUpperCase())
      if (data) setPlanter(data)
      setLaster(false)
    }
    hentData()
  }, [])


  async function vannPlante(e: React.MouseEvent, planteId: string, intervall: number) {
    e.preventDefault()
    e.stopPropagation()
    const nå = new Date()
    const nestVanning = new Date()
    nestVanning.setDate(nestVanning.getDate() + intervall)
    await supabase.from('planter').update({
      sist_vannet: nå.toISOString(),
      neste_vanning: nestVanning.toISOString(),
    }).eq('id', planteId)
    await supabase.from('vanningslogg').insert({
      plante_id: planteId,
      bruker_id: '4f386062-795a-4853-a34c-2f9023fd83f6',
      vannet_at: nå.toISOString(),
    })
    setVannetPlanter(prev => new Set([...prev, planteId]))
    setPlanter(prev => prev.map(p => p.id === planteId ? {
      ...p,
      sist_vannet: nå.toISOString(),
      neste_vanning: nestVanning.toISOString(),
    } : p))
    setTimeout(() => {
      setFjernPlanter(prev => new Set([...prev, planteId]))
    }, 1000)
  }

  const dagTilVanning = (dato: string) => {
    if (!dato) return null
    const diff = Math.ceil((new Date(dato).getTime() - Date.now()) / 86400000)
    if (diff < 0) return 'Forfalt!'
    if (diff === 0) return 'I dag'
    if (diff === 1) return 'I morgen'
    return 'Om ' + diff + ' dager'
  }

  if (!mounted || laster) return (
    <div style={{ paddingTop: '52px', paddingBottom: '32px' }}>

      {/* Hilsen skeleton */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <div style={{ background: 'linear-gradient(90deg, #f0ece3 25%, #e8e4db 50%, #f0ece3 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: '12px', width: '120px', height: '12px', marginBottom: '10px' }} />
          <div style={{ background: 'linear-gradient(90deg, #f0ece3 25%, #e8e4db 50%, #f0ece3 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: '12px', width: '200px', height: '40px' }} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ background: 'linear-gradient(90deg, #f0ece3 25%, #e8e4db 50%, #f0ece3 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', width: '44px', height: '44px', borderRadius: '50%' }} />
          <div style={{ background: 'linear-gradient(90deg, #f0ece3 25%, #e8e4db 50%, #f0ece3 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', width: '44px', height: '44px', borderRadius: '50%' }} />
        </div>
      </div>

      {/* Plantliste skeleton */}
      <div style={{ background: 'linear-gradient(90deg, #f0ece3 25%, #e8e4db 50%, #f0ece3 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: '12px', width: '160px', height: '20px', marginBottom: '16px' }} />
      {[1,2,3].map(i => (
        <div key={i} style={{ background: 'linear-gradient(90deg, #f0ece3 25%, #e8e4db 50%, #f0ece3 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: '12px', width: '100%', height: '72px', marginBottom: '10px' }} />
      ))}

      {/* Statistikk skeleton */}
      <div style={{ background: 'linear-gradient(90deg, #f0ece3 25%, #e8e4db 50%, #f0ece3 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: '12px', width: '100px', height: '20px', marginBottom: '16px', marginTop: '32px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ background: 'linear-gradient(90deg, #f0ece3 25%, #e8e4db 50%, #f0ece3 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: '12px', height: '80px' }} />
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ paddingTop: '52px', paddingBottom: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: '#4a7c59', marginBottom: '6px', textTransform: 'uppercase' }}>
            {hilsen}
          </p>
          <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '42px', fontWeight: 800, color: '#1c1c18', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {tittel}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
        <button
          onClick={() => router.push('/varsler')}
          style={{ width: '44px', height: '44px', borderRadius: '50%', border: 'none', backgroundColor: '#f0ece3', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <Bell size={18} color="#4a4a42" />
        </button>
        <button
          onClick={() => router.push('/profil')}
          style={{ width: '44px', height: '44px', borderRadius: '50%', border: 'none', backgroundColor: '#d4e8d0', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          {profilBilde ? (
            <img src={profilBilde} alt="Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '16px', fontWeight: 700, color: '#154212' }}>
              {profilInitial}
            </span>
          )}
        </button>
        </div>
      </div>

      <PushVarsler />
      <DagligMelding />

      <div>
        <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '22px', fontWeight: 700, color: '#1c1c18', marginBottom: '16px', letterSpacing: '-0.01em' }}>
          {'Trenger vann snart'}
        </h2>

        {planter.length === 0 ? (
          <div style={{ borderRadius: '20px', padding: '40px 24px', textAlign: 'center', backgroundColor: '#f0ece3' }}>
            <Leaf size={32} color="#c4c0b7" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4a4a42' }}>
              Du har ingen planter ennå.{' '}
              <a href="/planter/ny" style={{ color: '#154212', fontWeight: 600 }}>Legg til din første!</a>
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {planter.filter(p => !fjernPlanter.has(p.id)).slice(0, 5).map((plante) => (
              <div key={plante.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '16px', padding: '16px', backgroundColor: '#f0ece3', cursor: 'pointer', position: 'relative', animation: vannetPlanter.has(plante.id) && !fjernPlanter.has(plante.id) ? 'none' : fjernPlanter.has(plante.id) ? 'gli-ut 0.5s ease-in forwards' : 'none', overflow: 'hidden' }} onClick={() => !vannetPlanter.has(plante.id) && router.push('/planter/' + plante.id)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#d4e8d0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {plante.bilde_url ? (
                      <img src={plante.bilde_url + '?width=120&height=120&resize=cover'} alt={plante.navn} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                    ) : (
                      <Leaf size={20} color="#154212" />
                    )}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {!vannetPlanter.has(plante.id) && (
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#4a7c59' }}>
                      {dagTilVanning(plante.neste_vanning) ?? '–'}
                    </span>
                  )}
                  <button
                    onClick={(e) => vannPlante(e, plante.id, plante.vanning_intervall_dager)}
                    disabled={vannetPlanter.has(plante.id)}
                    style={{
                      width: '32px', height: '32px', borderRadius: '50%', border: 'none',
                      backgroundColor: vannetPlanter.has(plante.id) ? '#154212' : '#d4e8d0',
                      cursor: vannetPlanter.has(plante.id) ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, transition: 'all 0.3s ease',
                      transform: vannetPlanter.has(plante.id) ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    {vannetPlanter.has(plante.id)
                      ? <span style={{ fontSize: '14px', color: 'white', fontWeight: 700 }}>✓</span>
                      : <Droplets size={14} color="#154212" />
                    }
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={() => router.push('/planter')}
              style={{ width: '100%', padding: '12px', borderRadius: '14px', border: 'none', backgroundColor: '#f0ece3', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#4a4a42', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              Se alle {planter.length} planter →
            </button>
          </div>
        )}

        {dagensKort && (
        <div style={{ borderRadius: '20px', padding: '20px', marginBottom: '32px', marginTop: '24px', background: 'linear-gradient(135deg, #154212 0%, #2d5a27 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            {dagensKort.type === 'fakta' ? (
              <Sparkles size={13} color="rgba(255,255,255,0.6)" />
            ) : (
              <Sun size={13} color="rgba(255,255,255,0.6)" />
            )}
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>
              {dagensKort.type === 'fakta' ? 'Visste du at' : 'Dagens tips'}
            </p>
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', lineHeight: 1.6, color: 'rgba(255,255,255,0.92)' }}>
            {dagensKort.tekst}
          </p>
        </div>
      )}
        <div style={{ marginTop: '32px' }}>
          <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '22px', fontWeight: 700, color: '#1c1c18', marginBottom: '16px', letterSpacing: '-0.01em' }}>
            Din hage
          </h2>
          <HjemStatistikk />
        </div>

        <VærStripe />
        <Plantegalleri />
        <Minneskrin />
        <Sesongkort />
        <InspoGalleri />
        <DeltAktivitet />
      </div>
      {visPlanteTips && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '28px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <p style={{ fontSize: '32px', marginBottom: '12px' }}>🌱</p>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '20px', fontWeight: 800, color: '#1c1c18', marginBottom: '8px' }}>Ikke alle plantene er lagt til ennå</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4a4a42', lineHeight: 1.6, marginBottom: '24px' }}>Trykk på <strong>+</strong>-knappen nederst til høyre for å legge til flere planter i hagen 🪴</p>
            <button onClick={() => setVisPlanteTips(false)} style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', backgroundColor: '#154212', color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>
              Forstått!
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
