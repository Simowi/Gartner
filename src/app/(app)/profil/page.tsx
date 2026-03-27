'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, LogOut, Camera } from 'lucide-react'
import BildeOpplaster from '@/components/BildeOpplaster'

export default function ProfilPage() {
  const [navn, setNavn] = useState('')
  const [epost, setEpost] = useState('')
  const [bildeUrl, setBildeUrl] = useState('')
  const [bleMedDato, setBleMedDato] = useState('')
  const [laster, setLaster] = useState(true)
  const [lagrer, setLagrer] = useState(false)
  const [lagret, setLagret] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function hentProfil() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setEpost(user.email || '')
      setBleMedDato(new Date(user.created_at).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' }))

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setNavn(data.navn || '')
        setBildeUrl(data.bilde_url || '')
      }
      setLaster(false)
    }
    hentProfil()
  }, [])

  async function lagreProfil() {
    setLagrer(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('profiles').upsert({
      id: user.id,
      navn: navn.trim(),
      bilde_url: bildeUrl || null,
    })

    setLagrer(false)
    setLagret(true)
    setTimeout(() => setLagret(false), 2000)
  }

  async function loggUt() {
    await supabase.auth.signOut()
    window.location.href = '/logg-inn'
  }

  if (laster) return (
    <div style={{ paddingTop: '52px', textAlign: 'center' }}>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4a4a42' }}>Laster...</p>
    </div>
  )

  return (
    <div style={{ paddingTop: '52px', paddingBottom: '32px' }}>

      {/* Header */}
      <div style={{ marginBottom: '36px' }}>
        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', padding: '0', marginBottom: '20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4a4a42' }}>
          <ArrowLeft size={16} /> Tilbake
        </button>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: '#4a7c59', marginBottom: '6px', textTransform: 'uppercase' }}>
          Konto
        </p>
        <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '36px', fontWeight: 800, color: '#1c1c18', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          Profil
        </h1>
      </div>

      {/* Profilbilde */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ marginBottom: '12px', width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#d4e8d0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {bildeUrl ? (
            <img src={bildeUrl} alt={navn} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '36px', fontWeight: 700, color: '#154212' }}>
              {navn ? navn[0].toUpperCase() : epost[0].toUpperCase()}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <label style={{ padding: '8px 16px', borderRadius: '12px', backgroundColor: '#f0ece3', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#1c1c18', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Camera size={14} color="#1c1c18" />
            Bytt bilde
            <input type="file" accept="image/*" capture="environment" onChange={async (e) => {
              const fil = e.target.files?.[0]
              if (!fil) return
              const { data: { user } } = await supabase.auth.getUser()
              if (!user) return
              const filnavn = user.id + '/profil-' + Date.now() + '.' + fil.name.split('.').pop()
              await supabase.storage.from('plantebilder').upload(filnavn, fil, { upsert: true })
              const { data } = supabase.storage.from('plantebilder').getPublicUrl(filnavn)
              setBildeUrl(data.publicUrl)
            }} style={{ display: 'none' }} />
          </label>
          {bildeUrl && (
            <button onClick={() => setBildeUrl('')} style={{ padding: '8px 16px', borderRadius: '12px', border: 'none', backgroundColor: '#fdf0ef', color: '#c0392b', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              Slett
            </button>
          )}
        </div>
      </div>

      {/* Skjema */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>

        <div>
          <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4a4a42', display: 'block', marginBottom: '6px' }}>
            Navn
          </label>
          <input
            type="text"
            value={navn}
            onChange={(e) => setNavn(e.target.value)}
            placeholder="Ditt navn"
            style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: 'none', backgroundColor: '#f0ece3', fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#1c1c18', outline: 'none' }}
          />
        </div>

        <div>
          <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4a4a42', display: 'block', marginBottom: '6px' }}>
            E-post
          </label>
          <div style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', backgroundColor: '#f0ece3', fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#4a4a42' }}>
            {epost}
          </div>
        </div>

        <div>
          <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4a4a42', display: 'block', marginBottom: '6px' }}>
            Gartner siden
          </label>
          <div style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', backgroundColor: '#f0ece3', fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#4a4a42' }}>
            {bleMedDato}
          </div>
        </div>

        <button
          onClick={lagreProfil}
          disabled={lagrer}
          style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', backgroundColor: lagret ? '#4a7c59' : '#154212', color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '15px', fontWeight: 700, cursor: lagrer ? 'not-allowed' : 'pointer', opacity: lagrer ? 0.7 : 1, transition: 'background-color 0.2s' }}
        >
          {lagret ? 'Lagret! ✓' : lagrer ? 'Lagrer...' : 'Lagre profil'}
        </button>
      </div>

      {/* Admin */}
      <button
        onClick={() => window.location.href = '/admin/meldinger'}
        style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', backgroundColor: '#f0ece3', color: '#1c1c18', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '10px' }}
      >
        💌 Rediger daglige meldinger
      </button>

      {/* Logg ut */}
      <button
        onClick={loggUt}
        style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', backgroundColor: '#fdf0ef', color: '#c0392b', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
      >
        <LogOut size={15} color="#c0392b" /> Logg ut
      </button>
    </div>
  )
}
