'use client'
import { useEffect, useState } from 'react'

interface VærDag {
  dato: string
  maks: number
  min: number
  nedbør: number
  kode: string
}

function værIkon(kode: string): string {
  if (!kode) return '🌡️'
  if (kode.includes('clearsky')) return '☀️'
  if (kode.includes('fair')) return '🌤️'
  if (kode.includes('partlycloudy')) return '⛅'
  if (kode.includes('cloudy')) return '☁️'
  if (kode.includes('fog')) return '🌫️'
  if (kode.includes('snow') && kode.includes('thunder')) return '⛈️'
  if (kode.includes('thunder')) return '⛈️'
  if (kode.includes('snow') || kode.includes('sleet')) return '❄️'
  if (kode.includes('rain') || kode.includes('shower')) return '🌧️'
  if (kode.includes('drizzle')) return '🌦️'
  return '🌤️'
}

function planteTips(kode: string, maks: number, nedbør: number): string {
  if (maks < 0) return 'Frostfare – ta inn balkongplantene i natt!'
  if (maks < 5) return 'Kaldt ute – hold stueplanter unna kalde vinduskarmer.'
  if (nedbør > 10) return 'Kraftig regn – ikke vann uteplanter i dag.'
  if (nedbør > 3) return 'Regn i dag – sjekk at uteplanter ikke står i stående vann.'
  if (kode.includes('clearsky') && maks > 15) return 'Strålende sol – pass på at planter ikke brenner i vinduet.'
  if (kode.includes('clearsky')) return 'Solrikt – perfekt dag for å gi plantene ekstra lys.'
  if (kode.includes('fair') || kode.includes('partlycloudy')) return 'Lettskyet – bra lysforhold for de fleste stueplanter.'
  if (maks > 22) return 'Varmt – husk å vanne litt ekstra i dag.'
  if (kode.includes('snow')) return 'Snø – hold uteplanter og balkonger dekket til.'
  return 'Normalt vær – følg vanlig vanningsplan.'
}

const ukedager = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør']

export default function VærStripe() {
  const [dager, setDager] = useState<VærDag[]>([])
  const [tips, setTips] = useState('')
  const [laster, setLaster] = useState(true)

  useEffect(() => {
    async function hentVær() {
      try {
        const res = await fetch('/api/vaer')
        const data = await res.json()
        if (data.dager) {
          setDager(data.dager)
          if (data.dager.length > 0) {
            setTips(planteTips(data.dager[0].kode, data.dager[0].maks, data.dager[0].nedbør))
          }
        }
      } catch (e) {
        console.error('Vær-feil:', e)
      }
      setLaster(false)
    }
    hentVær()
  }, [])

  if (laster || dager.length === 0) return null

  return (
    <div style={{ marginBottom: '24px', marginTop: '24px' }}>
      {/* 14-dagers stripe */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '6px',
      } as React.CSSProperties}>
        {dager.map((dag, i) => {
          const dato = new Date(dag.dato)
          const erIDag = i === 0
          const harNedbør = dag.nedbør > 0.5
          return (
            <div
              key={dag.dato}
              style={{
                flexShrink: 0,
                width: '60px',
                borderRadius: '14px',
                padding: '10px 6px',
                backgroundColor: erIDag ? '#154212' : '#f0ece3',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 600, color: erIDag ? 'rgba(255,255,255,0.7)' : '#4a4a42', textTransform: 'uppercase' }}>
                {erIDag ? 'I dag' : ukedager[dato.getDay()]}
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: erIDag ? 'rgba(255,255,255,0.5)' : '#c4c0b7' }}>
                {dato.getDate()}/{dato.getMonth() + 1}
              </p>
              <span style={{ fontSize: '16px', lineHeight: 1.3 }}>{værIkon(dag.kode)}</span>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '13px', fontWeight: 700, color: erIDag ? 'white' : '#1c1c18' }}>
                {dag.maks}°
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: erIDag ? 'rgba(255,255,255,0.6)' : '#4a4a42' }}>
                {dag.min}°
              </p>
              {harNedbør && (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: erIDag ? 'rgba(255,255,255,0.6)' : '#4a7c59', fontWeight: 600 }}>
                  {dag.nedbør}mm
                </p>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f0ece3', borderRadius: '12px', padding: '10px 14px', flex: 1 }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#1c1c18', lineHeight: 1.4 }}>
            <span style={{ color: '#4a4a42', fontWeight: 600 }}>Løvåsveien i dag </span>
            {værIkon(dager[0].kode)} {tips}
          </p>
        </div>
      </div>

      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#c4c0b7', textAlign: 'right', marginTop: '6px' }}>
        Kilde: Yr / Meteorologisk institutt
      </p>
    </div>
  )
}
