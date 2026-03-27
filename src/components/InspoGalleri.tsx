'use client'
import { useEffect, useState, useRef } from 'react'
import { Loader, ChevronLeft, ChevronRight } from 'lucide-react'

interface Bilde {
  id: string
  url: string
  tommel: string
  fotograf: string
  fotografUrl: string
  unsplashUrl: string
  downloadUrl: string
}

const MAKS_BILDER = 30

export default function InspoGalleri() {
  const [bilder, setBilder] = useState<Bilde[]>([])
  const [laster, setLaster] = useState(true)
  const [lasterMer, setLasterMer] = useState(false)
  const [valgtIndex, setValgtIndex] = useState<number | null>(null)
  const [nåddMaks, setNåddMaks] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const lastKnappRef = useRef<HTMLDivElement>(null)
    const touchStartY = useRef<number | null>(null)

  async function hentBilder() {
    try {
      const res = await fetch('/api/inspo')
      const data = await res.json()
      if (data.bilder) {
        setBilder(data.bilder)
        if (data.bilder.length >= MAKS_BILDER) setNåddMaks(true)
      }
    } catch (e) {}
    setLaster(false)
  }

  async function hentFlereBilder() {
    if (lasterMer || nåddMaks) return
    setLasterMer(true)
    try {
      const res = await fetch('/api/inspo')
      const data = await res.json()
      if (data.bilder) {
        setBilder(prev => {
          const eksisterendeIds = new Set(prev.map(b => b.id))
          const nye = data.bilder.filter((b: Bilde) => !eksisterendeIds.has(b.id))
          const kombinert = [...prev, ...nye]
          if (kombinert.length >= MAKS_BILDER) {
            setNåddMaks(true)
            return kombinert.slice(0, MAKS_BILDER)
          }
          return kombinert
        })
      }
    } catch (e) {}
    setLasterMer(false)
  }

  useEffect(() => { hentBilder() }, [])

  useEffect(() => {
    if (!lastKnappRef.current || nåddMaks) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !lasterMer && !nåddMaks) {
          hentFlereBilder()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(lastKnappRef.current)
    return () => observer.disconnect()
  }, [bilder, lasterMer, nåddMaks])

  useEffect(() => {
    if (!lastKnappRef.current || nåddMaks) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !lasterMer && !nåddMaks) {
          hentFlereBilder()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(lastKnappRef.current)
    return () => observer.disconnect()
  }, [bilder, lasterMer, nåddMaks])

  async function registrerNedlasting(bilde: Bilde) {
    try {
      await fetch(`/api/inspo/download?url=${encodeURIComponent(bilde.downloadUrl)}`)
    } catch (e) {}
  }

  function åpneBilde(index: number) {
    setValgtIndex(index)
    registrerNedlasting(bilder[index])
  }

  function forrige() {
    setValgtIndex(prev => prev !== null ? Math.max(0, prev - 1) : null)
  }

  function neste() {
    setValgtIndex(prev => prev !== null ? Math.min(bilder.length - 1, prev + 1) : null)
  }

  function håndterTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  function håndterTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) neste()
      else forrige()
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  if (laster || bilder.length === 0) return null

  const valgtBilde = valgtIndex !== null ? bilder[valgtIndex] : null

  return (
    <div style={{ marginBottom: '32px' }}>
      <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '22px', fontWeight: 700, color: '#1c1c18', marginBottom: '14px', letterSpacing: '-0.01em' }}>
        Planteinspo 🌿
      </h2>

      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '6px', alignItems: 'center' }}>
        {bilder.map((bilde, i) => (
          <div
            key={bilde.id}
            onClick={() => åpneBilde(i)}
            style={{ flexShrink: 0, width: '80vw', height: '260px', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
          >
            <img src={bilde.tommel} alt="Planteinspo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 8px 6px', background: 'linear-gradient(transparent, rgba(0,0,0,0.5))' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: 'rgba(255,255,255,0.8)' }}>
                📷 {bilde.fotograf}
              </p>
            </div>
          </div>
        ))}

        {!nåddMaks && (
          <div ref={lastKnappRef} style={{ flexShrink: 0, width: '60px', height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {lasterMer && <Loader size={20} color="#c4c0b7" />}
          </div>
        )}
      </div>

      {/* Lightbox med sveip */}
      {valgtBilde && valgtIndex !== null && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onTouchStart={håndterTouchStart}
          onTouchEnd={håndterTouchEnd}
        >
          {/* Lukk */}
          <button onClick={() => setValgtIndex(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', color: 'white', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ×
          </button>

          {/* Teller */}
          <p style={{ position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
            {valgtIndex + 1} / {bilder.length}
          </p>

          {/* Forrige-knapp */}
          {valgtIndex > 0 && (
            <button onClick={forrige} style={{ position: 'absolute', left: '12px', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={22} color="white" />
            </button>
          )}

          {/* Neste-knapp */}
          {valgtIndex < bilder.length - 1 && (
            <button onClick={neste} style={{ position: 'absolute', right: '12px', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={22} color="white" />
            </button>
          )}

          {/* Bilde */}
          <img src={valgtBilde.url} alt="Planteinspo" style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '12px' }} />

          {/* Fotograf */}
          <p style={{ marginTop: '12px', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
            Foto av{' '}
            <a href={valgtBilde.fotografUrl + '?utm_source=gartner&utm_medium=referral'} target="_blank" rel="noopener" style={{ color: 'rgba(255,255,255,0.9)' }}>
              {valgtBilde.fotograf}
            </a>
            {' '}på{' '}
            <a href={valgtBilde.unsplashUrl + '?utm_source=gartner&utm_medium=referral'} target="_blank" rel="noopener" style={{ color: 'rgba(255,255,255,0.9)' }}>
              Unsplash
            </a>
          </p>

          {/* Prikker */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '14px' }}>
            {bilder.map((_, i) => (
              <div key={i} onClick={() => åpneBilde(i)} style={{ width: i === valgtIndex ? '16px' : '6px', height: '6px', borderRadius: '3px', backgroundColor: i === valgtIndex ? 'white' : 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.2s' }} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
