'use client'
import { useState, useEffect } from 'react'

export default function Onboarding({ onFerdig }: { onFerdig: () => void }) {
  const [steg, setSteg] = useState<'gave' | 'åpner' | 'brev' | 'inn'>('gave')
  const [konfetti, setKonfetti] = useState<any[]>([])
  const [brevLinjer, setBrevLinjer] = useState(0)

  const linjer = [
    'Kjære Shnæffen min.',
    'Gratulerer så mye med dagen.',
    'Jeg har laget noe til deg.',
    'Håper du liker det.',
    '– S ❤️',
  ]

  function åpneGave() {
    setSteg('åpner')
    const farger = ['#ffd700', '#ff69b4', '#98fb98', '#87ceeb', '#dda0dd', '#ffa07a', '#fff', '#c8e6c9', '#ff6b6b', '#a8e6cf']
    const nyeKonfetti = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      farge: farger[Math.floor(Math.random() * farger.length)],
      delay: i * 0.015,
      dx: (Math.random() - 0.5) * 500,
      dy: -(80 + Math.random() * 400),
      rot: (Math.random() - 0.5) * 720,
      størrelse: i % 4 === 0 ? 14 : i % 3 === 0 ? 5 : 8 + Math.random() * 6,
      bredde: i % 5 === 0 ? 4 : undefined,
      form: i % 3 === 0 ? '50%' : i % 4 === 0 ? '2px' : '3px',
    }))
    setKonfetti(nyeKonfetti)
    setTimeout(() => {
      setSteg('brev')
      setKonfetti([])
    }, 2200)
  }

  useEffect(() => {
    if (steg === 'brev') {
      let i = 0
      const intervall = setInterval(() => {
        i++
        setBrevLinjer(i)
        if (i >= linjer.length) clearInterval(intervall)
      }, 500)
      return () => clearInterval(intervall)
    }
  }, [steg])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      backgroundColor: '#0d1f0e',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px',
      transition: steg === 'inn' ? 'opacity 2s ease' : undefined,
      opacity: steg === 'inn' ? 0 : 1,
    }}>

      <style>{`
        @keyframes puls-gave {
          0%, 100% { transform: scale(1) rotate(-1deg); }
          50% { transform: scale(1.04) rotate(1deg); }
        }
        @keyframes lokk-opp {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-120px) rotate(-15deg); opacity: 0; }
        }
        @keyframes konfetti-fly {
          0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
          60% { opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) rotate(var(--rot)) scale(0.4); opacity: 0; }
        }
        @keyframes brev-inn {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-opp {
          0% { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Konfetti */}
      {konfetti.map(k => (
        <div key={k.id} style={{
          position: 'fixed',
          left: '50%', top: '45%',
          width: (k.bredde || k.størrelse) + 'px',
          height: k.størrelse + 'px',
          backgroundColor: k.farge,
          borderRadius: k.form,
          animation: `konfetti-fly 2s cubic-bezier(0.2, 0.8, 0.4, 1) ${k.delay}s both`,
          '--dx': k.dx + 'px',
          '--dy': k.dy + 'px',
          '--rot': k.rot + 'deg',
          pointerEvents: 'none',
          zIndex: 999,
        } as any} />
      ))}

      {/* STEG: GAVE */}
      {(steg === 'gave' || steg === 'åpner') && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}>
          <p style={{
            fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600,
            letterSpacing: '0.15em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.5)', marginBottom: '8px',
          }}>
            Til Oda 🎀
          </p>

          {/* Gave-illustrasjon */}
          <div style={{ position: 'relative', width: '160px', animation: steg === 'gave' ? 'puls-gave 2.5s ease-in-out infinite' : 'none' }}>

            {/* Lokk med sløyfe inni – animerer sammen */}
            <div style={{
              width: '176px', height: '48px',
              marginLeft: '-8px',
              backgroundColor: '#3a7a32',
              borderRadius: '10px 10px 0 0',
              position: 'relative',
              animation: steg === 'åpner' ? 'lokk-opp 0.6s cubic-bezier(0.3, -0.5, 0.7, 1) 0.1s both' : 'none',
              zIndex: 2,
              boxShadow: '0 -2px 12px rgba(0,0,0,0.3)',
              overflow: 'visible',
            }}>
              {/* Bånd på lokk */}
              <div style={{
                position: 'absolute', left: '50%', transform: 'translateX(-50%)',
                top: 0, bottom: 0, width: '22px',
                backgroundColor: '#ffd700',
              }} />
              {/* Sløyfe – sitter på toppen av lokket */}
              <div style={{ position: 'absolute', top: '-22px', left: '50%', transform: 'translateX(-50%)', display: 'flex' }}>
                <div style={{ width: '32px', height: '22px', borderRadius: '50% 50% 0 50%', border: '5px solid #ffd700', borderBottom: 'none', borderRight: 'none' }} />
                <div style={{ width: '32px', height: '22px', borderRadius: '50% 50% 50% 0', border: '5px solid #ffd700', borderBottom: 'none', borderLeft: 'none' }} />
              </div>
            </div>

            {/* Eske – mørkere grønn */}
            <div style={{
              width: '160px', height: '128px',
              backgroundColor: '#154212',
              borderRadius: '0 0 16px 16px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}>
              {/* Bånd på eske */}
              <div style={{
                position: 'absolute', left: '50%', transform: 'translateX(-50%)',
                top: 0, bottom: 0, width: '22px',
                backgroundColor: '#ffd700',
              }} />
              {/* Horisontalt bånd */}
              <div style={{
                position: 'absolute', top: '40%', left: 0, right: 0, height: '22px',
                backgroundColor: '#ffd700',
              }} />
              {/* Glans */}
              <div style={{
                position: 'absolute', top: '12px', left: '14px',
                width: '28px', height: '10px',
                backgroundColor: 'rgba(255,255,255,0.12)',
                borderRadius: '50%', transform: 'rotate(-20deg)',
              }} />
            </div>
          </div>

          {steg === 'gave' && (
            <button
              onClick={åpneGave}
              style={{
                padding: '16px 40px',
                borderRadius: '999px',
                border: 'none',
                backgroundColor: '#ffd700',
                color: '#1c1c18',
                fontFamily: 'Manrope, sans-serif',
                fontSize: '16px', fontWeight: 800,
                cursor: 'pointer',
                animation: 'fade-opp 0.8s ease-out 0.5s both',
                letterSpacing: '-0.01em',
              }}
            >
              Åpne 🎁
            </button>
          )}
        </div>
      )}

      {/* STEG: BREV */}
      {steg === 'brev' && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px',
          animation: 'fade-opp 0.6s ease-out both',
          maxWidth: '320px', width: '100%',
        }}>
          <div style={{
            backgroundColor: '#fcf9f2',
            borderRadius: '20px',
            padding: '32px 28px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          }}>
            <p style={{
              fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: '#4a7c59', marginBottom: '20px',
            }}>
              🌱 En liten hilsen
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {linjer.slice(0, brevLinjer).map((linje, i) => (
                <p key={i} style={{
                  fontFamily: i === linjer.length - 1 ? 'Manrope, sans-serif' : 'Georgia, serif',
                  fontSize: i === linjer.length - 1 ? '16px' : '17px',
                  fontWeight: i === linjer.length - 1 ? 700 : 400,
                  color: i === linjer.length - 1 ? '#c0392b' : '#1c1c18',
                  lineHeight: 1.6,
                  fontStyle: i < linjer.length - 1 ? 'italic' : 'normal',
                  animation: 'brev-inn 0.4s ease-out both',
                  textAlign: i === linjer.length - 1 ? 'right' : 'left',
                }}>
                  {linje}
                </p>
              ))}
            </div>
          </div>

          {brevLinjer >= linjer.length && (
            <button
              onClick={() => {
                setSteg('inn')
                setTimeout(onFerdig, 2000)
              }}
              style={{
                padding: '18px 48px',
                borderRadius: '999px',
                border: 'none',
                background: 'linear-gradient(135deg, #154212 0%, #2d5a27 100%)',
                color: 'white',
                fontFamily: 'Manrope, sans-serif',
                fontSize: '16px', fontWeight: 800,
                cursor: 'pointer',
                animation: 'fade-opp 0.6s ease-out both',
                letterSpacing: '-0.01em',
                boxShadow: '0 8px 32px rgba(21, 66, 18, 0.4)',
              }}
            >
              Åpne hagen din 🌱
            </button>
          )}
        </div>
      )}
    </div>
  )
}
