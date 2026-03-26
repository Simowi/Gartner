'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { Camera, Loader } from 'lucide-react'

interface Props {
  onBildeLastetOpp: (url: string) => void
  eksisterendeBilde?: string
}

export default function BildeOpplaster({ onBildeLastetOpp, eksisterendeBilde }: Props) {
  const [forhåndsvisning, setForhåndsvisning] = useState<string | null>(eksisterendeBilde || null)
  const [laster, setLaster] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  async function håndterBilde(e: React.ChangeEvent<HTMLInputElement>) {
    const fil = e.target.files?.[0]
    if (!fil) return

    setLaster(true)

    const leser = new FileReader()
    leser.onload = (e) => setForhåndsvisning(e.target?.result as string)
    leser.readAsDataURL(fil)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const filnavn = user.id + '/' + Date.now() + '.' + fil.name.split('.').pop()
      const { error } = await supabase.storage
        .from('plantebilder')
        .upload(filnavn, fil, { upsert: true })

      if (error) {
        console.error('Opplastingsfeil:', error)
        setLaster(false)
        return
      }

      const { data } = supabase.storage
        .from('plantebilder')
        .getPublicUrl(filnavn)

      onBildeLastetOpp(data.publicUrl)
    } catch (e) {
      console.error('Feil:', e)
    }

    setLaster(false)
  }

  return (
    <div>
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
          height: '180px',
          borderRadius: '20px',
          border: 'none',
          cursor: laster ? 'not-allowed' : 'pointer',
          overflow: 'hidden',
          position: 'relative',
          backgroundColor: '#f0ece3',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
        }}
      >
        {forhåndsvisning ? (
          <>
            <img
              src={forhåndsvisning}
              alt="Forhåndsvisning"
              style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
            />
            <div style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              backgroundColor: 'rgba(21, 66, 18, 0.85)',
              borderRadius: '10px',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <Camera size={14} color="white" />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'white', fontWeight: 600 }}>
                Bytt bilde
              </span>
            </div>
          </>
        ) : (
          <>
            {laster ? (
              <Loader size={28} color="#4a7c59" />
            ) : (
              <Camera size={28} color="#4a7c59" />
            )}
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4a4a42', fontWeight: 500 }}>
              {laster ? 'Laster opp...' : 'Ta bilde eller velg fra bibliotek'}
            </p>
          </>
        )}
      </button>
    </div>
  )
}
