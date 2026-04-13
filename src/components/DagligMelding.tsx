'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { X } from 'lucide-react'

interface Melding {
  id: string
  dag_nummer: number
  dato: string
  melding: string
  bilde_url: string | null
}

export default function DagligMelding() {
  const [meldinger, setMeldinger] = useState<Melding[]>([])
  const [lesteIds, setLesteIds] = useState<Set<string>>(new Set())
  const [visModal, setVisModal] = useState(false)
  const [animerer, setAnimerer] = useState(false)
  const [bytter, setBytter] = useState(false)
  const [glitter, setGlitter] = useState<{ id: number; x: number; y: number; farge: string; delay: number; størrelse: number }[]>([])
  const [laster, setLaster] = useState(true)
  const [rotasjoner] = useState(() => Array.from({ length: 30 }, () => (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random() * 2)))
  const supabase = createClient()

  useEffect(() => { hentAlt() }, [])

  async function hentAlt() {
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) return

const iMorgen = new Date(); iMorgen.setDate(iMorgen.getDate() + 1); const iDag = iMorgen.toISOString().split('T')[0]
    const [{ data: msgs }, { data: leste }] = await Promise.all([
      supabase.from('daglige_meldinger').select('*').lte('dato', iDag).order('dato', { ascending: true }),
      supabase.from('leste_meldinger').select('melding_id').eq('bruker_id', u.id)
    ])
    if (msgs) setMeldinger(msgs)
    if (leste) setLesteIds(new Set(leste.map((l: any) => l.melding_id)))
    setLaster(false)
  }

  function åpne() {
    setAnimerer(true)
    const farger = ['#ffd700', '#ff69b4', '#98fb98', '#87ceeb', '#dda0dd', '#ffa500', '#ff6b6b', '#fff']
    setGlitter(Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 60,
      farge: farger[Math.floor(Math.random() * farger.length)],
      delay: i * 0.04,
      størrelse: 4 + Math.random() * 6,
    })))
    setTimeout(() => {
      setAnimerer(false)
      setGlitter([])
      setVisModal(true)
    }, 800)
  }

  async function markerSomLest(meldingId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setBytter(true)
    await new Promise(r => setTimeout(r, 380))

    await supabase.from('leste_meldinger').upsert({
      bruker_id: user.id,
      melding_id: meldingId,
    }, { onConflict: 'bruker_id,melding_id' })

    const nyLesteIds = new Set([...lesteIds, meldingId])
    setLesteIds(nyLesteIds)
    setBytter(false)

    const nyeUleste = meldinger.filter(m => !nyLesteIds.has(m.id))
    if (nyeUleste.length === 0) setVisModal(false)
  }

  const uleste = meldinger.filter(m => !lesteIds.has(m.id))
  const eldsteUleste = uleste[0]
  const antallUleste = uleste.length

  if (laster || meldinger.length === 0 || antallUleste === 0) return null

  return (
    <>
      <style>{`
        @keyframes glitter-fall {
          0% { transform: scale(0) rotate(0deg); opacity: 1; }
          60% { opacity: 1; }
          100% { transform: scale(1) rotate(180deg) translateY(-80px); opacity: 0; }
        }
        @keyframes puls {
          0%, 100% { transform: scale(1); box-shadow: 0 4px 20px rgba(139,26,74,0.3); }
          50% { transform: scale(1.02); box-shadow: 0 8px 30px rgba(139,26,74,0.5); }
        }
        @keyframes konvolutt-rist {
          0% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.05) rotate(-2deg); }
          50% { transform: scale(1.08) rotate(2deg); }
          75% { transform: scale(1.05) rotate(-1deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes kort-ut {
          0% { transform: translateX(0) rotate(0deg); opacity: 1; }
          100% { transform: translateX(110%) rotate(6deg); opacity: 0; }
        }
        @keyframes kort-inn {
          0% { transform: translateX(-60px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes modal-inn {
          0% { opacity: 0; transform: scale(0.95) translateY(12px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      {glitter.length > 0 && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, pointerEvents: 'none' }}>
          {glitter.map(g => (
            <div key={g.id} style={{
              position: 'absolute',
              left: g.x + '%',
              top: g.y + '%',
              width: g.størrelse + 'px',
              height: g.størrelse + 'px',
              backgroundColor: g.farge,
              borderRadius: '50%',
              animation: `glitter-fall 1.2s ease-out ${g.delay}s both`,
              pointerEvents: 'none',
            }} />
          ))}
        </div>
      )}

      <div
        onClick={åpne}
        style={{
          borderRadius: '20px',
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #8b1a4a 0%, #c0392b 100%)',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          animation: animerer ? 'konvolutt-rist 0.8s ease-in-out' : 'puls 3s ease-in-out infinite',
          boxShadow: '0 4px 20px rgba(139,26,74,0.3)',
        }}
      >
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.06)' }} />
        <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ fontSize: '40px', flexShrink: 0, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>✉️</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', marginBottom: '4px' }}>
              {antallUleste} ulest{antallUleste === 1 ? '' : 'e'} fra S
            </p>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '16px', fontWeight: 700, color: 'white', lineHeight: 1.3 }}>
              {antallUleste > 1 ? `${antallUleste} meldinger venter på deg ✨` : 'En melding venter på deg ✨'}
            </p>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '999px', minWidth: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px', flexShrink: 0 }}>
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '13px', fontWeight: 800, color: '#c0392b' }}>{antallUleste}</span>
          </div>
        </div>
      </div>

      {visModal && eldsteUleste && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={() => setVisModal(false)}
        >
          <div
            key={eldsteUleste.id}
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: '#fff',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '400px',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
              animation: bytter ? 'kort-ut 0.38s cubic-bezier(0.4,0,1,1) both' : 'kort-inn 0.38s cubic-bezier(0,0,0.2,1) both',
            }}
          >
            <div style={{ background: 'linear-gradient(135deg, #8b1a4a 0%, #c0392b 100%)', borderRadius: '24px 24px 0 0', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)' }}>
                  {eldsteUleste.dag_nummer > 0 ? `Dag ${eldsteUleste.dag_nummer} 💌` : '💌'}
                </p>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {meldinger.slice(0, Math.min(meldinger.length, 7)).map(m => (
                    <div key={m.id} style={{
                      width: m.id === eldsteUleste.id ? '10px' : '6px',
                      height: '6px',
                      borderRadius: '999px',
                      backgroundColor: lesteIds.has(m.id)
                        ? 'rgba(255,255,255,0.3)'
                        : m.id === eldsteUleste.id
                          ? 'white'
                          : 'rgba(255,255,255,0.6)',
                      transition: 'all 0.3s ease',
                    }} />
                  ))}
                  {meldinger.length > 7 && (
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginLeft: '2px' }}>+{meldinger.length - 7}</span>
                  )}
                </div>
              </div>
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

              <button
                onClick={() => markerSomLest(eldsteUleste.id)}
                style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #8b1a4a 0%, #c0392b 100%)', color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}
              >
                {antallUleste > 1 ? `Legg i minneskrinet – ${antallUleste - 1} igjen 💌` : 'Legg i minneskrinet 🗃️'}
              </button>
            </div>
          </div>
        </div>
      )}

      {visModal && !eldsteUleste && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setVisModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '400px', textAlign: 'center', animation: 'modal-inn 0.4s ease-out', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
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
