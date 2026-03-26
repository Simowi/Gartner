'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Droplets, Leaf, Trash2, MapPin, Calendar, FileText, CheckCircle } from 'lucide-react'

interface Plante {
  id: string
  navn: string
  art: string
  plassering: string
  vanning_intervall_dager: number
  sist_vannet: string
  neste_vanning: string
  notater: string
  bilde_url: string
  opprettet_at: string
}

export default function PlanteProfil() {
  const [plante, setPlante] = useState<Plante | null>(null)
  const [laster, setLaster] = useState(true)
  const [vannerNå, setVannerNå] = useState(false)
  const [sletterNå, setSletterNå] = useState(false)
  const [bekreftSlett, setBekreftSlett] = useState(false)
  const [toast, setToast] = useState('')
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  useEffect(() => {
    async function hentPlante() {
      const { data } = await supabase
        .from('planter')
        .select('*')
        .eq('id', params.id)
        .single()
      if (data) setPlante(data)
      setLaster(false)
    }
    hentPlante()
  }, [params.id])

  function visToast(melding: string) {
    setToast(melding)
    setTimeout(() => setToast(''), 3000)
  }

  async function registrerVanning() {
    if (!plante) return
    setVannerNå(true)
    const nå = new Date()
    const nestVanning = new Date()
    nestVanning.setDate(nestVanning.getDate() + plante.vanning_intervall_dager)
    const { error } = await supabase.from('planter').update({
      sist_vannet: nå.toISOString(),
      neste_vanning: nestVanning.toISOString(),
    }).eq('id', plante.id)
    if (!error) {
      await supabase.from('vanningslogg').insert({ plante_id: plante.id, vannet_at: nå.toISOString() })
      setPlante({ ...plante, sist_vannet: nå.toISOString(), neste_vanning: nestVanning.toISOString() })
      visToast('Vanning registrert! 💧')
    } else {
      visToast('Noe gikk galt, prøv igjen.')
    }
    setVannerNå(false)
  }

  async function slettPlante() {
    if (!plante) return
    setSletterNå(true)
    await supabase.from('planter').delete().eq('id', plante.id)
    router.push('/planter')
  }

  const formaterDato = (dato: string) => {
    if (!dato) return '–'
    return new Date(dato).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const dagTilVanning = (dato: string) => {
    if (!dato) return null
    const diff = Math.ceil((new Date(dato).getTime() - Date.now()) / 86400000)
    if (diff < 0) return 'Forfalt med ' + Math.abs(diff) + ' dager!'
    if (diff === 0) return 'I dag!'
    if (diff === 1) return 'I morgen'
    return 'Om ' + diff + ' dager'
  }

  const vanningFarge = (dato: string) => {
    if (!dato) return '#4a7c59'
    const diff = Math.ceil((new Date(dato).getTime() - Date.now()) / 86400000)
    if (diff < 0) return '#c0392b'
    if (diff === 0) return '#e67e22'
    return '#4a7c59'
  }

  if (laster) return (
    <div style={{ paddingTop: '52px', textAlign: 'center' }}>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4a4a42' }}>Laster...</p>
    </div>
  )

  if (!plante) return (
    <div style={{ paddingTop: '52px', textAlign: 'center' }}>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4a4a42' }}>Planten ble ikke funnet.</p>
    </div>
  )

  return (
    <div style={{ paddingTop: '52px', paddingBottom: '32px' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 100, backgroundColor: '#154212', color: 'white', padding: '12px 20px', borderRadius: '999px', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 32px rgba(21, 66, 18, 0.3)', whiteSpace: 'nowrap' }}>
          <CheckCircle size={16} color="white" />
          {toast}
        </div>
      )}

      {/* Tilbake-knapp */}
      <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', padding: '0', marginBottom: '20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4a4a42' }}>
        <ArrowLeft size={16} /> Tilbake
      </button>

      {/* Hero-bilde */}
      {plante.bilde_url && (
        <div style={{ width: '100%', height: '240px', borderRadius: '20px', overflow: 'hidden', marginBottom: '24px' }}>
          <img src={plante.bilde_url} alt={plante.navn} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {/* Navn og art */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
        {!plante.bilde_url && (
          <div style={{ width: '72px', height: '72px', borderRadius: '20px', backgroundColor: '#d4e8d0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Leaf size={30} color="#154212" />
          </div>
        )}
        <div>
          <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '32px', fontWeight: 800, color: '#1c1c18', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '4px' }}>
            {plante.navn}
          </h1>
          {plante.art && (
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4a4a42', fontStyle: 'italic' }}>
              {plante.art}
            </p>
          )}
        </div>
      </div>

      {/* Vann nå-knapp */}
      <button onClick={registrerVanning} disabled={vannerNå} style={{ width: '100%', padding: '18px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg, #154212 0%, #2d5a27 100%)', color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '16px', fontWeight: 700, cursor: vannerNå ? 'not-allowed' : 'pointer', opacity: vannerNå ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
        <Droplets size={18} color="white" />
        {vannerNå ? 'Registrerer...' : 'Registrer vanning nå'}
      </button>

      {/* Info-kort */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>

        <div style={{ borderRadius: '16px', padding: '16px', backgroundColor: '#f0ece3' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Droplets size={15} color={vanningFarge(plante.neste_vanning)} />
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4a4a42' }}>Neste vanning</p>
          </div>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '18px', fontWeight: 700, color: vanningFarge(plante.neste_vanning) }}>
            {dagTilVanning(plante.neste_vanning)}
          </p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#4a4a42', marginTop: '2px' }}>
            {formaterDato(plante.neste_vanning)} · Hver {plante.vanning_intervall_dager}. dag
          </p>
        </div>

        <div style={{ borderRadius: '16px', padding: '16px', backgroundColor: '#f0ece3' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Calendar size={15} color="#4a4a42" />
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4a4a42' }}>Sist vannet</p>
          </div>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '18px', fontWeight: 700, color: '#1c1c18' }}>
            {formaterDato(plante.sist_vannet)}
          </p>
        </div>

        {plante.plassering && (
          <div style={{ borderRadius: '16px', padding: '16px', backgroundColor: '#f0ece3' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <MapPin size={15} color="#4a4a42" />
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4a4a42' }}>Plassering</p>
            </div>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '18px', fontWeight: 700, color: '#1c1c18' }}>
              {plante.plassering}
            </p>
          </div>
        )}

        {plante.notater && (
          <div style={{ borderRadius: '16px', padding: '16px', backgroundColor: '#f0ece3' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <FileText size={15} color="#4a4a42" />
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4a4a42' }}>Notater</p>
            </div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1c1c18', lineHeight: 1.6 }}>
              {plante.notater}
            </p>
          </div>
        )}
      </div>

      {/* Slett */}
      {!bekreftSlett ? (
        <button onClick={() => setBekreftSlett(true)} style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', backgroundColor: '#fdf0ef', color: '#c0392b', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Trash2 size={15} /> Slett plante
        </button>
      ) : (
        <div style={{ borderRadius: '16px', padding: '16px', backgroundColor: '#fdf0ef' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1c1c18', marginBottom: '12px', textAlign: 'center' }}>
            Er du sikker på at du vil slette <strong>{plante.navn}</strong>?
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setBekreftSlett(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: '#f0ece3', color: '#1c1c18', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
              Avbryt
            </button>
            <button onClick={slettPlante} disabled={sletterNå} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: '#c0392b', color: 'white', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
              {sletterNå ? 'Sletter...' : 'Ja, slett'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
