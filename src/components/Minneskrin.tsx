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
  const [rotasjoner] = useState(() => Array.from({ length: 60 }, () => (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random() * 2.5)))
  const supabase = createClient()

  useEffect(() => {
    hentLeste()
  }, [])

  async function hentLeste() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: leste } = await supabase
      .from('leste_meldinger')
      .select('melding_id')
      .eq('bruker_id', user.id)

    if (!leste || leste.length === 0) { setLaster(false); return }

    const ids = leste.map((l: any) => l.melding_id)
    const { data: meldinger } = await supabase
      .from('daglige_meldinger')
      .select('*')
      .in('id', ids)
      .order('dato', { ascending: false })

    if (meldinger) setLesteMeldinger(meldinger)
    setLaster(false)
  }

  function forrige() { setValgtIndex(prev => prev !== null ? Math.max(0, prev - 1) : null) }
  function neste() { setValgtIndex(prev => prev !== null ? Math.min(lesteMeldinger.length - 1, prev + 1) : null) }

  const touchStartX = useState<number | null>(null)

  if (laster || lesteMeldinger.length === 0) return null

  const valgt = valgtIndex !== null ? lesteMeldinger[valgtIndex] : null

  return (
    <>
      <style>{`
        @keyframes minneskrin-inn {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes kort-inn {
          0% { opacity: 0; transform: scale(0.9) rotate(var(--rot)); }
          100% { opacity: 1; transform: scale(1) rotate(var(--rot)); }
        }
      `}</style>

      <div style={{ marginBottom: '32px', animation: 'minneskrin-inn 0.5s ease-out' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c0392b', marginBottom: '2px' }}>
              💌 Fra S
            </p>
            <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '20px', fontWeight: 700, color: '#1c1c18', letterSpacing: '-0.01em' }}>
              Minneskrin
            </h2>
          </div>
          <button
            onClick={() => setVisGalleri(true)}
            style={{ padding: '8px 14px', borderRadius: '12px', border: 'none', backgroundColor: '#fdf0ef', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#c0392b' }}
          >
            Se alle ({lesteMeldinger.length})
          </button>
        </div>

        {/* Polaroid-stabel */}
        <div
          onClick={() => setVisGalleri(true)}
          style={{ position: 'relative', height: '200px', cursor: 'pointer' }}
        >
          {lesteMeldinger.slice(0, 5).map((m, i) => (
            <div
              key={m.id}
              style={{
                position: 'absolute',
                left: '50%',
                top: '0',
                transform: `translateX(-50%) rotate(${rotasjoner[i]}deg)`,
                backgroundColor: 'white',
                padding: '10px 10px 36px 10px',
                borderRadius: '4px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.12)',
                width: '160px',
                zIndex: 5 - i,
                transition: 'transform 0.2s',
              }}
            >
              {m.bilde_url ? (
                <div style={{ width: '140px', height: '140px', overflow: 'hidden' }}>
                  <img src={m.bilde_url} alt="Minne" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ width: '140px', height: '140px', backgroundColor: '#fdf0ef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ fontSize: '32px' }}>💌</p>
                </div>
              )}
              {i === 0 && (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#4a4a42', textAlign: 'center', marginTop: '6px', position: 'absolute', bottom: '10px', left: 0, right: 0 }}>
                  {new Date(m.dato).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Galleri-modal */}
      {visGalleri && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#fcf9f2', zIndex: 300, overflowY: 'auto' }}>
          <div style={{ padding: '52px 20px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c0392b', marginBottom: '4px' }}>
                  Fra S ❤️
                </p>
                <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '28px', fontWeight: 800, color: '#1c1c18', letterSpacing: '-0.02em' }}>
                  Minneskrin
                </h1>
              </div>
              <button onClick={() => setVisGalleri(false)} style={{ background: '#f0ece3', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} color="#4a4a42" />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {lesteMeldinger.map((m, i) => (
                <div
                  key={m.id}
                  onClick={() => { setValgtIndex(i); }}
                  style={{ backgroundColor: 'white', padding: '10px 10px 32px 10px', borderRadius: '4px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', cursor: 'pointer', transform: `rotate(${rotasjoner[i]}deg)`, transition: 'transform 0.2s', margin: '8px' }}
                >
                  {m.bilde_url ? (
                    <div style={{ width: '100%', aspectRatio: '1/1', overflow: 'hidden' }}>
                      <img src={m.bilde_url} alt="Minne" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div style={{ width: '100%', aspectRatio: '1/1', backgroundColor: '#fdf0ef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <p style={{ fontSize: '32px' }}>💌</p>
                    </div>
                  )}
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#4a4a42', textAlign: 'center', marginTop: '8px' }}>
                    {new Date(m.dato).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Enkelt brev-modal */}
      {valgtIndex !== null && valgt && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setValgtIndex(null)}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: '24px', width: '100%', maxWidth: '400px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ background: 'linear-gradient(135deg, #8b1a4a 0%, #c0392b 100%)', borderRadius: '24px 24px 0 0', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {valgtIndex > 0 && (
                  <button onClick={forrige} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronLeft size={14} color="white" />
                  </button>
                )}
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)' }}>
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

            <div style={{ padding: '24px' }}>
              {valgt.bilde_url && (
                <div style={{ backgroundColor: 'white', padding: '10px 10px 32px 10px', borderRadius: '4px', boxShadow: '0 4px 15px rgba(0,0,0,0.15)', marginBottom: '24px', transform: `rotate(${rotasjoner[valgtIndex]}deg)` }}>
                  <div style={{ width: '100%', aspectRatio: '1/1', overflow: 'hidden' }}>
                    <img src={valgt.bilde_url} alt="Minne" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                </div>
              )}

              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#c0392b', marginBottom: '16px' }}>
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
