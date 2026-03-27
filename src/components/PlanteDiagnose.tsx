'use client'
import { useState, useRef } from 'react'
import { Camera, Loader, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface Sykdom {
  navn: string
  lokalNavn: string
  sannsynlighet: number
  erSkadelig: boolean
  beskrivelse: string
  behandling: {
    biologisk?: string
    kjemisk?: string
    forebygging?: string
  }
}

interface DiagnoseResultat {
  erSun: boolean
  sunSannsynlighet: number
  sykdommer: Sykdom[]
}

export default function PlanteDiagnose({ planteId, planteNavn }: { planteId: string, planteNavn: string }) {
  const [laster, setLaster] = useState(false)
  const [resultat, setResultat] = useState<DiagnoseResultat | null>(null)
  const [feil, setFeil] = useState('')
  const [åpenSykdom, setÅpenSykdom] = useState<number | null>(null)
  const [visResultat, setVisResultat] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function håndterBilde(e: React.ChangeEvent<HTMLInputElement>) {
    const fil = e.target.files?.[0]
    if (!fil) return
    setLaster(true)
    setFeil('')
    setResultat(null)
    const leser = new FileReader()
    leser.onload = async (ev) => {
      const base64 = (ev.target?.result as string)?.split(',')[1]
      if (!base64) { setLaster(false); return }
      try {
        const res = await fetch('/api/plantid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bilde: base64, type: 'diagnose' })
        })
        const data = await res.json()
        if (!data.result) { setFeil('Prøv et klarere bilde.'); setLaster(false); return }
        const erSun = data.result.is_healthy?.binary ?? true
        const sunSannsynlighet = Math.round((data.result.is_healthy?.probability ?? 1) * 100)
        const sykdommer: Sykdom[] = (data.result.disease?.suggestions || [])
          .filter((s: any) => s.probability > 0.05)
          .slice(0, 4)
          .map((s: any) => ({
            navn: s.name,
            lokalNavn: s.details?.local_name || s.name,
            sannsynlighet: Math.round(s.probability * 100),
            erSkadelig: s.details?.is_harmful !== false,
            beskrivelse: s.details?.description || '',
            behandling: {
              biologisk: s.details?.treatment?.biological,
              kjemisk: s.details?.treatment?.chemical,
              forebygging: s.details?.treatment?.prevention,
            }
          }))
        setResultat({ erSun, sunSannsynlighet, sykdommer })
        setVisResultat(true)
      } catch (e) {
        setFeil('Noe gikk galt. Prøv igjen.')
      }
      setLaster(false)
    }
    leser.readAsDataURL(fil)
  }

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={håndterBilde} style={{ display: 'none' }} />

      <button
        onClick={() => inputRef.current?.click()}
        disabled={laster}
        style={{ flex: 1, padding: '18px', borderRadius: '16px', border: 'none', backgroundColor: '#f0ece3', cursor: laster ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
      >
        {laster ? <Loader size={18} color="#4a4a42" /> : <Camera size={18} color="#4a4a42" />}
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '15px', fontWeight: 700, color: '#4a4a42' }}>
          {laster ? 'Analyserer...' : 'AI-diagnose'}
        </span>
      </button>

      {visResultat && resultat && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }} onClick={() => setVisResultat(false)}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fcf9f2', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', width: '100%', maxHeight: '80vh', overflowY: 'auto', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '18px', fontWeight: 700, color: '#1c1c18' }}>Diagnose – {planteNavn}</p>
              <button onClick={() => setVisResultat(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4a4a42' }}>Lukk</button>
            </div>
            <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: resultat.erSun ? '#d4e8d0' : '#fdf0ef', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              {resultat.erSun ? <CheckCircle size={24} color="#154212" /> : <AlertTriangle size={24} color="#c0392b" />}
              <div>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '16px', fontWeight: 700, color: resultat.erSun ? '#154212' : '#c0392b' }}>
                  {resultat.erSun ? 'Planten ser frisk ut! 🌿' : 'Planten kan ha problemer'}
                </p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: resultat.erSun ? '#4a7c59' : '#c0392b', marginTop: '2px' }}>
                  {resultat.sunSannsynlighet}% sannsynlighet for god helse
                </p>
              </div>
            </div>
            {resultat.sykdommer.length > 0 && (
              <div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4a4a42', marginBottom: '8px' }}>Funn</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {resultat.sykdommer.map((s, i) => (
                    <div key={i} style={{ borderRadius: '14px', overflow: 'hidden', backgroundColor: '#f0ece3' }}>
                      <button onClick={() => setÅpenSykdom(åpenSykdom === i ? null : i)} style={{ width: '100%', padding: '14px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: s.erSkadelig ? '#c0392b' : '#4a7c59', flexShrink: 0 }} />
                          <div>
                            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#1c1c18' }}>{s.lokalNavn}</p>
                            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#4a4a42' }}>{s.sannsynlighet}% sannsynlighet</p>
                          </div>
                        </div>
                        {åpenSykdom === i ? <ChevronUp size={16} color="#4a4a42" /> : <ChevronDown size={16} color="#4a4a42" />}
                      </button>
                      {åpenSykdom === i && (
                        <div style={{ padding: '0 14px 14px' }}>
                          {s.beskrivelse && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#4a4a42', lineHeight: 1.6, marginBottom: '12px' }}>{s.beskrivelse}</p>}
                          {s.behandling.forebygging && <div style={{ marginBottom: '8px' }}><p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#154212', marginBottom: '4px' }}>🛡️ Forebygging</p><p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#4a4a42', lineHeight: 1.5 }}>{s.behandling.forebygging}</p></div>}
                          {s.behandling.biologisk && <div style={{ marginBottom: '8px' }}><p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#154212', marginBottom: '4px' }}>🌿 Biologisk behandling</p><p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#4a4a42', lineHeight: 1.5 }}>{s.behandling.biologisk}</p></div>}
                          {s.behandling.kjemisk && <div><p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#4a4a42', marginBottom: '4px' }}>⚗️ Kjemisk behandling</p><p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#4a4a42', lineHeight: 1.5 }}>{s.behandling.kjemisk}</p></div>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => inputRef.current?.click()} style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', backgroundColor: '#f0ece3', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: '#4a4a42', marginTop: '16px' }}>
              Ta nytt bilde
            </button>
          </div>
        </div>
      )}
    </>
  )
}
