'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Search, X } from 'lucide-react'
import { søkPlanteArt, planteArtDatabase, type PlanteArt } from '@/lib/plantedatabase'
import BildeOpplaster from '@/components/BildeOpplaster'

interface Plante {
  id: string
  navn: string
  art: string
  art_id: string
  plassering: string
  vanning_intervall_dager: number
  notater: string
  bilde_url: string
}

export default function RedigerPlante() {
  const [plante, setPlante] = useState<Plante | null>(null)
  const [navn, setNavn] = useState('')
  const [artSøk, setArtSøk] = useState('')
  const [valgtArt, setValgtArt] = useState<PlanteArt | null>(null)
  const [artForslag, setArtForslag] = useState<PlanteArt[]>([])
  const [visForslag, setVisForslag] = useState(false)
  const [plassering, setPlassering] = useState('')
  const [vanningIntervall, setVanningIntervall] = useState('7')
  const [notater, setNotater] = useState('')
  const [bildeUrl, setBildeUrl] = useState('')
  const [laster, setLaster] = useState(true)
  const [lagrer, setLagrer] = useState(false)
  const [feil, setFeil] = useState('')
  const søkRef = useRef<HTMLDivElement>(null)
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
        setNavn(data.navn || '')
        setPlassering(data.plassering || '')
        setVanningIntervall(String(data.vanning_intervall_dager || 7))
        setNotater(data.notater || '')
        setBildeUrl(data.bilde_url || '')
        if (data.art_id) {
          const funnetArt = planteArtDatabase.find(a => a.id === data.art_id)
          if (funnetArt) { setValgtArt(funnetArt); setArtSøk(funnetArt.norskNavn) }
        } else if (data.art) {
          setArtSøk(data.art)
        }
      }
      setLaster(false)
    }
    hentPlante()
  }, [params.id])

  useEffect(() => {
    function klikketUtenfor(e: MouseEvent) {
      if (søkRef.current && !søkRef.current.contains(e.target as Node)) setVisForslag(false)
    }
    document.addEventListener('mousedown', klikketUtenfor)
    return () => document.removeEventListener('mousedown', klikketUtenfor)
  }, [])

  function håndterArtSøk(verdi: string) {
    setArtSøk(verdi)
    if (valgtArt) setValgtArt(null)
    const resultater = søkPlanteArt(verdi)
    setArtForslag(resultater)
    setVisForslag(resultater.length > 0)
  }

  function velgArt(art: PlanteArt) {
    setValgtArt(art)
    setArtSøk(art.norskNavn)
    setArtForslag([])
    setVisForslag(false)
    setVanningIntervall(String(art.vanningIntervallDager))
  }

  async function lagrePlante() {
    if (!navn.trim()) { setFeil('Planten må ha et navn.'); return }
    setLagrer(true)
    setFeil('')
    const { error } = await supabase.from('planter').update({
      navn: navn.trim(),
      art: valgtArt ? valgtArt.latinskNavn : artSøk.trim(),
      art_id: valgtArt?.id || null,
      plassering: plassering.trim(),
      vanning_intervall_dager: parseInt(vanningIntervall),
      notater: notater.trim(),
      bilde_url: bildeUrl || null,
    }).eq('id', params.id)
    if (error) { setFeil('Noe gikk galt. Prøv igjen.'); setLagrer(false) }
    else router.push('/planter/' + params.id)
  }

  const inputStil = { width: '100%', padding: '14px 16px', borderRadius: '14px', border: 'none', backgroundColor: '#f0ece3', fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#1c1c18', outline: 'none' }
  const labelStil = { fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#4a4a42', display: 'block', marginBottom: '6px' }
  const plasseringer = ['Stue', 'Spisestue', 'Kjøkken', 'Kontor', 'Toalett', 'Balkong', 'Hage', 'Soverom oppe', 'Soverom nede', 'Kjellerstue', 'Kjellerbad', 'Musikkrom', 'Bod']
  const vanningsvalg = [
    { label: 'Hver dag', verdi: '1' },
    { label: 'Annenhver dag', verdi: '2' },
    { label: 'To ganger i uka', verdi: '3' },
    { label: 'Hver uke', verdi: '7' },
    { label: 'Hver 10. dag', verdi: '10' },
    { label: 'Annenhver uke', verdi: '14' },
    { label: 'En gang i måneden', verdi: '30' },
  ]
  const vanskelighetsLabel: Record<string, string> = { lett: '🟢 Lett', middels: '🟡 Middels', krevende: '🔴 Krevende' }

  if (laster) return (
    <div style={{ paddingTop: '52px', textAlign: 'center' }}>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4a4a42' }}>Laster...</p>
    </div>
  )

  return (
    <div style={{ paddingTop: '52px', paddingBottom: '32px' }}>
      <div style={{ marginBottom: '36px' }}>
        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', padding: '0', marginBottom: '20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4a4a42' }}>
          <ArrowLeft size={16} /> Tilbake
        </button>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: '#4a7c59', marginBottom: '6px', textTransform: 'uppercase' }}>Rediger</p>
        <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '36px', fontWeight: 800, color: '#1c1c18', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          {plante?.navn}
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        <div>
          <label style={labelStil}>Bilde</label>
          <BildeOpplaster onBildeLastetOpp={(url) => setBildeUrl(url)} eksisterendeBilde={bildeUrl} />
        </div>

        <div ref={søkRef}>
          <label style={labelStil}>Art / plantetype</label>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#4a4a42" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input type="text" value={artSøk} onChange={(e) => håndterArtSøk(e.target.value)} onFocus={() => artForslag.length > 0 && setVisForslag(true)} placeholder="Søk etter art..." style={{ ...inputStil, paddingLeft: '42px', paddingRight: valgtArt ? '42px' : '16px', backgroundColor: valgtArt ? '#d4e8d0' : '#f0ece3' }} />
            {valgtArt && (
              <button onClick={() => { setValgtArt(null); setArtSøk('') }} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={16} color="#4a4a42" />
              </button>
            )}
          </div>
          {visForslag && artForslag.length > 0 && (
            <div style={{ backgroundColor: '#fdfaf3', borderRadius: '14px', boxShadow: '0 8px 32px rgba(28,28,24,0.12)', marginTop: '6px', overflow: 'hidden', border: '1px solid #f0ece3' }}>
              {artForslag.map((art, i) => (
                <button key={art.id} onMouseDown={() => velgArt(art)} style={{ width: '100%', padding: '14px 16px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left', borderBottom: i < artForslag.length - 1 ? '1px solid #f0ece3' : 'none', display: 'block' }}>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '15px', fontWeight: 700, color: '#1c1c18', marginBottom: '2px' }}>{art.norskNavn}</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#4a4a42', fontStyle: 'italic' }}>{art.latinskNavn}</p>
                </button>
              ))}
            </div>
          )}
          {valgtArt && (
            <div style={{ marginTop: '12px', borderRadius: '16px', padding: '14px', backgroundColor: '#f0ece3', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '14px', fontWeight: 700, color: '#1c1c18' }}>{valgtArt.norskNavn}</p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#4a4a42', fontStyle: 'italic' }}>{valgtArt.latinskNavn}</p>
              </div>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '999px', backgroundColor: '#d4e8d0', color: '#154212', flexShrink: 0, marginLeft: '8px' }}>
                {vanskelighetsLabel[valgtArt.vanskelighetsgrad]}
              </span>
            </div>
          )}
        </div>

        <div>
          <label style={labelStil}>Kallenavn / navn *</label>
          <input type="text" value={navn} onChange={(e) => setNavn(e.target.value)} style={inputStil} />
        </div>

        <div>
          <label style={labelStil}>Plassering</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {plasseringer.map((p) => (
              <button key={p} onClick={() => setPlassering(plassering === p ? '' : p)} style={{ padding: '8px 16px', borderRadius: '999px', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, backgroundColor: plassering === p ? '#154212' : '#f0ece3', color: plassering === p ? 'white' : '#1c1c18' }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={labelStil}>Vanningsintervall</label>
          <select value={vanningIntervall} onChange={(e) => setVanningIntervall(e.target.value)} style={{ ...inputStil, cursor: 'pointer' }}>
            {vanningsvalg.map((v) => (<option key={v.verdi} value={v.verdi}>{v.label}</option>))}
          </select>
          {valgtArt && (
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#4a7c59', marginTop: '6px' }}>
              💡 Anbefalt for {valgtArt.norskNavn}: hver {valgtArt.vanningIntervallDager}. dag
            </p>
          )}
        </div>

        <div>
          <label style={labelStil}>Notater</label>
          <textarea value={notater} onChange={(e) => setNotater(e.target.value)} rows={3} style={{ ...inputStil, resize: 'none', lineHeight: '1.5' }} />
        </div>

        {feil && (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#c0392b', textAlign: 'center', padding: '12px', backgroundColor: '#fdf0ef', borderRadius: '10px' }}>
            {feil}
          </p>
        )}

        <button onClick={lagrePlante} disabled={lagrer} style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', backgroundColor: '#154212', color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '15px', fontWeight: 700, cursor: lagrer ? 'not-allowed' : 'pointer', opacity: lagrer ? 0.7 : 1 }}>
          {lagrer ? 'Lagrer...' : 'Lagre endringer 🌿'}
        </button>
      </div>
    </div>
  )
}
