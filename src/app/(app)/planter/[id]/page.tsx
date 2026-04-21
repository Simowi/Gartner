'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import PlanteDiagnose from '@/components/PlanteDiagnose'
import PlanteTidslinje from '@/components/PlanteTidslinje'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Droplets, Leaf, Trash2, MapPin, Calendar, FileText, CheckCircle, Sun, Sprout, AlertTriangle, BookOpen, Pencil } from 'lucide-react'
import { planteArtDatabase, type PlanteArt } from '@/lib/plantedatabase'

interface Plante {
  id: string
  navn: string
  art: string
  plassering: string
  vanning_intervall_dager: number
  gjodsel_intervall_dager: number
  sist_vannet: string
  neste_vanning: string
  sist_gjødslet: string
  neste_gjødsling: string
  notater: string
  bilde_url: string
  opprettet_at: string
}

export default function PlanteProfil() {
  const [plante, setPlante] = useState<Plante | null>(null)
  const [laster, setLaster] = useState(true)
  const [vannerNå, setVannerNå] = useState(false)
  const [gjødslerNå, setGjødslerNå] = useState(false)
  const [sletterNå, setSletterNå] = useState(false)
  const [bekreftSlett, setBekreftSlett] = useState(false)
  const [toast, setToast] = useState('')
  const [artInfo, setArtInfo] = useState<PlanteArt | null>(null)
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
      if (data) {
        setPlante(data)
        // Prøv art_id først, deretter match på latinsk navn
        if (data.art_id) {
          const funnetArt = planteArtDatabase.find(a => a.id === data.art_id)
          if (funnetArt) {
            setArtInfo(funnetArt)
          }
        } else if (data.art) {
          const lower = data.art.toLowerCase().trim()
          const safeDb = planteArtDatabase.filter(Boolean)
          const funnetArt =
            safeDb.find(a => a.latinskNavn?.toLowerCase() === lower) ||
            safeDb.find(a => a.latinskNavn?.toLowerCase().includes(lower)) ||
            safeDb.find(a => lower.includes(a.latinskNavn?.toLowerCase() || '')) ||
            safeDb.find(a => a.aliaser?.some(al => al.toLowerCase() === lower)) ||
            safeDb.find(a => a.latinskNavn?.toLowerCase().split(' ')[0] === lower.split(' ')[0])
          if (funnetArt) setArtInfo(funnetArt)
        }
      }
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

  async function registrerGjødsling() {
    if (!plante) return
    setGjødslerNå(true)
    const na = new Date()
    const nestGjødsling = new Date()
    const intervall = plante.gjodsel_intervall_dager || 30
    nestGjødsling.setDate(nestGjødsling.getDate() + intervall)
    const { error } = await supabase.from('planter').update({
      sist_gjødslet: na.toISOString(),
      neste_gjødsling: nestGjødsling.toISOString(),
    }).eq('id', plante.id)
    if (!error) {
      visToast('Gjødsling registrert! 🌱')
    }
    setGjødslerNå(false)
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

      {/* Tilbake-knapp og rediger */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button onClick={() => router.push('/hjem')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', padding: '0', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4a4a42' }}>
          <ArrowLeft size={16} /> Tilbake
        </button>
        <button onClick={() => router.push('/planter/' + params.id + '/rediger')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', border: 'none', backgroundColor: '#f0ece3', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#1c1c18' }}>
          <Pencil size={14} color="#1c1c18" /> Rediger
        </button>
      </div>

      {/* Hero-bilde */}
      {plante.bilde_url && (
        <div style={{ width: '100%', height: '240px', borderRadius: '20px', overflow: 'hidden', marginBottom: '24px' }}>
          <img src={plante.bilde_url + '?width=600&height=600&resize=cover'} alt={plante.navn} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="eager" />
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
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', alignItems: 'stretch' }}>
        <button onClick={registrerVanning} disabled={vannerNå} style={{ flex: 1, padding: '18px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg, #154212 0%, #2d5a27 100%)', color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '16px', fontWeight: 700, cursor: vannerNå ? 'not-allowed' : 'pointer', opacity: vannerNå ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Droplets size={18} color="white" />
          {vannerNå ? 'Registrerer...' : 'Vann nå'}
        </button>
        <PlanteDiagnose planteId={plante.id} planteNavn={plante.navn} />
      </div>
      <button onClick={registrerGjødsling} disabled={gjødslerNå} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: 'none', backgroundColor: '#d4e8d0', color: '#154212', fontFamily: 'Manrope, sans-serif', fontSize: '15px', fontWeight: 700, cursor: gjødslerNå ? 'not-allowed' : 'pointer', opacity: gjødslerNå ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
        <span style={{ fontSize: '16px' }}>🌱</span>
        {gjødslerNå ? 'Registrerer...' : 'Gjødsle nå'}
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

      {/* Artsinformasjon */}
      {artInfo && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <BookOpen size={15} color="#4a4a42" />
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4a4a42' }}>Om arten</p>
          </div>

          <div style={{ borderRadius: '16px', padding: '16px', backgroundColor: '#f0ece3', marginBottom: '10px' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1c1c18', lineHeight: 1.6, marginBottom: '12px' }}>
              {artInfo.beskrivelse}
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#4a4a42', fontStyle: 'italic' }}>
              Familie: {artInfo.familie} · Opprinnelse: {artInfo.opprinnelse}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
            {[
              { label: 'Lys', verdi: artInfo.lysforhold === 'lite' ? 'Lite' : artInfo.lysforhold === 'middels' ? 'Middels' : 'Mye' },
              { label: 'Luftfukt.', verdi: artInfo.luftfuktighet === 'lav' ? 'Lav' : artInfo.luftfuktighet === 'middels' ? 'Middels' : 'Høy' },
              { label: 'Vanskelighet', verdi: artInfo.vanskelighetsgrad === 'lett' ? '🟢 Lett' : artInfo.vanskelighetsgrad === 'middels' ? '🟡 Middels' : '🔴 Krevende' },
            ].map(({ label, verdi }) => (
              <div key={label} style={{ backgroundColor: '#f0ece3', borderRadius: '12px', padding: '10px 12px' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#4a4a42', marginBottom: '3px' }}>{label}</p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#1c1c18' }}>{verdi}</p>
              </div>
            ))}
          </div>

          {(artInfo.giftig || artInfo.giftigForDyr) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: '#fdf0ef', borderRadius: '12px', marginBottom: '10px' }}>
              <AlertTriangle size={15} color="#c0392b" />
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#c0392b', fontWeight: 500 }}>
                {artInfo.giftig && artInfo.giftigForDyr ? 'Giftig for mennesker og dyr' : artInfo.giftigForDyr ? 'Giftig for kjæledyr' : 'Giftig for mennesker'}
              </p>
            </div>
          )}

          <div style={{ borderRadius: '16px', padding: '16px', backgroundColor: '#f0ece3', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Sprout size={14} color="#154212" />
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4a4a42' }}>Stelletips</p>
            </div>
            {artInfo.stell.map((tips, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: i < artInfo.stell.length - 1 ? '8px' : '0' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#154212', fontWeight: 700, flexShrink: 0 }}>·</span>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#1c1c18', lineHeight: 1.5 }}>{tips}</p>
              </div>
            ))}
          </div>

          <div style={{ borderRadius: '16px', padding: '16px', backgroundColor: '#f0ece3' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Sun size={14} color="#154212" />
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4a4a42' }}>Visste du at</p>
            </div>
            {artInfo.fakta.map((fakt, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: i < artInfo.fakta.length - 1 ? '8px' : '0' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#154212', fontWeight: 700, flexShrink: 0 }}>·</span>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#1c1c18', lineHeight: 1.5 }}>{fakt}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <PlanteTidslinje planteId={plante.id} />

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
