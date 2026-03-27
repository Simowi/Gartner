'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { X, ChevronRight } from 'lucide-react'

interface Melding {
  id: string
  dag_nummer: number
  dato: string
  melding: string
  bilde_url: string | null
}

function GlitterPartikkel({ x, y, farge, delay, storrelse }: { x: number; y: number; farge: string; delay: number; storrelse: number }) {
  return (
    <div style={{
      position: 'absolute',
      left: x + '%',
      top: y + '%',
      width: storrelse + 'px',
      height: storrelse + 'px',
      backgroundColor: farge,
      borderRadius: Math.random() > 0.5 ? '50%' : '2px',
      animation: `glitter-fall 1.2s ease-out ${delay}s both`,
      pointerEvents: 'none',
      zIndex: 400,
    }} />
  )
}

export default function DagligMelding() {
  const [meldinger, setMeldinger] = useState<Melding[]>([])
  const [lesteIds, setLesteIds] = useState<Set<string>>(new Set())
  const [visModal, setVisModal] = useState(false)
  const [animerer, setAnimerer] = useState(false)
  const [glitter, setGlitter] = useState<any[]>([])
  const [laster, setLaster] = useState(true)
  const [rotasjoner] = useState(() => Array.from({ length: 30 }, () => (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random() * 2)))
  const supabase = createClient()

  useEffect(() => {
    hentAlt()
  }, [])

  async function hentAlt() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const iDag = new Date().toISOString().split('T')[0]
    const [{ data: msgs }, { data: leste }] = await Promise.all([
      supabase.from('daglige_meldinger').select('*').lte('dato', iDag).order('dato', { ascending: true }),
      supabase.from('leste_meldinger').select('melding_id').eq('bruker_id', user.id)
    ])

    if (msgs) setMeldinger(msgs)
    if (leste) setLesteIds(new Set(leste.map((l: any) => l.melding_id)))
    setLaster(false)
  }

  function åpne() {
    setAnimerer(true)
    const farger = ['#ffd700', '#ff69b4', '#98fb98', '#87ceeb', '#dda0dd', '#ffa500', '#ff6b6b', '#fff']
    const nyeGlitter = Array.from({ length: 20 }, (_, i) => ({
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 60,
      farge: farger[Math.floor(Math.random() * farger.length)],
      delay: i * 0.04,
      storrelse: 4 + Math.random() * 6,
    }))
    setGlitter(nyeGlitter)
    setTimeout(() => {
      setAnimerer(false)
      setGlitter([])
      setVisModal(true)
    }, 800)
  }

  async function markerSomLest(meldingId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('leste_meldinger').upsert({
      bruker_id: user.id,
      melding_id: meldingId,
    }, { onConflict: 'bruker_id,melding_id' })
    setLesteIds(prev => new Set([...prev, meldingId]))
    setVisModal(false)
  }

  const uleste = meldinger.filter(m => !lesteIds.has(m.id))
  const eldsteUleste = uleste[0]
  const antallUleste = uleste.length

  if (laster || meldinger.length === 0) return null

  return (
    <>
      <style>{`
        @keyframes glitter-fall {
          0% { transform: scale(0) rotate(0deg) translate(0, 0); opacity: 1; }
          60% { opacity: 1; }
          100% { transform: scale(1) rotate(180deg) translate(${Math.random() * 60 - 30}px, -60px); opacity: 0; }
        }
        @keyframes puls {
          0%, 100% { transform: scale(1); box-shadow: 0 4px 20px rgba(139, 26, 74, 0.3); }
          50% { transform: scale(1.02); box-shadow: 0 8px 30px rgba(139, 26, 74, 0.5); }
        }
        @keyframes konvolutt-rist {
          0% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.05) rotate(-2deg); }
          50% { transform: scale(1.08) rotate(2deg); }
          75% { transform: scale(1.05) rotate(-1deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes innfading {
          0% { opacity: 0; transform: scale(0.95) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      {glitter.length > 0 && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, pointerEvents: 'none' }}>
          {glitter.map((g, i) => <GlitterPartikkel key={i} {...g} />)}
        </div>
      )}

      <div
        onClick={eldsteUleste ? åpne : () => setVisModal(true)}
        style={{
          borderRadius: '20px',
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #8b1a4a 0%, #c0392b 100%)',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          animation: animerer ? 'konvolutt-rist 0.8s ease-in-out' : 'puls 3s ease-in-out infinite',
          boxShadow: '0 4px 20px rgba(139, 26, 74, 0.3)',
        }}
      >
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: '-30px', left: '-10px', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.04)' }} />

        <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ fontSize: '40px', flexShrink: 0, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
            {antallUleste > 0 ? '✉️' : '💌'}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', marginBottom: '4px' }}>
              {antallUleste > 0 ? `${antallUleste} ulest${antallUleste === 1 ? '' : 'e'} fra S` : 'Dagens melding fra S'}
            </p>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '16px', fontWeight: 700, color: 'white', lineHeight: 1.3 }}>
              {antallUleste > 1 ? `Du har ${antallUleste} meldinger som venter ✨` : antallUleste === 1 ? 'Trykk for å åpne ✨' : 'Trykk for å lese igjen 💕'}
            </p>
          </div>
          <ChevronRight size={20} color="rgba(255,255,255,0.6)" />
        </div>
      </div>

      {visModal && eldsteUleste && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setVisModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: '24px', width: '100%', maxWidth: '400px', maxHeight: '85vh', overflowY: 'auto', position: 'relative', animation: 'innfading 0.4s ease-out', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ background: 'linear-gradient(135deg, #8b1a4a 0%, #c0392b 100%)', borderRadius: '24px 24px 0 0', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)' }}>
                {eldsteUleste.dag_nummer > 0 ? `Dag ${eldsteUleste.dag_nummer} 💌` : '💌'}
                {antallUleste > 1 && <span style={{ marginLeft: '8px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '10px', padding: '2px 8px' }}>{antallUleste} igjen</span>}
              </p>
              <button onClick={() => setVisModal(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={14} color="white" />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {eldsteUleste.bilde_url && (
                <div style={{ backgroundColor: 'white', padding: '10px 10px 32px 10px', borderRadius: '4px', boxShadow: '0 4px 15px rgba(0,0,0,0.15)', marginBottom: '24px', transform: `rotate(${rotasjoner[eldsteUleste.dag_nummer % 30]}deg)` }}>
                  <div style={{ width: '100%', aspectRatio: '1/1', overflow: 'hidden' }}>
                    <img src={eldsteUleste.bilde_url} alt="Bilde fra S" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                </div>
              )}

              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#c0392b', marginBottom: '16px' }}>
                {new Date(eldsteUleste.dato).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>

              <p style={{ fontFamily: 'Georgia, serif', fontSize: '17px', color: '#1c1c18', lineHeight: 1.8, fontStyle: 'italic', marginBottom: '20px' }}>
                {eldsteUleste.melding}
              </p>

              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '15px', fontWeight: 700, color: '#c0392b', textAlign: 'right', marginBottom: '24px' }}>
                – S ❤️
              </p>

              <button onClick={() => markerSomLest(eldsteUleste.id)} style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #8b1a4a 0%, #c0392b 100%)', color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>
                {antallUleste > 1 ? `Merk som lest – ${antallUleste - 1} igjen 💌` : 'Merk som lest ✓'}
              </button>
            </div>
          </div>
        </div>
      )}

      {visModal && !eldsteUleste && meldinger.length > 0 && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setVisModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '400px', textAlign: 'center', animation: 'innfading 0.4s ease-out', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>💌</p>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '20px', fontWeight: 700, color: '#1c1c18', marginBottom: '8px' }}>Alle lest!</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4a4a42', marginBottom: '24px' }}>Ny melding venter i morgen 🌱</p>
            <button onClick={() => setVisModal(false)} style={{ padding: '12px 28px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #8b1a4a 0%, #c0392b 100%)', color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
              Lukk
            </button>
          </div>
        </div>
      )}
    </>
  )
}
