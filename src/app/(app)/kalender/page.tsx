'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Droplets, Leaf, CheckCircle } from 'lucide-react'

interface Plante {
  id: string
  navn: string
  art: string
  bilde_url: string
  neste_vanning: string
  vanning_intervall_dager: number
  sist_vannet: string
}

interface VanningsDag {
  dato: Date
  planter: Plante[]
}

export default function KalenderPage() {
  const [planter, setPlanter] = useState<Plante[]>([])
  const [laster, setLaster] = useState(true)
  const [vannetIDag, setVannetIDag] = useState<Set<string>>(new Set())
  const supabase = createClient()

  useEffect(() => {
    async function hentPlanter() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('planter')
        .select('*')
        .eq('bruker_id', user.id)
      if (data) setPlanter(data)
      setLaster(false)
    }
    hentPlanter()
  }, [])

  async function registrerVanning(plante: Plante) {
    const nå = new Date()
    const nestVanning = new Date()
    nestVanning.setDate(nestVanning.getDate() + plante.vanning_intervall_dager)

    await supabase.from('planter').update({
      sist_vannet: nå.toISOString(),
      neste_vanning: nestVanning.toISOString(),
    }).eq('id', plante.id)

    await supabase.from('vanningslogg').insert({
      plante_id: plante.id,
      vannet_at: nå.toISOString(),
    })

    setVannetIDag(prev => new Set([...prev, plante.id]))
    setPlanter(prev => prev.map(p => p.id === plante.id ? {
      ...p,
      sist_vannet: nå.toISOString(),
      neste_vanning: nestVanning.toISOString(),
    } : p))
  }

  const genererVanningsDager = (): VanningsDag[] => {
    const dager: Map<string, VanningsDag> = new Map()
    const iDag = new Date()
    iDag.setHours(0, 0, 0, 0)

    for (const plante of planter) {
      if (!plante.neste_vanning) continue
      let nesteVanning = new Date(plante.neste_vanning)
      nesteVanning.setHours(0, 0, 0, 0)

      for (let i = 0; i < 8; i++) {
        const dato = new Date(nesteVanning)
        dato.setDate(dato.getDate() + i * plante.vanning_intervall_dager)
        if (dato < iDag) continue
        const nøkkel = dato.toISOString().split('T')[0]
        if (!dager.has(nøkkel)) {
          dager.set(nøkkel, { dato, planter: [] })
        }
        dager.get(nøkkel)!.planter.push(plante)
        if (i >= 2) break
      }
    }

    return Array.from(dager.values()).sort((a, b) => a.dato.getTime() - b.dato.getTime()).slice(0, 30)
  }

  const ukedager = ['søn', 'man', 'tir', 'ons', 'tor', 'fre', 'lør']
  const måneder = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des']

  const formaterDato = (dato: Date) => {
    const iDag = new Date()
    iDag.setHours(0, 0, 0, 0)
    const iMorgen = new Date(iDag)
    iMorgen.setDate(iMorgen.getDate() + 1)
    const d = new Date(dato)
    d.setHours(0, 0, 0, 0)

    if (d.getTime() === iDag.getTime()) return 'I dag'
    if (d.getTime() === iMorgen.getTime()) return 'I morgen'
    return ukedager[dato.getDay()] + ' ' + dato.getDate() + '. ' + måneder[dato.getMonth()]
  }

  const erForsinket = (dato: Date) => {
    const iDag = new Date()
    iDag.setHours(0, 0, 0, 0)
    return dato < iDag
  }

  const iDagStr = new Date().toISOString().split('T')[0]

  const ukesDager = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    d.setHours(0, 0, 0, 0)
    return d
  })

  const vanningsDager = genererVanningsDager()

  const planterForDag = (dato: Date) => {
    const nøkkel = dato.toISOString().split('T')[0]
    return vanningsDager.find(v => v.dato.toISOString().split('T')[0] === nøkkel)?.planter || []
  }

  return (
    <div style={{ paddingTop: '52px', paddingBottom: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: '#4a7c59', marginBottom: '6px', textTransform: 'uppercase' }}>
          Oversikt
        </p>
        <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '42px', fontWeight: 800, color: '#1c1c18', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          Kalender
        </h1>
      </div>

      {/* Ukesvisning */}
      <div style={{ marginBottom: '32px' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4a4a42', marginBottom: '12px' }}>
          Neste 7 dager
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
          {ukesDager.map((dag, i) => {
            const planterDenDagen = planterForDag(dag)
            const erIDag = i === 0
            const harPlanter = planterDenDagen.length > 0
            return (
              <div
                key={i}
                style={{
                  borderRadius: '14px',
                  padding: '10px 4px',
                  backgroundColor: erIDag ? '#154212' : harPlanter ? '#d4e8d0' : '#f0ece3',
                  textAlign: 'center',
                  position: 'relative',
                }}
              >
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 600, color: erIDag ? 'rgba(255,255,255,0.7)' : '#4a4a42', textTransform: 'uppercase', marginBottom: '4px' }}>
                  {ukedager[dag.getDay()]}
                </p>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '15px', fontWeight: 700, color: erIDag ? 'white' : '#1c1c18' }}>
                  {dag.getDate()}
                </p>
                {harPlanter && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
                    <Droplets size={10} color={erIDag ? 'rgba(255,255,255,0.8)' : '#4a7c59'} />
                    {planterDenDagen.length > 1 && (
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: erIDag ? 'rgba(255,255,255,0.8)' : '#4a7c59', fontWeight: 600, marginLeft: '1px' }}>
                        {planterDenDagen.length}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Kronologisk liste */}
      <div>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4a4a42', marginBottom: '12px' }}>
          Kommende vanninger
        </p>

        {laster ? (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4a4a42' }}>Laster...</p>
        ) : vanningsDager.length === 0 ? (
          <div style={{ borderRadius: '20px', padding: '40px 24px', textAlign: 'center', backgroundColor: '#f0ece3' }}>
            <Leaf size={32} color="#c4c0b7" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4a4a42' }}>
              Ingen planlagte vanninger. <a href="/planter/ny" style={{ color: '#154212', fontWeight: 600 }}>Legg til planter!</a>
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {vanningsDager.map((dag, dagIndeks) => {
              const nøkkel = dag.dato.toISOString().split('T')[0]
              const erIDag = nøkkel === iDagStr
              const forsinket = erForsinket(dag.dato)
              return (
                <div key={dagIndeks}>
                  {/* Dato-header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', marginTop: dagIndeks > 0 ? '16px' : '0' }}>
                    <p style={{
                      fontFamily: 'Manrope, sans-serif',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: forsinket ? '#c0392b' : erIDag ? '#154212' : '#1c1c18',
                    }}>
                      {formaterDato(dag.dato)}
                    </p>
                    {forsinket && (
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, color: '#c0392b', backgroundColor: '#fdf0ef', padding: '2px 8px', borderRadius: '999px' }}>
                        Forfalt
                      </span>
                    )}
                  </div>

                  {/* Planter for denne dagen */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {dag.planter.map((plante) => {
                      const erVannet = vannetIDag.has(plante.id)
                      return (
                        <div
                          key={plante.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderRadius: '14px',
                            padding: '12px 14px',
                            backgroundColor: erVannet ? '#d4e8d0' : '#f0ece3',
                            opacity: erVannet ? 0.7 : 1,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#d4e8d0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                              {plante.bilde_url ? (
                                <img src={plante.bilde_url} alt={plante.navn} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <Leaf size={16} color="#154212" />
                              )}
                            </div>
                            <div>
                              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '14px', fontWeight: 600, color: '#1c1c18' }}>
                                {plante.navn}
                              </p>
                              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#4a4a42' }}>
                                {plante.art || 'Ukjent art'}
                              </p>
                            </div>
                          </div>

                          {erIDag && !erVannet ? (
                            <button
                              onClick={() => registrerVanning(plante)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '7px 12px',
                                borderRadius: '10px',
                                border: 'none',
                                backgroundColor: '#154212',
                                color: 'white',
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                flexShrink: 0,
                              }}
                            >
                              <Droplets size={12} color="white" />
                              Vann
                            </button>
                          ) : erVannet ? (
                            <CheckCircle size={18} color="#4a7c59" />
                          ) : (
                            <Droplets size={16} color={forsinket ? '#c0392b' : '#c4c0b7'} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
