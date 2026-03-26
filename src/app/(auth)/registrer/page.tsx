'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Leaf } from 'lucide-react'

export default function RegistrerPage() {
  const [epost, setEpost] = useState('')
  const [passord, setPassord] = useState('')
  const [navn, setNavn] = useState('')
  const [laster, setLaster] = useState(false)
  const [feil, setFeil] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function registrer() {
    setLaster(true)
    setFeil('')
    const { error } = await supabase.auth.signUp({
      email: epost,
      password: passord,
      options: { data: { navn } },
    })
    if (error) {
      setFeil('Noe gikk galt. Prøv igjen.')
      setLaster(false)
    } else {
      router.push('/hjem')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#fcf9f2',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>

        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            backgroundColor: '#154212',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Leaf size={28} color="white" />
          </div>
          <h1 style={{
            fontFamily: 'Manrope, sans-serif',
            fontSize: '32px',
            fontWeight: 800,
            color: '#1c1c18',
            letterSpacing: '-0.03em',
          }}>
            Kom i gang
          </h1>
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            color: '#4a4a42',
            marginTop: '6px',
          }}>
            Opprett din Gartner-konto
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#4a4a42',
              display: 'block',
              marginBottom: '6px',
            }}>
              Navn
            </label>
            <input
              type="text"
              value={navn}
              onChange={(e) => setNavn(e.target.value)}
              placeholder="Ditt navn"
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '14px',
                border: 'none',
                backgroundColor: '#f0ece3',
                fontFamily: 'Inter, sans-serif',
                fontSize: '15px',
                color: '#1c1c18',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#4a4a42',
              display: 'block',
              marginBottom: '6px',
            }}>
              E-post
            </label>
            <input
              type="email"
              value={epost}
              onChange={(e) => setEpost(e.target.value)}
              placeholder="deg@eksempel.no"
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '14px',
                border: 'none',
                backgroundColor: '#f0ece3',
                fontFamily: 'Inter, sans-serif',
                fontSize: '15px',
                color: '#1c1c18',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#4a4a42',
              display: 'block',
              marginBottom: '6px',
            }}>
              Passord
            </label>
            <input
              type="password"
              value={passord}
              onChange={(e) => setPassord(e.target.value)}
              placeholder="Minst 6 tegn"
              onKeyDown={(e) => e.key === 'Enter' && registrer()}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '14px',
                border: 'none',
                backgroundColor: '#f0ece3',
                fontFamily: 'Inter, sans-serif',
                fontSize: '15px',
                color: '#1c1c18',
                outline: 'none',
              }}
            />
          </div>

          {feil && (
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              color: '#c0392b',
              textAlign: 'center',
            }}>
              {feil}
            </p>
          )}

          <button
            onClick={registrer}
            disabled={laster}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '14px',
              border: 'none',
              backgroundColor: '#154212',
              color: 'white',
              fontFamily: 'Manrope, sans-serif',
              fontSize: '15px',
              fontWeight: 700,
              cursor: laster ? 'not-allowed' : 'pointer',
              opacity: laster ? 0.7 : 1,
              marginTop: '8px',
            }}
          >
            {laster ? 'Oppretter konto...' : 'Opprett konto'}
          </button>

          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            color: '#4a4a42',
            textAlign: 'center',
            marginTop: '8px',
          }}>
            Har du allerede konto?{' '}
            <a href="/logg-inn" style={{ color: '#154212', fontWeight: 600 }}>
              Logg inn
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
