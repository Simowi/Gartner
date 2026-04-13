'use client'
import { useState, useEffect } from 'react'
import Onboarding from '@/components/Onboarding'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Leaf, Plus, CalendarDays, Camera } from 'lucide-react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [visOnboarding, setVisOnboarding] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [visMeny, setVisMeny] = useState(false)

  useEffect(() => {
    setMounted(true)
    const sett = localStorage.getItem('gartner_onboarding_sett')
    if (!sett) setVisOnboarding(true)
  }, [])

  function onFerdig() {
    localStorage.setItem('gartner_onboarding_sett', 'ja')
    setVisOnboarding(false)
  }

  const pathname = usePathname()

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

          {/* Handlingsknapp */}
          <div style={{ position: 'relative' }}>
            {visMeny && (
              <>
                <div onClick={() => setVisMeny(false)} style={{ position: 'fixed', inset: 0, zIndex: 49 }} />
                <div style={{ position: 'absolute', bottom: '60px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 51, minWidth: '160px' }}>
                  <Link href="/planter/ny" onClick={() => setVisMeny(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', textDecoration: 'none', backgroundColor: '#f0ece3' }}>
                    <Plus size={18} color="#154212" />
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#1c1c18' }}>Legg til plante</span>
                  </Link>
                  <Link href="/planter/skann" onClick={() => setVisMeny(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', textDecoration: 'none', backgroundColor: '#f0ece3' }}>
                    <Camera size={18} color="#154212" />
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#1c1c18' }}>Skann plante</span>
                  </Link>
                </div>
              </>
            )}
            <button
              onClick={() => setVisMeny(v => !v)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#154212', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(21,66,18,0.3)' }}>
                <Plus size={22} color="white" strokeWidth={2.2} />
              </div>
            </button>
          </div>
        </div>
      </nav>
    </div>
  )
}
