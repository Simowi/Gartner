'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { ArrowLeft, Plus, Save, Trash2, Camera } from 'lucide-react'

interface Melding {
  id: string
  dag_nummer: number
  dato: string
  melding: string
  bilde_url: string | null
}

const STARTDATO = '2026-04-14'

function lagDato(dagNummer: number): string {
  const dato = new Date(STARTDATO)
  dato.setDate(dato.getDate() + dagNummer - 1)
  return dato.toISOString().split('T')[0]
}

function formaterDato(dato: string): string {
  return new Date(dato).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function AdminMeldinger() {
  const [meldinger, setMeldinger] = useState<Melding[]>([])
  const [laster, setLaster] = useState(true)
  const [lagrer, setLagrer] = useState<number | null>(null)
  const [redigerer, setRedigerer] = useState<number | null>(null)
  const [nyMelding, setNyMelding] = useState('')
  const [lasterOppBilde, setLasterOppBilde] = useState<number | null>(null)
  const [tilgang, setTilgang] = useState(false)
  const [ventendeBilde, setVentendeBilde] = useState<File | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function sjekkTilgang() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email === 'sivertmw@gmail.com') {
        setTilgang(true)
        hentMeldinger()
      } else {
        window.location.href = '/hjem'
      }
    }
    sjekkTilgang()
  }, [])

  async function hentMeldinger() {
    const { data } = await supabase
      .from('daglige_meldinger')
      .select('*')
      .order('dag_nummer', { ascending: true })
    if (data) setMeldinger(data)
    setLaster(false)
  }

  async function lagreMelding(dagNummer: number, melding: string) {
    setLagrer(dagNummer)
    const dato = lagDato(dagNummer)
    await supabase.from('daglige_meldinger').upsert({
      dag_nummer: dagNummer,
      dato,
      melding,
    }, { onConflict: 'dag_nummer' })
    await hentMeldinger()
    setRedigerer(null)
    setLagrer(null)
  }

  async function slettMelding(dagNummer: number) {
    await supabase.from('daglige_meldinger').delete().eq('dag_nummer', dagNummer)
    await hentMeldinger()
  }

  async function lastOppBilde(dagNummer: number, fil: File) {
    setLasterOppBilde(dagNummer)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const filnavn = 'meldinger/dag-' + dagNummer + '-' + Date.now() + '.' + fil.name.split('.').pop()
    await supabase.storage.from('plantebilder').upload(filnavn, fil, { upsert: true })
    const { data } = supabase.storage.from('plantebilder').getPublicUrl(filnavn)
    await supabase.from('daglige_meldinger').upsert({
      dag_nummer: dagNummer,
      dato: lagDato(dagNummer),
      melding: meldinger.find(m => m.dag_nummer === dagNummer)?.melding || '',
      bilde_url: data.publicUrl,
    }, { onConflict: 'dag_nummer' })
    await hentMeldinger()
    setLasterOppBilde(null)
  }

  const eksisterendeDager = new Set(meldinger.map(m => m.dag_nummer))

  return (
    <div style={{ paddingTop: '52px', paddingBottom: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <button onClick={() => window.history.back()} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4a4a42', marginBottom: '16px', padding: 0 }}>
          <ArrowLeft size={16} /> Tilbake
        </button>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: '#4a7c59', marginBottom: '6px', textTransform: 'uppercase' }}>
          Admin
        </p>
        <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '32px', fontWeight: 800, color: '#1c1c18', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          Daglige meldinger 💌
        </h1>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#4a4a42', marginTop: '8px' }}>
          {meldinger.length} av 30 meldinger lagt inn
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {Array.from({ length: 30 }, (_, i) => i + 1).map(dagNummer => {
          const eksisterende = meldinger.find(m => m.dag_nummer === dagNummer)
          const dato = lagDato(dagNummer)
          const erRedigerer = redigerer === dagNummer

          return (
            <div key={dagNummer} style={{ borderRadius: '18px', padding: '16px', backgroundColor: eksisterende ? '#f0ece3' : '#f7f4ed', border: eksisterende ? 'none' : '2px dashed #e8e4db' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: eksisterende ? '#154212' : '#e8e4db', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '13px', fontWeight: 700, color: eksisterende ? 'white' : '#4a4a42' }}>{dagNummer}</span>
                  </div>
                  <div>
                    <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '13px', fontWeight: 700, color: '#1c1c18' }}>
                      Dag {dagNummer}
                    </p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#4a4a42' }}>
                      {formaterDato(dato)}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {eksisterende && (
                    <>
                      <label style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: '#d4e8d0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Camera size={14} color="#154212" />
                        <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) lastOppBilde(dagNummer, f) }} style={{ display: 'none' }} />
                      </label>
                      <button onClick={() => { setRedigerer(erRedigerer ? null : dagNummer); setNyMelding(eksisterende.melding) }} style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: '#f0ece3', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Save size={14} color="#4a4a42" />
                      </button>
                      <button onClick={() => slettMelding(dagNummer)} style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: '#fdf0ef', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={14} color="#c0392b" />
                      </button>
                    </>
                  )}
                  {!eksisterende && (
                    <button onClick={() => { setRedigerer(dagNummer); setNyMelding('') }} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '10px', backgroundColor: '#154212', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: 'white' }}>
                      <Plus size={12} color="white" /> Legg til
                    </button>
                  )}
                </div>
              </div>

              {eksisterende?.bilde_url && (
                <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden', marginBottom: '8px' }}>
                  <img src={eksisterende.bilde_url} alt="Bilde" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              {eksisterende && !erRedigerer && (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#1c1c18', lineHeight: 1.5, fontStyle: 'italic' }}>
                  «{eksisterende.melding}»
                </p>
              )}

              {erRedigerer && (
                <div>
                  <textarea
                    value={nyMelding}
                    onChange={e => setNyMelding(e.target.value)}
                    placeholder="Skriv en melding til henne..."
                    rows={3}
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: 'white', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1c1c18', resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: '8px' }}
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '12px', backgroundColor: 'white', cursor: 'pointer', marginBottom: '8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#4a4a42' }}>
                    <Camera size={15} color="#4a4a42" />
                    {ventendeBilde ? '✓ ' + ventendeBilde.name : 'Legg ved bilde (valgfritt)'}
                    <input type="file" accept="image/*" onChange={e => setVentendeBilde(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                  </label>
                  <button
                    onClick={async () => {
                      await lagreMelding(dagNummer, nyMelding)
                      if (ventendeBilde) {
                        await lastOppBilde(dagNummer, ventendeBilde)
                        setVentendeBilde(null)
                      }
                    }}
                    disabled={!nyMelding.trim() || lagrer === dagNummer}
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: '#154212', color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '14px', fontWeight: 700, cursor: !nyMelding.trim() ? 'not-allowed' : 'pointer', opacity: !nyMelding.trim() ? 0.5 : 1 }}
                  >
                    {lagrer === dagNummer ? 'Lagrer...' : 'Lagre melding'}
                  </button>
                </div>
              )}

              {lasterOppBilde === dagNummer && (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#4a7c59', marginTop: '8px' }}>Laster opp bilde...</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
