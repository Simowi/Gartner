'use client'
import { useState, useEffect, useRef } from 'react'
import Onboarding from '@/components/Onboarding'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Leaf, CalendarDays, Camera, Plus, ScanLine, Stethoscope } from 'lucide-react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [visOnboarding, setVisOnboarding] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [visMeny, setVisMeny] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const sveipStartX = useRef(0)
  const sveipStartY = useRef(0)
  const erKantSveip = useRef(false)

  const faner = ['/hjem', '/planter', '/kalender']

  useEffect(() => {
    setMounted(true)
    const sett = localStorage.getItem('gartner_onboarding_sett')
    if (!sett) setVisOnboarding(true)
  }, [])

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      const x = e.touches[0].clientX
      sveipStartX.current = x
      sveipStartY.current = e.touches[0].clientY
      erKantSveip.current = x < 30 || x > window.innerWidth - 30
    }

    function onTouchEnd(e: TouchEvent) {
      if (!erKantSveip.current) return
      const dx = e.changedTouches[0].clientX - sveipStartX.current
      const dy = e.changedTouches[0].clientY - sveipStartY.current
      if (Math.abs(dy) > Math.abs(dx)) return
      if (Math.abs(dx) < 50) return
      const idx = faner.indexOf(pathname)
      if (idx === -1) return
      if (dx < 0 && idx < faner.length - 1) {
        router.push(faner[idx + 1])
      } else if (dx > 0 && idx > 0) {
        router.push(faner[idx - 1])
      }
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [pathname, router])

  function onFerdig() {
    localStorage.setItem('gartner_onboarding_sett', 'ja')
    setVisOnboarding(false)
  }

  const nav = [
    { href: '/hjem', icon: Home, label: 'Hjem' },
    { href: '/planter', icon: Leaf, label: 'Planter' },
    { href: '/kalender', icon: CalendarDays, label: 'Kalender' },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fcf9f2' }}>
      {mounted && visOnboarding && <Onboarding onFerdig={onFerdig} />}
      <main style={{ paddingBottom: '100px', maxWidth: '640px', margin: '0 auto', padding: '0 24px 100px 24px' }}>
        {children}
      </main>
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, padding: '0 24px 24px 24px' }}>
        <div style={{
          maxWidth: '640px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          borderRadius: '20px',
          padding: '12px 16px',
          backgroundColor: 'rgba(253, 250, 243, 0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 8px 32px rgba(28, 28, 24, 0.08), 0 0 0 1px rgba(196, 192, 183, 0.3)',
        }}>
          {nav.map(({ href, icon: Icon, label }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '4px', textDecoration: 'none',
                opacity: active ? 1 : 0.4, transition: 'opacity 0.2s',
              }}>
                <Icon size={22} color={active ? '#154212' : '#1c1c18'} strokeWidth={active ? 2.2 : 1.8} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 500, color: active ? '#154212' : '#1c1c18' }}>
                  {label}
                </span>
              </Link>
            )
          })}

          {/* Kamera-knapp */}
          <div style={{ position: 'relative' }}>
            {visMeny && (
              <>
                <div onClick={() => setVisMeny(false)} style={{ position: 'fixed', inset: 0, zIndex: 49 }} />
                <div style={{
                  position: 'absolute', bottom: '64px', left: '50%', transform: 'translateX(-50%)',
                  backgroundColor: '#fdfaf3', borderRadius: '20px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(196,192,183,0.3)',
                  padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px',
                  zIndex: 51, minWidth: '200px'
                }}>
                  <Link href="/planter/skann" onClick={() => setVisMeny(false)} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 16px', borderRadius: '14px',
                    textDecoration: 'none', backgroundColor: '#f0ece3'
                  }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#154212', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Stethoscope size={18} color="white" />
                    </div>
                    <div>
                      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '14px', fontWeight: 700, color: '#1c1c18', margin: 0 }}>Diagnoser plante</p>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#4a4a42', margin: 0 }}>AI sjekker helsa</p>
                    </div>
                  </Link>
                  <Link href="/planter/ny?skann=true" onClick={() => setVisMeny(false)} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 16px', borderRadius: '14px',
                    textDecoration: 'none', backgroundColor: '#f0ece3'
                  }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#4a7c59', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ScanLine size={18} color="white" />
                    </div>
                    <div>
                      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '14px', fontWeight: 700, color: '#1c1c18', margin: 0 }}>Skann ny plante</p>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#4a4a42', margin: 0 }}>Identifiser med AI</p>
                    </div>
                  </Link>
                  <Link href="/planter/ny" onClick={() => setVisMeny(false)} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 16px', borderRadius: '14px',
                    textDecoration: 'none', backgroundColor: '#f0ece3'
                  }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#c4c0b7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Plus size={18} color="white" />
                    </div>
                    <div>
                      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '14px', fontWeight: 700, color: '#1c1c18', margin: 0 }}>Legg til manuelt</p>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#4a4a42', margin: 0 }}>Uten skanning</p>
                    </div>
                  </Link>
                </div>
              </>
            )}
            <button
              onClick={() => setVisMeny(v => !v)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                backgroundColor: visMeny ? '#0d2b0b' : '#154212',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(21,66,18,0.3)',
                transition: 'background-color 0.2s ease',
              }}>
                <Camera size={22} color="white" strokeWidth={2} />
              </div>
            </button>
          </div>
        </div>
      </nav>
    </div>
  )
}
