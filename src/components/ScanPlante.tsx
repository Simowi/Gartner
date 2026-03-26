'use client'
import { useState, useRef } from 'react'
import { Camera, Loader, Leaf, CheckCircle, AlertTriangle, X } from 'lucide-react'
import { planteArtDatabase } from '@/lib/plantedatabase'

interface Forslag {
  navn: string
  norskNavn: string
  sannsynlighet: number
  artId: string | null
}

interface Props {
  onArtValgt: (artId: string, latinskNavn: string, norskNavn: string, vanningIntervall: number) => void
}

export default function ScanPlante({ onArtValgt }: Props) {
  const [laster, setLaster] = useState(false)
  const [forslag, setForslag] = useState<Forslag[]>([])
  const [feil, setFeil] = useState('')
  const [valgt, setValgt] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function finnArtIDatabase(latinskNavn: string) {
    const lower = latinskNavn.toLowerCase()
    return planteArtDatabase.find(p =>
      p.latinskNavn.toLowerCase().includes(lower) ||
      lower.includes(p.latinskNavn.toLowerCase().split(' ')[0])
    ) || null
  }

  async function håndterBilde(e: React.ChangeEvent<HTMLInputElement>) {
    const fil = e.target.files?.[0]
    if (!fil) return

    setLaster(true)
    setFeil('')
    setForslag([])

    const leser = new FileReader()
    leser.onload = async (ev) => {
      const base64 = (ev.target?.result as string)?.split(',')[1]
      if (!base64) { setLaster(false); return }

      try {
        const res = await fetch('/api/plantid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bilde: base64, type: 'identifiser' })
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
          return {
            navn: s.name,
            norskNavn,
            sannsynlighet: Math.round(s.probability * 100),
            artId: artIDb?.id || null,
          }
        })

        setForslag(resultater)
      } catch (e) {
        setFeil('Noe gikk galt. Prøv igjen.')
      }
      setLaster(false)
    }
    leser.readAsDataURL(fil)
  }

  function velgForslag(f: Forslag) {
    setValgt(f.navn)
    const artIDb = planteArtDatabase.find(p => p.id === f.artId)
    onArtValgt(
      f.artId || '',
      f.navn,
      f.norskNavn,
      artIDb?.vanningIntervallDager || 7
    )
  }

  return (
    <div style={{ marginBottom: '8px' }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={håndterBilde}
        style={{ display: 'none' }}
      />

      <button
        onClick={() => inputRef.current?.click()}
        disabled={laster}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: '16px',
          border: '2px dashed #d4e8d0',
          backgroundColor: '#f7fbf7',
          cursor: laster ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          transition: 'all 0.15s',
        }}
      >
        {laster ? (
          <Loader size={20} color="#4a7c59" />
        ) : (
          <Camera size={20} color="#4a7c59" />
        )}
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '15px', fontWeight: 700, color: '#154212' }}>
          {laster ? 'Analyserer bilde...' : 'Scan plante med kamera'}
        </span>
      </button>

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
            {forslag.map((f) => (
              <button
                key={f.navn}
                onClick={() => velgForslag(f)}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '14px',
                  border: 'none',
                  backgroundColor: valgt === f.navn ? '#d4e8d0' : '#f0ece3',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {valgt === f.navn ? (
                    <CheckCircle size={18} color="#154212" />
                  ) : (
                    <Leaf size={18} color="#4a7c59" />
                  )}
                  <div>
                    <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '14px', fontWeight: 700, color: '#1c1c18' }}>
                      {f.norskNavn}
                    </p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#4a4a42', fontStyle: 'italic' }}>
                      {f.navn}
                    </p>
                  </div>
                </div>
                <div style={{ backgroundColor: f.sannsynlighet > 70 ? '#d4e8d0' : '#f0ece3', borderRadius: '8px', padding: '4px 8px' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: f.sannsynlighet > 70 ? '#154212' : '#4a4a42' }}>
                    {f.sannsynlighet}%
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
