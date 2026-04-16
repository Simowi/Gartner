'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Droplets } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Plante {
  id: string
  navn: string
  art: string
  plassering: string
  neste_vanning: string
  vanning_intervall_dager: number
  bilde_url: string
}

function PlanteKort({ plante, vannet, onVann, onSlett }: {
  plante: Plante
  vannet: boolean
  onVann: (e: React.MouseEvent, id: string, intervall: number) => void
  onSlett: (id: string) => void
}) {
  const router = useRouter()

  const dagTilVanning = (dato: string) => {
    if (!dato) return null
    const diff = Math.ceil((new Date(dato).getTime() - Date.now()) / 86400000)
    if (diff < 0) return 'Forfalt!'
    if (diff === 0) return 'I dag'
    if (diff === 1) return 'I morgen'
    return 'Om ' + diff + ' dager'
  }

  return (
    <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', height: '72px' }}>
      <div style={{
        display: 'flex',
        overflowX: 'scroll',
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        height: '100%',
        borderRadius: '16px',
      }}>
        <style dangerouslySetInnerHTML={{ __html: '.sveip-scroll::-webkit-scrollbar { display: none; }' }} />
        <div className="sveip-scroll" style={{
          display: 'flex',
          overflowX: 'scroll',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          height: '100%',
          width: '100%',
          borderRadius: '16px',
        }}>
          {/* Kortet */}
          <div
            onClick={() => router.push('/planter/' + plante.id)}
            style={{
              minWidth: '100%',
              scrollSnapAlign: 'start',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px',
              backgroundColor: vannet ? '#e8f0e5' : '#f0ece3',
              cursor: 'pointer',
              transition: 'background-color 0.4s ease',
              opacity: vannet ? 0.7 : 1,
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
              {plante.bilde_url ? (
                <img src={plante.bilde_url + '?width=88&height=88&resize=cover'} alt={plante.navn} style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} loading="lazy" />
              ) : (
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#d4e8d0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Droplets size={20} color="#4a7c59" />
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '15px', fontWeight: 700, color: '#1c1c18', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {plante.navn}
                </p>
                {plante.art && (
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#4a4a42', fontStyle: 'italic', margin: 0 }}>
                    {plante.art}
                  </p>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, marginLeft: '8px' }}>
              {vannet ? (
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 500, color: '#4a7c59' }}>Vannet 💧</span>
              ) : plante.neste_vanning ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Droplets size={13} color="#4a7c59" />
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 500, color: '#4a7c59' }}>
                    {dagTilVanning(plante.neste_vanning)}
                  </span>
                </div>
              ) : null}
              <button
                onClick={(e) => onVann(e, plante.id, plante.vanning_intervall_dager)}
                disabled={vannet}
                style={{
                  width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                  backgroundColor: vannet ? '#154212' : '#d4e8d0',
                  cursor: vannet ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  transform: vannet ? 'scale(1.1)' : 'scale(1)',
                  flexShrink: 0,
                }}
              >
                {vannet
                  ? <span style={{ fontSize: '16px', color: 'white' }}>✓</span>
                  : <Droplets size={16} color="#4a7c59" />
                }
              </button>
            </div>
          </div>

          {/* Knapper (sveip venstre avslører disse) */}
          <div style={{
            minWidth: '160px',
            scrollSnapAlign: 'end',
            display: 'flex',
            flexShrink: 0,
          }}>
            <button
              onClick={() => router.push('/planter/' + plante.id + '?rediger=true')}
              style={{ width: '80px', backgroundColor: '#4a7c59', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            >
              <span style={{ fontSize: '20px' }}>✏️</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: 'white' }}>Rediger</span>
            </button>
            <button
              onClick={() => onSlett(plante.id)}
              style={{ width: '80px', backgroundColor: '#c0392b', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            >
              <span style={{ fontSize: '20px' }}>🗑️</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: 'white' }}>Slett</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PlanterPage() {
  const [planter, setPlanter] = useState<Plante[]>([])
  const [laster, setLaster] = useState(true)
  const [vannetPlanter, setVannetPlanter] = useState<Set<string>>(new Set())
  const [sletterId, setSletterId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function hentPlanter() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('planter')
        .select('*')
        .eq('bruker_id', '4f386062-795a-4853-a34c-2f9023fd83f6')
        .order('plassering', { ascending: true })
      if (data) setPlanter(data)
      setLaster(false)
    }
    hentPlanter()
  }, [])

  async function vannPlante(e: React.MouseEvent, planteId: string, intervall: number) {
    e.preventDefault()
    e.stopPropagation()
    const na = new Date()
    const nestVanning = new Date()
    nestVanning.setDate(nestVanning.getDate() + intervall)
    await supabase.from('planter').update({
      sist_vannet: na.toISOString(),
      neste_vanning: nestVanning.toISOString(),
    }).eq('id', planteId)
    await supabase.from('vanningslogg').insert({
      plante_id: planteId,
      vannet_at: na.toISOString(),
    })
    setVannetPlanter(prev => new Set([...prev, planteId]))
    setPlanter(prev => prev.map(p => p.id === planteId ? {
      ...p,
      sist_vannet: na.toISOString(),
      neste_vanning: nestVanning.toISOString(),
    } : p))
  }

  async function bekreftSlett() {
    if (!sletterId) return
    await supabase.from('planter').delete().eq('id', sletterId)
    setPlanter(prev => prev.filter(p => p.id !== sletterId))
    setSletterId(null)
  }

  const shimmerCss = '@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } } .skeleton { background: linear-gradient(90deg, #f0ece3 25%, #e8e4db 50%, #f0ece3 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 12px; }'

  if (laster) return (
    <div style={{ paddingTop: '52px', paddingBottom: '32px' }}>
      <style dangerouslySetInnerHTML={{ __html: shimmerCss }} />
      <div className="skeleton" style={{ width: '140px', height: '36px', marginBottom: '24px' }} />
      {[1,2,3,4,5].map(i => (
        <div key={i} className="skeleton" style={{ width: '100%', height: '72px', marginBottom: '10px' }} />
      ))}
    </div>
  )

  const romRekkefølge = ['Hagen', 'Terrassen', 'Stuen', 'Kjøkkenet', 'Soverommet', 'Soverom oppe',
    'Soverom nede', 'Kontoret', 'Toalettet', 'Gangen', 'Gangen oppe', 'Yttergangen',
    'Vaskerommet', 'Trappen foran huset', 'Kjellerstuen', 'Kjellerbadet',
    'Musikkrommet', 'Boden', 'Uten plassering']

  const grupperPerRom = (planter: Plante[]) => {
    const grupper: Record<string, Plante[]> = {}
    for (const plante of planter) {
      const rom = plante.plassering || 'Uten plassering'
      if (!grupper[rom]) grupper[rom] = []
      grupper[rom].push(plante)
    }
    for (const rom of Object.keys(grupper)) {
      grupper[rom].sort((a, b) => {
        if (!a.neste_vanning) return 1
        if (!b.neste_vanning) return -1
        return new Date(a.neste_vanning).getTime() - new Date(b.neste_vanning).getTime()
      })
    }
    return Object.entries(grupper).sort(([a], [b]) => {
      const ai = romRekkefølge.indexOf(a)
      const bi = romRekkefølge.indexOf(b)
      if (ai === -1 && bi === -1) return a.localeCompare(b, 'nb')
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
  }

  const sorterteGrupper = grupperPerRom(planter)

  return (
    <div style={{ paddingTop: '52px', paddingBottom: '100px' }}>
      <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '28px', fontWeight: 800, color: '#1c1c18', marginBottom: '24px' }}>
        Plantene
      </h1>
      {sletterId && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: '#fdfaf3', borderRadius: '20px', padding: '28px 24px', width: '100%', maxWidth: '320px' }}>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '18px', fontWeight: 700, color: '#1c1c18', marginBottom: '8px' }}>Slett plante?</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4a4a42', marginBottom: '24px' }}>
              {planter.find(p => p.id === sletterId)?.navn} blir slettet permanent.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setSletterId(null)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: '#e8e4db', fontFamily: 'Manrope, sans-serif', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
                Avbryt
              </button>
              <button onClick={bekreftSlett} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: '#c0392b', color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
                Slett
              </button>
            </div>
          </div>
        </div>
      )}
      {sorterteGrupper.length === 0 ? (
        <p style={{ fontFamily: 'Inter, sans-serif', color: '#4a4a42' }}>Ingen planter ennå.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sorterteGrupper.map(([rom, romPlanter]) => (
            <div key={rom}>
              <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '13px', fontWeight: 700, color: '#4a7c59', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', marginTop: '24px' }}>
                {rom}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {romPlanter.map(plante => (
                  <PlanteKort
                    key={plante.id}
                    plante={plante}
                    vannet={vannetPlanter.has(plante.id)}
                    onVann={vannPlante}
                    onSlett={setSletterId}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
