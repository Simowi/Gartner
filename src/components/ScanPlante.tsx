'use client'
import { useState, useRef } from 'react'
import { Camera, Loader, Leaf, CheckCircle, AlertTriangle, X } from 'lucide-react'
import { planteArtDatabase } from '@/lib/plantedatabase'

interface Forslag {
  navn: string
  norskNavn: string
  sannsynlighet: number
  artId: string | null
  sort?: string | null
  bildeUrl?: string | null
}

interface Props {
  onArtValgt: (artId: string, latinskNavn: string, norskNavn: string, vanningIntervall: number, bildeBase64: string, sort?: string | null) => void
}

export default function ScanPlante({ onArtValgt }: Props) {
  const [laster, setLaster] = useState(false)
  const [forslag, setForslag] = useState<Forslag[]>([])
  const [feil, setFeil] = useState('')
  const [valgt, setValgt] = useState<string | null>(null)
  const [bildeBase64, setBildeBase64] = useState('')
  const kameraRef = useRef<HTMLInputElement>(null)
  const galleriRef = useRef<HTMLInputElement>(null)

  function finnArtIDatabase(latinskNavn: string) {
    if (!latinskNavn) return null
    const lower = latinskNavn.toLowerCase().trim()
    try {
      // 1. Eksakt match på latinsk navn
      const eksakt = planteArtDatabase.find(p => p.latinskNavn?.toLowerCase() === lower)
      if (eksakt) return eksakt
      // 2. Match på aliaser
      const aliasMatch = planteArtDatabase.find(p =>
        p.aliaser?.some(a => a?.toLowerCase() === lower) ||
        p.aliaser?.some(a => lower.includes(a?.toLowerCase() || '')) ||
        p.aliaser?.some(a => (a?.toLowerCase() || '').includes(lower))
      )
      if (aliasMatch) return aliasMatch
      // 3. Latinsk navn inkluderer søket eller omvendt
      const delMatch = planteArtDatabase.find(p =>
        p.latinskNavn?.toLowerCase().includes(lower) ||
        lower.includes(p.latinskNavn?.toLowerCase() || '')
      )
      if (delMatch) return delMatch
      // 4. Match på første to ord av latinsk navn (slekt + art)
      const toOrd = lower.split(' ').slice(0, 2).join(' ')
      const toOrdMatch = planteArtDatabase.find(p =>
        p.latinskNavn?.toLowerCase().startsWith(toOrd)
      )
      if (toOrdMatch) return toOrdMatch
      // 5. Match kun på slektsnavn (første ord)
      const slekt = lower.split(' ')[0]
      return planteArtDatabase.find(p =>
        p.latinskNavn?.toLowerCase().split(' ')[0] === slekt
      ) || null
    } catch(e) {
      return null
    }
  }

  async function håndterBilde(e: React.ChangeEvent<HTMLInputElement>) {
    const fil = e.target.files?.[0]
    if (!fil) return

    setLaster(true)
    setFeil('')
    setForslag([])

    const leser = new FileReader()
    leser.onload = async (ev) => {
      const fullBase64 = ev.target?.result as string
      const base64 = fullBase64?.split(',')[1]
      if (!base64) { setLaster(false); return }
      setBildeBase64(fullBase64)

      try {
        const res = await fetch('/api/plantid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bilde: base64, type: 'identifiser', medBilder: true })
        })
        const data = await res.json()

        if (!data.result?.classification?.suggestions) {
          setFeil('Kunne ikke identifisere planten. Prøv et klarere bilde.')
          setLaster(false)
          return
        }

        const topp = data.result.classification.suggestions.slice(0, 3)
        const resultater: Forslag[] = topp.map((s: any) => {
          const artIDb = finnArtIDatabase(s.name)
          const norskNavn = artIDb?.norskNavn ||
            s.details?.common_names?.[0] ||
            s.name
          // Hent ut sort fra Plant.id-navn, f.eks. "Dahlia pinnata 'Café au Lait'" → "Café au Lait"
          const sortMatch = s.name.match(/['"'']([^'"'']+)['"'']/)
          const sort = sortMatch ? sortMatch[1] : null
          const bildeUrl = s.details?.image?.value || s.details?.images?.[0]?.value || null
          return {
            navn: s.name,
            norskNavn,
            sannsynlighet: Math.round(s.probability * 100),
            artId: artIDb?.id || null,
            sort,
            bildeUrl,
          }
        })

        setForslag(resultater)
      } catch (e: any) {
        console.error('Scan feil:', e)
        setFeil('Feil: ' + (e?.message || 'Ukjent feil'))
      }
      setLaster(false)
    }
    leser.readAsDataURL(fil)
  }

  function velgForslag(f: Forslag) {
    setValgt(f.navn)
    const artIDb = f.artId ? planteArtDatabase.find(p => p.id === f.artId) : null
    onArtValgt(
      f.artId || '',
      artIDb ? artIDb.latinskNavn : f.navn,
      f.norskNavn,
      artIDb ? artIDb.vanningIntervallDager : 7,
      bildeBase64,
      f.sort || null
    )
  }

  return (
    <div style={{ marginBottom: '8px' }}>
      {/* Kamera-input */}
      <input
        ref={kameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={håndterBilde}
        style={{ display: 'none' }}
      />
      {/* Galleri-input */}
      <input
        ref={galleriRef}
        type="file"
        accept="image/*"
        onChange={håndterBilde}
        style={{ display: 'none' }}
      />

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => kameraRef.current?.click()}
          disabled={laster}
          style={{
            flex: 1,
            padding: '14px',
            borderRadius: '16px',
            border: '2px dashed #d4e8d0',
            backgroundColor: '#f7fbf7',
            cursor: laster ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.15s',
          }}
        >
          {laster ? <Loader size={18} color="#4a7c59" /> : <Camera size={18} color="#4a7c59" />}
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '13px', fontWeight: 700, color: '#154212' }}>
            {laster ? 'Analyserer...' : 'Kamera'}
          </span>
        </button>
        <button
          onClick={() => galleriRef.current?.click()}
          disabled={laster}
          style={{
            flex: 1,
            padding: '14px',
            borderRadius: '16px',
            border: '2px dashed #d4e8d0',
            backgroundColor: '#f7fbf7',
            cursor: laster ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.15s',
          }}
        >
          <span style={{ fontSize: '16px' }}>🖼️</span>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '13px', fontWeight: 700, color: '#154212' }}>
            Galleri
          </span>
        </button>
      </div>

      {feil && (
        <div style={{ marginTop: '10px', padding: '12px', borderRadius: '12px', backgroundColor: '#fdf0ef', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={16} color="#c0392b" />
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#c0392b' }}>{feil}</p>
        </div>
      )}

      {forslag.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4a4a42', marginBottom: '8px' }}>
            Plant.id fant disse artene:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {forslag.map((f, idx) => (
              <button
                key={f.navn}
                onClick={() => velgForslag(f)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '14px',
                  border: valgt === f.navn ? '2px solid #154212' : '2px solid transparent',
                  backgroundColor: valgt === f.navn ? '#d4e8d0' : '#f0ece3',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                {/* Bilde - størst for høyeste match */}
                <div style={{
                  width: idx === 0 ? '72px' : '52px',
                  height: idx === 0 ? '72px' : '52px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  backgroundColor: '#d4e8d0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {f.bildeUrl ? (
                    <img src={f.bildeUrl} alt={f.navn} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Leaf size={idx === 0 ? 28 : 20} color="#4a7c59" />
                  )}
                </div>

                {/* Navn og latinsk */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: idx === 0 ? '15px' : '13px', fontWeight: 700, color: '#1c1c18', marginBottom: '2px' }}>
                    {f.norskNavn}
                  </p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#4a4a42', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.navn}
                  </p>
                </div>

                {/* Prosent-badge */}
                <div style={{ backgroundColor: f.sannsynlighet > 70 ? '#154212' : '#e8e4db', borderRadius: '8px', padding: '4px 8px', flexShrink: 0 }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: f.sannsynlighet > 70 ? 'white' : '#4a4a42' }}>
                    {f.sannsynlighet}%
                  </p>
                </div>

                {/* Hake hvis valgt */}
                {valgt === f.navn && (
                  <CheckCircle size={18} color="#154212" style={{ flexShrink: 0 }} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
