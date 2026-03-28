'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface Melding {
  id: string
  dag_nummer: number
  dato: string
  melding: string
  bilde_url: string | null
}

export default function Minneskrin() {
  const [lesteMeldinger, setLesteMeldinger] = useState<Melding[]>([])
  const [visGalleri, setVisGalleri] = useState(false)
  const [valgtIndex, setValgtIndex] = useState<number | null>(null)
  const [laster, setLaster] = useState(true)
  const [rotasjoner] = useState(() => Array.from({ length: 60 }, () => (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random() * 3)))
  const supabase = createClient()

  useEffect(() => { hentLeste() }, [])

  async function hentLeste() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: leste } = await supabase.from('leste_meldinger').select('melding_id').eq('bruker_id', user.id)
    if (!leste || leste.length === 0) { setLaster(false); return }
    const ids = leste.map((l: any) => l.melding_id)
    const { data: meldinger } = await supabase.from('daglige_meldinger').select('*').in('id', ids).order('dato', { ascending: false })
    if (meldinger) setLesteMeldinger(meldinger)
    setLaster(false)
  }

  function forrige() { setValgtIndex(prev => prev !== null ? Math.max(0, prev - 1) : null) }
  function neste() { setValgtIndex(prev => prev !== null ? Math.min(lesteMeldinger.length - 1, prev + 1) : null) }

  const touchStartX = { current: null as number | null }
  function håndterTouchStart(e: React.TouchEvent) { touchStartX.current = e.touches[0].clientX }
  function håndterTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 50) { dx < 0 ? neste() : forrige() }
    touchStartX.current = null
  }

  if (laster || lesteMeldinger.length === 0) return null

  const valgt = valgtIndex !== null ? lesteMeldinger[valgtIndex] : null
  const visStabel = lesteMeldinger.slice(0, 4)

  return (
    <>
      <style>{`
        @keyframes minneskrin-inn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes brev-inn { from { opacity: 0; transform: scale(0.92) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>

      <div style={{ marginBottom: '32px', animation: 'minneskrin-inn 0.5s ease-out' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c0392b', marginBottom: '3px' }}>
              💌 Fra S
            </p>
            <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '22px', fontWeight: 800, color: '#1c1c18', letterSpacing: '-0.02em' }}>
              Minneskrin
            </h2>
          </div>
<p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#c4c0b7' }}>
            Trykk for å åpne
          </p>
        </div>

        {/* Polaroid-stabel */}
        <div
          onClick={() => setVisGalleri(true)}
          style={{ position: 'relative', height: '220px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {visStabel.map((m, i) => {
            const rot = rotasjoner[i]
            const offsetX = i === 0 ? 0 : i % 2 === 0 ? 12 : -12
            const offsetY = i * 4
            return (
              <div
                key={m.id}
                style={{
                  position: 'absolute',
                  transform: `translateX(${offsetX}px) translateY(${offsetY}px) rotate(${i === 0 ? rot * 0.5 : rot * (i % 2 === 0 ? 1.5 : -1.5)}deg)`,
                  backgroundColor: 'white',
                  padding: '10px 10px 36px 10px',
                  borderRadius: '3px',
                  boxShadow: `0 ${4 + i * 2}px ${12 + i * 4}px rgba(0,0,0,${0.08 + i * 0.03})`,
                  zIndex: visStabel.length - i,
                  transition: 'transform 0.3s ease',
                  width: '160px',
                }}
              >
                {m.bilde_url ? (
                  <div style={{ width: '100%', aspectRatio: '1/1', overflow: 'hidden' }}>
                    <img src={m.bilde_url + '?width=200&height=200&resize=cover'} alt="Minne" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" loading='lazy' />
                  </div>
                ) : (
                  <div style={{ width: '100%', aspectRatio: '1/1', backgroundColor: '#fdf0ef', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>
                    💌
                  </div>
                )}
                {i === 0 && (
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#888', textAlign: 'center', position: 'absolute', bottom: '12px', left: 0, right: 0 }}>
                    {new Date(m.dato).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })}
                  </p>
                )}
              </div>
            )
          })}


        </div>
      </div>

      {/* Galleri */}
      {visGalleri && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#fcf9f2', zIndex: 300, overflowY: 'auto' }}>
          <div style={{ padding: '52px 20px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
              <div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c0392b', marginBottom: '4px' }}>Fra S ❤️</p>
                <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '28px', fontWeight: 800, color: '#1c1c18', letterSpacing: '-0.02em' }}>Minneskrin</h1>
              </div>
              <button onClick={() => setVisGalleri(false)} style={{ background: '#f0ece3', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} color="#4a4a42" />
              </button>
            </div>

            {/* Rutenett med polaroids */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 12px', padding: '10px' }}>
              {lesteMeldinger.map((m, i) => (
                <div
                  key={m.id}
                  onClick={() => setValgtIndex(i)}
                  style={{
                    backgroundColor: 'white',
                    padding: '10px 10px 40px 10px',
                    borderRadius: '3px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    transform: `rotate(${rotasjoner[i]}deg)`,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    margin: '4px',
                  }}
                >
                  {m.bilde_url ? (
                    <div style={{ width: '100%', aspectRatio: '1/1', overflow: 'hidden' }}>
                      <img src={m.bilde_url + '?width=200&height=200&resize=cover'} alt="Minne" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" loading='lazy' />
                    </div>
                  ) : (
                    <div style={{ width: '100%', aspectRatio: '1/1', backgroundColor: '#fdf0ef', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
                      💌
                    </div>
                  )}
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#888', textAlign: 'center', marginTop: '10px' }}>
                    {new Date(m.dato).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  {m.melding && (
                    <p style={{ fontFamily: 'Georgia, serif', fontSize: '10px', color: '#4a4a42', textAlign: 'center', marginTop: '4px', fontStyle: 'italic', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {m.melding}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Enkelt brev */}
      {valgtIndex !== null && valgt && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onTouchStart={håndterTouchStart}
          onTouchEnd={håndterTouchEnd}
          onClick={() => setValgtIndex(null)}
        >
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: '24px', width: '100%', maxWidth: '400px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', animation: 'brev-inn 0.35s ease-out' }}>
            <div style={{ background: 'linear-gradient(135deg, #8b1a4a 0%, #c0392b 100%)', borderRadius: '24px 24px 0 0', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {valgtIndex > 0 && (
                  <button onClick={forrige} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronLeft size={14} color="white" />
                  </button>
                )}
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)' }}>
                  {valgt.dag_nummer > 0 ? `Dag ${valgt.dag_nummer}` : ''} 💌
                </p>
                {valgtIndex < lesteMeldinger.length - 1 && (
                  <button onClick={neste} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronRight size={14} color="white" />
                  </button>
                )}
              </div>
              <button onClick={() => setValgtIndex(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={14} color="white" />
              </button>
            </div>

            <div style={{ padding: '28px' }}>
              {valgt.bilde_url && (
                <div style={{ backgroundColor: 'white', padding: '10px 10px 36px 10px', borderRadius: '3px', boxShadow: '0 6px 20px rgba(0,0,0,0.12)', marginBottom: '28px', transform: `rotate(${rotasjoner[valgtIndex]}deg)` }}>
                  <div style={{ width: '100%', aspectRatio: '1/1', overflow: 'hidden' }}>
                    <img src={valgt.bilde_url} alt="Minne" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                </div>
              )}
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#c0392b', marginBottom: '14px', fontWeight: 600 }}>
                {new Date(valgt.dato).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: '17px', color: '#1c1c18', lineHeight: 1.8, fontStyle: 'italic', marginBottom: '20px' }}>
                {valgt.melding}
              </p>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '15px', fontWeight: 700, color: '#c0392b', textAlign: 'right' }}>
                – S ❤️
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
