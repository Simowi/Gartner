'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { X } from 'lucide-react'

interface Melding {
  dag_nummer: number
  dato: string
  melding: string
  bilde_url: string | null
}

function Sparkle({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <div style={{
      position: 'absolute',
      left: x + '%',
      top: y + '%',
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      backgroundColor: ['#ffd700', '#ff69b4', '#98fb98', '#87ceeb', '#dda0dd'][Math.floor(Math.random() * 5)],
      animation: `sparkle 0.8s ease-out ${delay}s forwards`,
      opacity: 0,
      pointerEvents: 'none',
    }} />
  )
}

export default function DagligMelding() {
  const [melding, setMelding] = useState<Melding | null>(null)
  const [åpnet, setÅpnet] = useState(false)
  const [visInnhold, setVisInnhold] = useState(false)
  const [sparkles, setSparkles] = useState<{ x: number; y: number; delay: number }[]>([])
  const [laster, setLaster] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    hentDagensMelding()
    // Sjekk om allerede åpnet i dag
    const sistÅpnet = localStorage.getItem('melding-sist-apnet')
    const iDag = new Date().toISOString().split('T')[0]
    if (sistÅpnet === iDag) setÅpnet(true)
  }, [])

  async function hentDagensMelding() {
    const iDag = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('daglige_meldinger')
      .select('*')
      .lte('dato', iDag)
      .order('dato', { ascending: false })
      .limit(1)
      .single()
    if (data) setMelding(data)
    setLaster(false)
  }

  function åpneKonvolutt() {
    if (åpnet) {
      setVisInnhold(true)
      return
    }
    // Generer sparkles
    const nyeSparkles = Array.from({ length: 12 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: i * 0.05,
    }))
    setSparkles(nyeSparkles)
    setÅpnet(true)
    setVisInnhold(true)
    localStorage.setItem('melding-sist-apnet', new Date().toISOString().split('T')[0])
  }

  if (laster || !melding) return null

  return (
    <>
      <style>{`
        @keyframes sparkle {
          0% { transform: scale(0) translate(0, 0); opacity: 1; }
          100% { transform: scale(1) translate(${Math.random() * 40 - 20}px, ${Math.random() * 40 - 20}px); opacity: 0; }
        }
        @keyframes konvolutt-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
      `}</style>

      <div
        onClick={åpneKonvolutt}
        style={{
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #8b1a4a 0%, #c0392b 100%)',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          animation: !åpnet ? 'konvolutt-pulse 2s ease-in-out infinite' : 'none',
        }}
      >
        {sparkles.map((s, i) => <Sparkle key={i} {...s} />)}

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ fontSize: '36px', flexShrink: 0 }}>
            {åpnet ? '💌' : '✉️'}
          </div>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
              {åpnet ? 'Dagens melding fra S' : 'Du har en melding fra S'}
            </p>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '15px', fontWeight: 700, color: 'white' }}>
              {åpnet ? 'Trykk for å lese igjen 💕' : 'Trykk for å åpne ✨'}
            </p>
          </div>
        </div>
      </div>

      {visInnhold && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setVisInnhold(false)}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fcf9f2', borderRadius: '24px', padding: '28px', width: '100%', maxWidth: '400px', maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => setVisInnhold(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: '#f0ece3', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} color="#4a4a42" />
            </button>

            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c0392b', marginBottom: '4px' }}>
              {melding.dag_nummer > 0 ? 'Dag ' + melding.dag_nummer + ' 💌' : '💌'}
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#4a4a42', marginBottom: '20px' }}>
              {new Date(melding.dato).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>

            {melding.bilde_url && (
              <img src={melding.bilde_url} alt="Bilde fra S" style={{ width: '100%', borderRadius: '16px', marginBottom: '20px', objectFit: 'cover', maxHeight: '240px' }} />
            )}

            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', color: '#1c1c18', lineHeight: 1.7, fontStyle: 'italic' }}>
              {melding.melding}
            </p>

            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '14px', fontWeight: 700, color: '#c0392b', marginTop: '16px', textAlign: 'right' }}>
              – S ❤️
            </p>
          </div>
        </div>
      )}
    </>
  )
}
