'use client'
import { useState, useRef } from 'react'
import { Camera, Loader, AlertTriangle, CheckCircle } from 'lucide-react'

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

function norskNavn(navn: string): string {
  const oversettelser: Record<string, string> = {
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
    'scale insects': 'Skjoldlus',
    'fungal infection': 'Soppinfeksjon',
    'bacterial infection': 'Bakterieinfeksjon',
    'sunburn': 'Solbrenthet',
    'frost damage': 'Frostskade',
    'low humidity': 'For lav luftfuktighet',
    'temperature stress': 'Temperaturstress',
  }
  const lower = navn.toLowerCase()
  for (const [engelsk, norsk] of Object.entries(oversettelser)) {
    if (lower.includes(engelsk)) return norsk
  }
  return navn
}

function lagAnbefaling(sykdommer: Sykdom[], erSun: boolean): string {
  if (erSun && sykdommer.length === 0) return 'Planten din ser ut til å ha det bra! Fortsett med den vanlige stellerutinen.'
  const viktigste = sykdommer[0]
  if (!viktigste) return 'Planten ser generelt frisk ut.'
  const navn = viktigste.navn.toLowerCase()
  if (navn.includes('water excess') || navn.includes('overwater')) return 'Prøv å vanne sjeldnere og la jorda tørke litt mellom vanningene. Sjekk at potten har godt med drenering.'
  if (navn.includes('water deficiency') || navn.includes('underwater')) return 'Planten kan trenge mer vann. Prøv å vanne litt oftere og sjekk at jorda ikke er helt uttørket.'
  if (navn.includes('nutrient')) return 'Planten kan mangle næring. Prøv å gjødsle lett med et allsidig gjødsel i vekstsesongen.'
  if (navn.includes('root rot')) return 'Mulig råte i røttene. Ta planten ut av potten og sjekk røttene – brune, bløte røtter bør fjernes.'
  if (navn.includes('spider mite')) return 'Tegn på spinnmidd. Spray bladene med vann eller neemolje-løsning, særlig undersiden av bladene.'
  if (navn.includes('aphid')) return 'Mulig bladlus. Sjekk undersiden av bladene og behandle med neemolje eller insektsåpe.'
  if (navn.includes('sunburn')) return 'Planten kan ha fått for mye direkte sol. Flytt den litt lenger unna vinduet.'
  if (navn.includes('humidity')) return 'For lav luftfuktighet. Spray bladene regelmessig eller sett planten på et fat med vann og stein.'
  if (viktigste.behandling.forebygging) return viktigste.behandling.forebygging
  return 'Følg med på planten de neste dagene og se om tilstanden endrer seg.'
}

async function komprimer(fil: File, maksBredd = 1200): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(fil)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ratio = Math.min(1, maksBredd / img.width)
      canvas.width = img.width * ratio
      canvas.height = img.height * ratio
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.82).split(',')[1])
    }
    img.src = url
  })
}

export default function PlanteDiagnose({ planteId, planteNavn }: { planteId: string, planteNavn: string }) {
  const [laster, setLaster] = useState(false)
  const [resultat, setResultat] = useState<DiagnoseResultat | null>(null)
  const [visResultat, setVisResultat] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function håndterBilde(e: React.ChangeEvent<HTMLInputElement>) {
    const fil = e.target.files?.[0]
    if (!fil) return
    setLaster(true)
    setResultat(null)
    try {
      const base64 = await komprimer(fil)
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
          .filter((s: any) => s.probability > 0.15 && s.details?.is_harmful !== false)
          .slice(0, 3)
          .map((s: any) => ({
            navn: s.name,
            lokalNavn: norskNavn(s.name),
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
        console.error(e)
      }
      setLaster(false)
    } catch (err) {
      console.error(err)
      setLaster(false)
    }
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
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fcf9f2', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', width: '100%', maxHeight: '85vh', overflowY: 'auto', boxSizing: 'border-box' }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '18px', fontWeight: 700, color: '#1c1c18' }}>Diagnose – {planteNavn}</p>
              <button onClick={() => setVisResultat(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4a4a42' }}>Lukk</button>
            </div>

            <div style={{ padding: '16px', borderRadius: '16px', backgroundColor: resultat.erSun ? '#d4e8d0' : '#fdf0ef', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
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

            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#4a4a42', lineHeight: 1.5, marginBottom: '16px', fontStyle: 'italic' }}>
              Plant.id analyserer tegn på sykdom og skadedyr. Naturlig bladfall og aldring av enkeltblader er normalt – ta gjerne nærbilde av et blad du er bekymret for.
            </p>

            <div style={{ padding: '16px', borderRadius: '16px', backgroundColor: '#f0ece3', marginBottom: '16px' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4a4a42', marginBottom: '8px' }}>
                💡 Anbefaling
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1c1c18', lineHeight: 1.6 }}>
                {lagAnbefaling(resultat.sykdommer, resultat.erSun)}
              </p>
            </div>

            {resultat.sykdommer.length > 0 && (
              <div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4a4a42', marginBottom: '10px' }}>
                  Funn
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {resultat.sykdommer.map((s, i) => (
                    <div key={i} style={{ borderRadius: '14px', padding: '14px', backgroundColor: '#f0ece3' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#c0392b', flexShrink: 0 }} />
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: '#1c1c18' }}>{s.lokalNavn}</p>
                      </div>
                      {s.beskrivelse && (
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#4a4a42', lineHeight: 1.6, marginBottom: s.behandling.forebygging ? '10px' : '0' }}>
                          {s.beskrivelse}
                        </p>
                      )}
                      {s.behandling.forebygging && (
                        <div style={{ borderTop: '1px solid #e8e4db', paddingTop: '10px' }}>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#154212', marginBottom: '4px' }}>🛡️ Forebygging</p>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#4a4a42', lineHeight: 1.5 }}>{s.behandling.forebygging}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => { setVisResultat(false); setTimeout(() => inputRef.current?.click(), 100) }} style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', backgroundColor: '#f0ece3', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: '#4a4a42', marginTop: '16px' }}>
              Ta nytt bilde
            </button>
          </div>
        </div>
      )}
    </>
  )
}
