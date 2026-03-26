'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Leaf } from 'lucide-react'

export default function NyPlantePage() {
  const [navn, setNavn] = useState('')
  const [art, setArt] = useState('')
  const [plassering, setPlassering] = useState('')
  const [vanningIntervall, setVanningIntervall] = useState('7')
  const [notater, setNotater] = useState('')
  const [laster, setLaster] = useState(false)
  const [feil, setFeil] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function leggTilPlante() {
    if (!navn.trim()) {
      setFeil('Planten må ha et navn.')
      return
    }
    setLaster(true)
    setFeil('')

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        setFeil('Du er ikke logget inn. Prøv å laste siden på nytt.')
        setLaster(false)
        return
      }

      const nestVanning = new Date()
      nestVanning.setDate(nestVanning.getDate() + parseInt(vanningIntervall))

      const { error } = await supabase.from('planter').insert({
        bruker_id: user.id,
        navn: navn.trim(),
        art: art.trim(),
        plassering: plassering.trim(),
        vanning_intervall_dager: parseInt(vanningIntervall),
        sist_vannet: new Date().toISOString(),
        neste_vanning: nestVanning.toISOString(),
        notater: notater.trim(),
      })

      if (error) {
        console.error('Supabase feil:', error)
        setFeil(`Feil: ${error.message}`)
        setLaster(false)
      } else {
        router.push('/planter')
        router.refresh()
      }
    } catch (e) {
      console.error('Uventet feil:', e)
      setFeil('En uventet feil oppstod. Prøv igjen.')
      setLaster(false)
    }
  }

  const inputStil = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '14px',
    border: 'none',
    backgroundColor: '#f0ece3',
    fontFamily: 'Inter, sans-serif',
    fontSize: '15px',
    color: '#1c1c18',
    outline: 'none',
  }

  const labelStil = {
    fontFamily: 'Inter, sans-serif',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: '#4a4a42',
    display: 'block',
    marginBottom: '6px',
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

  return (
    <div style={{ paddingTop: '52px', paddingBottom: '32px' }}>
      <div style={{ marginBottom: '36px' }}>
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0',
            marginBottom: '20px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            color: '#4a4a42',
          }}
        >
          <ArrowLeft size={16} />
          Tilbake
        </button>
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.12em',
          color: '#4a7c59',
          marginBottom: '6px',
          textTransform: 'uppercase',
        }}>
          Ny plante
        </p>
        <h1 style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: '36px',
          fontWeight: 800,
          color: '#1c1c18',
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
        }}>
          Legg til plante
        </h1>
      </div>

      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '24px',
        backgroundColor: '#d4e8d0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 32px',
      }}>
        <Leaf size={36} color="#154212" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={labelStil}>Navn *</label>
          <input
            type="text"
            value={navn}
            onChange={(e) => setNavn(e.target.value)}
            placeholder="f.eks. Monstera, Fredriksen..."
            style={inputStil}
          />
        </div>

        <div>
          <label style={labelStil}>Art</label>
          <input
            type="text"
            value={art}
            onChange={(e) => setArt(e.target.value)}
            placeholder="f.eks. Monstera deliciosa"
            style={inputStil}
          />
        </div>

        <div>
          <label style={labelStil}>Plassering</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {plasseringer.map((p) => (
              <button
                key={p}
                onClick={() => setPlassering(plassering === p ? '' : p)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '999px',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  fontWeight: 500,
                  backgroundColor: plassering === p ? '#154212' : '#f0ece3',
                  color: plassering === p ? 'white' : '#1c1c18',
                  transition: 'all 0.15s',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={labelStil}>Vanningsintervall</label>
          <select
            value={vanningIntervall}
            onChange={(e) => setVanningIntervall(e.target.value)}
            style={{ ...inputStil, cursor: 'pointer' }}
          >
            {vanningsvalg.map((v) => (
              <option key={v.verdi} value={v.verdi}>{v.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStil}>Notater</label>
          <textarea
            value={notater}
            onChange={(e) => setNotater(e.target.value)}
            placeholder="Spesielle behov, hvor du kjøpte den, minner..."
            rows={3}
            style={{ ...inputStil, resize: 'none', lineHeight: '1.5' }}
          />
        </div>

        {feil && (
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            color: '#c0392b',
            textAlign: 'center',
            padding: '12px',
            backgroundColor: '#fdf0ef',
            borderRadius: '10px',
          }}>
            {feil}
          </p>
        )}

        <button
          onClick={leggTilPlante}
          disabled={laster}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '14px',
            border: 'none',
            backgroundColor: '#154212',
            color: 'white',
            fontFamily: 'Manrope, sans-serif',
            fontSize: '15px',
            fontWeight: 700,
            cursor: laster ? 'not-allowed' : 'pointer',
            opacity: laster ? 0.7 : 1,
            marginTop: '8px',
          }}
        >
          {laster ? 'Lagrer...' : 'Legg til plante 🌿'}
        </button>
      </div>
    </div>
  )
}
