'use client'
import { useState, useRef, useEffect } from 'react'
import { Send, Leaf, Bot } from 'lucide-react'

interface Melding {
  rolle: 'user' | 'assistant'
  tekst: string
}

const forslag = [
  'Hvor ofte bør jeg vanne en monstera?',
  'Hva gjør jeg hvis bladene gulner?',
  'Hvilke planter tåler lite lys om vinteren?',
  'Hvordan formerer jeg en pothos?',
]

export default function ChatPage() {
  const [meldinger, setMeldinger] = useState<Melding[]>([])
  const [input, setInput] = useState('')
  const [laster, setLaster] = useState(false)
  const bunnenRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bunnenRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [meldinger])

  async function sendMelding(tekst?: string) {
    const meldingsTekst = tekst || input.trim()
    if (!meldingsTekst || laster) return

    const nyBrukerMelding: Melding = { rolle: 'user', tekst: meldingsTekst }
    const oppdaterteMeldinger = [...meldinger, nyBrukerMelding]
    setMeldinger(oppdaterteMeldinger)
    setInput('')
    setLaster(true)

    const historikk = meldinger.map((m) => ({
      role: m.rolle === 'user' ? 'user' : 'model',
      parts: [{ text: m.tekst }]
    }))

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ melding: meldingsTekst, historikk })
    })

    const data = await response.json()
    setMeldinger([...oppdaterteMeldinger, { rolle: 'assistant', tekst: data.svar || 'Beklager, noe gikk galt.' }])
    setLaster(false)
  }

  return (
    <div style={{ paddingTop: '52px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px', flexShrink: 0 }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: '#4a7c59', marginBottom: '6px', textTransform: 'uppercase' }}>
          Planteekspert
        </p>
        <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '36px', fontWeight: 800, color: '#1c1c18', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          Spør AI
        </h1>
      </div>

      {/* Meldingsvindu */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '16px' }}>

        {meldinger.length === 0 && (
          <div>
            <div style={{ borderRadius: '20px', padding: '20px', backgroundColor: '#f0ece3', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: '#154212', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Leaf size={16} color="white" />
                </div>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '15px', fontWeight: 700, color: '#1c1c18' }}>
                  Gartner-assistenten
                </p>
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4a4a42', lineHeight: 1.6 }}>
                Hei! 🌿 Jeg er din personlige planteekspert. Jeg kan hjelpe deg med alt fra vanning og gjødsling til plantediagnoser og norske årstider. Hva lurer du på?
              </p>
            </div>

            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4a4a42', marginBottom: '10px' }}>
              Forslag
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {forslag.map((f) => (
                <button
                  key={f}
                  onClick={() => sendMelding(f)}
                  style={{ textAlign: 'left', padding: '12px 16px', borderRadius: '14px', border: 'none', backgroundColor: '#f0ece3', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1c1c18', cursor: 'pointer' }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}

        {meldinger.map((m, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: m.rolle === 'user' ? 'flex-end' : 'flex-start',
              alignItems: 'flex-end',
              gap: '8px',
            }}
          >
            {m.rolle === 'assistant' && (
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#154212', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Leaf size={13} color="white" />
              </div>
            )}
            <div style={{
              maxWidth: '80%',
              padding: '12px 16px',
              borderRadius: m.rolle === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              backgroundColor: m.rolle === 'user' ? '#154212' : '#f0ece3',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              lineHeight: 1.6,
              color: m.rolle === 'user' ? 'white' : '#1c1c18',
              whiteSpace: 'pre-wrap',
            }}>
              {m.tekst}
            </div>
          </div>
        ))}

        {laster && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#154212', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf size={13} color="white" />
            </div>
            <div style={{ padding: '12px 16px', borderRadius: '18px 18px 18px 4px', backgroundColor: '#f0ece3' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4a7c59', animation: 'pulse 1.4s ease-in-out ' + (i * 0.2) + 's infinite' }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bunnenRef} />
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0, paddingTop: '12px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMelding()
              }
            }}
            placeholder="Still et spørsmål om plantene dine..."
            rows={1}
            style={{
              flex: 1,
              padding: '14px 16px',
              borderRadius: '16px',
              border: 'none',
              backgroundColor: '#f0ece3',
              fontFamily: 'Inter, sans-serif',
              fontSize: '15px',
              color: '#1c1c18',
              outline: 'none',
              resize: 'none',
              lineHeight: 1.5,
            }}
          />
          <button
            onClick={() => sendMelding()}
            disabled={!input.trim() || laster}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              border: 'none',
              backgroundColor: input.trim() && !laster ? '#154212' : '#d4e8d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: input.trim() && !laster ? 'pointer' : 'not-allowed',
              flexShrink: 0,
              transition: 'background-color 0.15s',
            }}
          >
            <Send size={18} color={input.trim() && !laster ? 'white' : '#4a7c59'} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
