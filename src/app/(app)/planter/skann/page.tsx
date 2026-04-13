'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Loader, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react'

interface Sykdom {
  navn: string
  lokalNavn: string
  sannsynlighet: number
  beskrivelse: string
  behandling: { forebygging?: string }
}

interface DiagnoseResultat {
  erSun: boolean
  sunSannsynlighet: number
  sykdommer: Sykdom[]
}

function norskNavn(navn: string): string {
  const o: Record<string, string> = {
    'water excess or uneven watering': 'Ujevn eller overdreven vanning',
    'water deficiency': 'For lite vann',
    'nutrient deficiency': 'Næringsmangel',
    'overwatering': 'For mye vann',
    'underwatering': 'For lite vann',
    'root rot': 'Råtne røtter',
    'leaf spot': 'Bladflekker',
    'powdery mildew': 'Meldugg',
    'spider mites': 'Spinnmidd',
    'aphids': 'Bladlus',
    'sunburn': 'Solbrenthet',
    'low humidity': 'For lav luftfuktighet',
  }
  const lower = navn.toLowerCase()
  for (const [en, no] of Object.entries(o)) {
    if (lower.includes(en)) return no
  }
  return navn
}

export default function SkannPlante() {
  const [laster, setLaster] = useState(false)
  const [resultat, setResultat] = useState<DiagnoseResultat | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function håndterBilde(e: React.ChangeEvent<HTMLInputElement>) {
    const fil = e.target.files?.[0]
    if (!fil) return
    setLaster(true)
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
        if (!data.result) { setLaster(false); return }
        const erSun = data.result.is_healthy?.binary ?? true
        const sunSannsynlighet = Math.round((data.result.is_healthy?.probability ?? 1) * 100)
        const sykdommer: Sykdom[] = (data.result.disease?.suggestions || [])
          .filter((s: any) => s.probability > 0.15)
          .slice(0, 3)
          .map((s: any) => ({
            navn: s.name,
            lokalNavn: norskNavn(s.name),
            sannsynlighet: Math.round(s.probability * 100),
            beskrivelse: s.details?.description || '',
            behandling: { forebygging: s.details?.treatment?.prevention },
          }))
        setResultat({ erSun, sunSannsynlighet, sykdommer })
      } catch (e) { console.error(e) }
      setLaster(false)
    }
    leser.readAsDataURL(fil)
  }

  return (
    <div style={{ paddingTop: '52px', paddingBottom: '32px' }}>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={håndterBilde} style={{ display: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4a4a42', padding: 0 }}>
          <ArrowLeft size={16} /> Tilbake
        </button>
      </div>

      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: '#4a7c59', marginBottom: '6px', textTransform: 'uppercase' }}>AI-diagnose</p>
      <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '36px', fontWeight: 800, color: '#1c1c18', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '32px' }}>Skann plante</h1>

      {!resultat && !laster && (
        <button
          onClick={() => inputRef.current?.click()}
          style={{ width: '100%', padding: '24px', borderRadius: '20px', border: '2px dashed #c4c0b7', backgroundColor: '#f0ece3', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}
        >
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#154212', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Camera size={28} color="white" />
          </div>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '16px', fontWeight: 700, color: '#1c1c18' }}>Ta bilde av planten</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#4a4a42', textAlign: 'center' }}>AI-en analyserer tegn på sykdom, skadedyr og stressfaktorer</p>
        </button>
      )}

      {laster && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '48px 0' }}>
          <Loader size={32} color="#154212" />
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4a4a42' }}>Analyserer planten...</p>
        </div>
      )}

      {resultat && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: resultat.erSun ? '#d4e8d0' : '#fdf0ef', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {resultat.erSun ? <CheckCircle size={28} color="#154212" /> : <AlertTriangle size={28} color="#c0392b" />}
            <div>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '17px', fontWeight: 700, color: resultat.erSun ? '#154212' : '#c0392b' }}>
                {resultat.erSun ? 'Planten ser frisk ut! 🌿' : 'Planten kan ha det vanskelig'}
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: resultat.erSun ? '#4a7c59' : '#c0392b', marginTop: '2px' }}>
                {resultat.sunSannsynlighet}% sannsynlighet for god helse
              </p>
            </div>
          </div>

          {resultat.sykdommer.map((s, i) => (
            <div key={i} style={{ borderRadius: '16px', padding: '16px', backgroundColor: '#f0ece3' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: '#1c1c18', marginBottom: '6px' }}>{s.lokalNavn}</p>
              {s.beskrivelse && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#4a4a42', lineHeight: 1.6 }}>{s.beskrivelse}</p>}
              {s.behandling.forebygging && (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#154212', marginTop: '8px', fontWeight: 600 }}>
                  🛡️ {s.behandling.forebygging}
                </p>
              )}
            </div>
          ))}

          <button
            onClick={() => { setResultat(null); setTimeout(() => inputRef.current?.click(), 100) }}
            style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', backgroundColor: '#154212', color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '15px', fontWeight: 700, cursor: 'pointer', marginTop: '8px' }}
          >
            Skann en ny plante
          </button>
        </div>
      )}
    </div>
  )
}
