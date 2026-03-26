'use client'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Leaf, Search, X, AlertTriangle } from 'lucide-react'
import BildeOpplaster from '@/components/BildeOpplaster'
import { søkPlanteArt, type PlanteArt } from '@/lib/plantedatabase'

export default function NyPlantePage() {
  const [navn, setNavn] = useState('')
  const [artSøk, setArtSøk] = useState('')
  const [valgtArt, setValgtArt] = useState<PlanteArt | null>(null)
  const [artForslag, setArtForslag] = useState<PlanteArt[]>([])
  const [visForslag, setVisForslag] = useState(false)
  const [plassering, setPlassering] = useState('')
  const [vanningIntervall, setVanningIntervall] = useState('7')
  const [notater, setNotater] = useState('')
  const [bildeUrl, setBildeUrl] = useState('')
  const [laster, setLaster] = useState(false)
  const [feil, setFeil] = useState('')
  const søkRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    function klikketUtenfor(e: MouseEvent) {
      if (søkRef.current && !søkRef.current.contains(e.target as Node)) {
        setVisForslag(false)
      }
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
    if (!navn) setNavn(art.norskNavn)
    setVanningIntervall(String(art.vanningIntervallDager))
  }

  function fjernArt() {
    setValgtArt(null)
    setArtSøk('')
    setArtForslag([])
    setVisForslag(false)
  }

  async function leggTilPlante() {
    if (!navn.trim()) { setFeil('Planten må ha et navn.'); return }
    setLaster(true)
    setFeil('')
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) { setFeil('Du er ikke logget inn.'); setLaster(false); return }
      const nestVanning = new Date()
      nestVanning.setDate(nestVanning.getDate() + parseInt(vanningIntervall))
      const { error } = await supabase.from('planter').insert({
        bruker_id: user.id,
        navn: navn.trim(),
        art: valgtArt ? valgtArt.latinskNavn : artSøk.trim(),
        plassering: plassering.trim(),
        vanning_intervall_dager: parseInt(vanningIntervall),
        sist_vannet: new Date().toISOString(),
        neste_vanning: nestVanning.toISOString(),
        notater: notater.trim(),
        art_id: valgtArt?.id || null,
        bilde_url: bildeUrl || null,
      })
      if (error) { setFeil('Feil: ' + error.message); setLaster(false) }
      else { router.push('/planter'); router.refresh() }
    } catch (e) {
      setFeil('En uventet feil oppstod.')
      setLaster(false)
    }
  }

  const inputStil = {
    width: '100%', padding: '14px 16px', borderRadius: '14px', border: 'none',
    backgroundColor: '#f0ece3', fontFamily: 'Inter, sans-serif', fontSize: '15px',
    color: '#1c1c18', outline: 'none',
  }

  const labelStil = {
    fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600,
    letterSpacing: '0.08em', textTransform: 'uppercase' as const,
    color: '#4a4a42', display: 'block', marginBottom: '6px',
  }

  const plasseringer = ['Stue', 'Kjøkken', 'Soverom', 'Kontor', 'Bad', 'Balkong', 'Hage']
  const vanningsvalg = [
    { label: 'Hver dag', verdi: '1' },
    { label: 'Annenhver dag', verdi: '2' },
    { label: 'To ganger i uka', verdi: '3' },
    { label: 'Hver uke', verdi: '7' },
    { label: 'Hver 10. dag', verdi: '10' },
    { label: 'Annenhver uke', verdi: '14' },
    { label: 'En gang i måneden', verdi: '30' },
  ]

  const lysLabel: Record<string, string> = { lite: 'Lite lys', middels: 'Middels lys', mye: 'Mye lys' }
  const vanskelighetsLabel: Record<string, string> = { lett: '🟢 Lett', middels: '🟡 Middels', krevende: '🔴 Krevende' }
  const luftLabel: Record<string, string> = { lav: 'Lav', middels: 'Middels', høy: 'Høy' }

  return (
    <div style={{ paddingTop: '52px', paddingBottom: '32px' }}>
      <div style={{ marginBottom: '36px' }}>
        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', padding: '0', marginBottom: '20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4a4a42' }}>
          <ArrowLeft size={16} /> Tilbake
        </button>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: '#4a7c59', marginBottom: '6px', textTransform: 'uppercase' }}>
          Ny plante
        </p>
        <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '36px', fontWeight: 800, color: '#1c1c18', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          Legg til plante
        </h1>
      </div>

      <div style={{ width: '80px', height: '80px', borderRadius: '24px', backgroundColor: valgtArt ? '#d4e8d0' : '#f0ece3', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
        <Leaf size={36} color="#154212" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Artssøk */}
        <div ref={søkRef}>
          <label style={labelStil}>Art / plantetype</label>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#4a4a42" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1 }} />
            <input
              type="text"
              value={artSøk}
              onChange={(e) => håndterArtSøk(e.target.value)}
              onFocus={() => artForslag.length > 0 && setVisForslag(true)}
              placeholder="Søk etter art, f.eks. Monstera..."
              style={{ ...inputStil, paddingLeft: '42px', paddingRight: valgtArt ? '42px' : '16px', backgroundColor: valgtArt ? '#d4e8d0' : '#f0ece3' }}
            />
            {valgtArt && (
              <button onClick={fjernArt} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', zIndex: 1 }}>
                <X size={16} color="#4a4a42" />
              </button>
            )}
          </div>

          {/* Forslag */}
          {visForslag && artForslag.length > 0 && (
            <div style={{ backgroundColor: '#fdfaf3', borderRadius: '14px', boxShadow: '0 8px 32px rgba(28,28,24,0.12)', marginTop: '6px', overflow: 'hidden', border: '1px solid #f0ece3' }}>
              {artForslag.map((art, i) => (
                <button
                  key={art.id}
                  onMouseDown={() => velgArt(art)}
                  style={{ width: '100%', padding: '14px 16px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left', borderBottom: i < artForslag.length - 1 ? '1px solid #f0ece3' : 'none', display: 'block' }}
                >
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '15px', fontWeight: 700, color: '#1c1c18', marginBottom: '2px' }}>{art.norskNavn}</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#4a4a42', fontStyle: 'italic' }}>{art.latinskNavn}</p>
                </button>
              ))}
            </div>
          )}

          {/* Valgt art-kort */}
          {valgtArt && (
            <div style={{ marginTop: '12px', borderRadius: '16px', padding: '16px', backgroundColor: '#f0ece3' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '16px', fontWeight: 700, color: '#1c1c18' }}>{valgtArt.norskNavn}</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#4a4a42', fontStyle: 'italic' }}>{valgtArt.latinskNavn}</p>
                </div>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '999px', backgroundColor: '#d4e8d0', color: '#154212', flexShrink: 0, marginLeft: '8px' }}>
                  {vanskelighetsLabel[valgtArt.vanskelighetsgrad]}
                </span>
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#4a4a42', lineHeight: 1.5, marginBottom: '12px' }}>
                {valgtArt.beskrivelse}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                {[
                  { label: 'Lys', verdi: lysLabel[valgtArt.lysforhold] },
                  { label: 'Luftfuktighet', verdi: luftLabel[valgtArt.luftfuktighet] },
                  { label: 'Opprinnelse', verdi: valgtArt.opprinnelse.split('(')[0].trim() },
                ].map(({ label, verdi }) => (
                  <div key={label} style={{ backgroundColor: '#e8e4db', borderRadius: '10px', padding: '8px 10px' }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#4a4a42', marginBottom: '2px' }}>{label}</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#1c1c18' }}>{verdi}</p>
                  </div>
                ))}
              </div>
              {(valgtArt.giftig || valgtArt.giftigForDyr) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', backgroundColor: '#fdf0ef', borderRadius: '10px' }}>
                  <AlertTriangle size={14} color="#c0392b" />
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#c0392b', fontWeight: 500 }}>
                    {valgtArt.giftig && valgtArt.giftigForDyr ? 'Giftig for mennesker og dyr' : valgtArt.giftigForDyr ? 'Giftig for kjæledyr' : 'Giftig for mennesker'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bilde */}
        <div>
          <label style={labelStil}>Bilde</label>
          <BildeOpplaster onBildeLastetOpp={(url) => setBildeUrl(url)} />
        </div>

      {/* Navn */}
        <div>
          <label style={labelStil}>Kallenavn / navn *</label>
          <input type="text" value={navn} onChange={(e) => setNavn(e.target.value)} placeholder="f.eks. Monstera, Fredriksen..." style={inputStil} />
        </div>

        {/* Plassering */}
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

        {/* Vanningsintervall */}
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

        {/* Notater */}
        <div>
          <label style={labelStil}>Notater</label>
          <textarea value={notater} onChange={(e) => setNotater(e.target.value)} placeholder="Spesielle behov, minner, hvor du kjøpte den..." rows={3} style={{ ...inputStil, resize: 'none', lineHeight: '1.5' }} />
        </div>

        {feil && (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#c0392b', textAlign: 'center', padding: '12px', backgroundColor: '#fdf0ef', borderRadius: '10px' }}>
            {feil}
          </p>
        )}

        <button onClick={leggTilPlante} disabled={laster} style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', backgroundColor: '#154212', color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '15px', fontWeight: 700, cursor: laster ? 'not-allowed' : 'pointer', opacity: laster ? 0.7 : 1, marginTop: '8px' }}>
          {laster ? 'Lagrer...' : 'Legg til plante 🌿'}
        </button>
      </div>
    </div>
  )
}
