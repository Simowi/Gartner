'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { Camera, Loader, X, ChevronLeft, ChevronRight } from 'lucide-react'

interface TidslinjeElement {
  id: string
  bilde_url: string
  kommentar: string | null
  opprettet_at: string
}

export default function PlanteTidslinje({ planteId }: { planteId: string }) {
  const [elementer, setElementer] = useState<TidslinjeElement[]>([])
  const [laster, setLaster] = useState(true)
  const [lasterOpp, setLasterOpp] = useState(false)
  const [kommentar, setKommentar] = useState('')
  const [visKommentar, setVisKommentar] = useState(false)
  const [valgtBilde, setValgtBilde] = useState<string | null>(null)
  const [valgtIndex, setValgtIndex] = useState<number | null>(null)
  const [ventendeBilde, setVentendeBilde] = useState<{ base64: string; fil: File } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    hentTidslinje()
  }, [])

  async function hentTidslinje() {
    const { data } = await supabase
      .from('plante_tidslinje')
      .select('*')
      .eq('plante_id', planteId)
      .order('opprettet_at', { ascending: false })
    if (data) setElementer(data)
    setLaster(false)
  }

  async function håndterBilde(e: React.ChangeEvent<HTMLInputElement>) {
    const fil = e.target.files?.[0]
    if (!fil) return
    const leser = new FileReader()
    leser.onload = (ev) => {
      const base64 = ev.target?.result as string
      setVentendeBilde({ base64, fil })
      setVisKommentar(true)
    }
    leser.readAsDataURL(fil)
  }

  async function lagreElement() {
    if (!ventendeBilde) return
    setLasterOpp(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const filnavn = user.id + '/tidslinje-' + planteId + '-' + Date.now() + '.jpg'
      await supabase.storage.from('plantebilder').upload(filnavn, ventendeBilde.fil, { upsert: true })
      const { data: urlData } = supabase.storage.from('plantebilder').getPublicUrl(filnavn)

      await supabase.from('plante_tidslinje').insert({
        plante_id: planteId,
        bruker_id: user.id,
        bilde_url: urlData.publicUrl,
        kommentar: kommentar.trim() || null,
      })

      setKommentar('')
      setVentendeBilde(null)
      setVisKommentar(false)
      await hentTidslinje()
    } catch (e) {
      console.error(e)
    }
    setLasterOpp(false)
  }

  async function slettElement(id: string) {
    await supabase.from('plante_tidslinje').delete().eq('id', id)
    setElementer(prev => prev.filter(e => e.id !== id))
    setValgtIndex(null)
  }

  function formaterDato(dato: string) {
    return new Date(dato).toLocaleDateString('nb-NO', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
  }

  function åpneLightbox(index: number) {
    setValgtIndex(index)
  }

  function forrige() {
    setValgtIndex(prev => prev !== null ? Math.max(0, prev - 1) : null)
  }

  function neste() {
    setValgtIndex(prev => prev !== null ? Math.min(elementer.length - 1, prev + 1) : null)
  }

  const touchStartX = useRef<number | null>(null)
  function håndterTouchStart(e: React.TouchEvent) { touchStartX.current = e.touches[0].clientX }
  function håndterTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 50) { dx < 0 ? neste() : forrige() }
    touchStartX.current = null
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={håndterBilde} style={{ display: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4a4a42' }}>
          📸 Tidslinje
        </p>
        <button
          onClick={() => inputRef.current?.click()}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '10px', border: 'none', backgroundColor: '#f0ece3', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#1c1c18' }}
        >
          <Camera size={13} color="#1c1c18" />
          Ta bilde
        </button>
      </div>

      {/* Kommentar-modal */}
      {visKommentar && ventendeBilde && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ backgroundColor: '#fcf9f2', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', width: '100%', boxSizing: 'border-box' }}>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '16px', fontWeight: 700, color: '#1c1c18', marginBottom: '16px' }}>
              Legg til et notat
            </p>
            <img src={ventendeBilde.base64} alt="Forhåndsvisning" style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '14px', marginBottom: '12px' }} />
            <input
              type="text"
              value={kommentar}
              onChange={e => setKommentar(e.target.value)}
              placeholder="F.eks. «Første nye blad etter vinteren! 🌱» (valgfri)"
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: '#f0ece3', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1c1c18', marginBottom: '12px', boxSizing: 'border-box', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => { setVisKommentar(false); setVentendeBilde(null); setKommentar('') }}
                style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: '#f0ece3', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: '#4a4a42', cursor: 'pointer' }}
              >
                Avbryt
              </button>
              <button
                onClick={lagreElement}
                disabled={lasterOpp}
                style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: '#154212', fontFamily: 'Manrope, sans-serif', fontSize: '14px', fontWeight: 700, color: 'white', cursor: lasterOpp ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {lasterOpp ? <Loader size={16} color="white" /> : 'Lagre'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tidslinje */}
      {laster ? null : elementer.length === 0 ? (
        <div
          onClick={() => inputRef.current?.click()}
          style={{ borderRadius: '16px', padding: '24px', backgroundColor: '#f0ece3', textAlign: 'center', cursor: 'pointer' }}
        >
          <p style={{ fontSize: '28px', marginBottom: '8px' }}>📷</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#4a4a42' }}>
            Ta det første bildet for å starte tidslinjen
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '6px' }}>
          {elementer.map((el, i) => (
            <div
              key={el.id}
              onClick={() => åpneLightbox(i)}
              style={{ flexShrink: 0, width: '120px', cursor: 'pointer' }}
            >
              <div style={{ width: '120px', height: '120px', borderRadius: '14px', overflow: 'hidden', marginBottom: '6px' }}>
                <img src={el.bilde_url + '?width=240&height=240&resize=cover'} alt="Tidslinje" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#4a4a42', textAlign: 'center' }}>
                {formaterDato(el.opprettet_at)}
              </p>
              {el.kommentar && (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#1c1c18', textAlign: 'center', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {el.kommentar}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {valgtIndex !== null && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onTouchStart={håndterTouchStart}
          onTouchEnd={håndterTouchEnd}
        >
          <button onClick={() => setValgtIndex(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} color="white" />
          </button>

          <p style={{ position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
            {valgtIndex + 1} / {elementer.length}
          </p>

          {valgtIndex > 0 && (
            <button onClick={forrige} style={{ position: 'absolute', left: '12px', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={22} color="white" />
            </button>
          )}

          {valgtIndex < elementer.length - 1 && (
            <button onClick={neste} style={{ position: 'absolute', right: '12px', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={22} color="white" />
            </button>
          )}

          <img src={elementer[valgtIndex].bilde_url} alt="Tidslinje" style={{ width: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: '12px' }} />

          {elementer[valgtIndex].kommentar && (
            <p style={{ marginTop: '12px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.9)', textAlign: 'center', fontStyle: 'italic' }}>
              «{elementer[valgtIndex].kommentar}»
            </p>
          )}

          <p style={{ marginTop: '8px', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
            {formaterDato(elementer[valgtIndex].opprettet_at)}
          </p>

          <button
            onClick={() => { if (window.confirm('Slett dette bildet?')) slettElement(elementer[valgtIndex].id) }}
            style={{ marginTop: '16px', padding: '8px 20px', borderRadius: '10px', border: 'none', backgroundColor: 'rgba(192,57,43,0.3)', color: '#ff6b6b', fontFamily: 'Inter, sans-serif', fontSize: '13px', cursor: 'pointer' }}
          >
            Slett bilde
          </button>
        </div>
      )}
    </div>
  )
}
