'use client'
import { useState, useEffect } from 'react'

interface Sesong {
  navn: string
  emoji: string
  farge: string
  tips: string[]
}

function hentSesong(): Sesong {
  const måned = new Date().getMonth()
  if (måned >= 2 && måned <= 4) return {
    navn: 'vår',
    emoji: '🌱',
    farge: 'linear-gradient(135deg, #3d6b4f 0%, #6b9e7a 100%)',
    tips: [
      'Tid for å gjødsle igjen – plantene våkner fra vinterdvalen.',
      'Flytt planter nærmere vinduet – dagslyset øker raskt nå.',
      'Sjekk om noen planter trenger omplanting etter vinteren.',
      'Sett ut stiklinger – våren er den beste tiden for formering.',
    ]
  }
  if (måned >= 5 && måned <= 7) return {
    navn: 'sommer',
    emoji: '☀️',
    farge: 'linear-gradient(135deg, #b5451b 0%, #e07b39 100%)',
    tips: [
      'Varm sommer – vann litt hyppigere enn vanlig.',
      'Beskytt planter mot brennende middagssol i sørvendte vinduer.',
      'Balkongplanter tørker raskt i varmen – sjekk dem daglig.',
      'God tid for å ta stiklinger og formere favorittplantene.',
    ]
  }
  if (måned >= 8 && måned <= 10) return {
    navn: 'høst',
    emoji: '🍂',
    farge: 'linear-gradient(135deg, #8b4513 0%, #c0392b 100%)',
    tips: [
      'Begynn å redusere vanningen – plantene trenger hvile.',
      'Ta inn alle balkongplanter før første frost.',
      'Slutt å gjødsle fra september – det stresser planten om vinteren.',
      'Flytt planter nærmere vinduer etter hvert som dagslyset avtar.',
    ]
  }
  return {
    navn: 'vinter',
    emoji: '❄️',
    farge: 'linear-gradient(135deg, #2c3e50 0%, #3d5a80 100%)',
    tips: [
      'Vann sparsomt – de fleste planter har hvileperiode nå.',
      'Hold planter unna kalde vinduskarmer og kuldetrekk.',
      'Ikke gjødsl – plantene trenger ro frem til mars.',
      'Tørr inneluft om vinteren – spray bladene med vann innimellom.',
    ]
  }
}

export default function Sesongkort() {
  const [tips, setTips] = useState('')
  const [sesong, setSesong] = useState<Sesong | null>(null)

  useEffect(() => {
    const s = hentSesong()
    setSesong(s)
    setTips(s.tips[Math.floor(Math.random() * s.tips.length)])
  }, [])

  if (!sesong || !tips) return null

  return (
    <div style={{ borderRadius: '20px', padding: '18px', marginBottom: '16px', background: sesong.farge }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '16px' }}>{sesong.emoji}</span>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>
          Tips for {sesong.navn}en
        </p>
      </div>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', lineHeight: 1.6, color: 'rgba(255,255,255,0.92)' }}>
        {tips}
      </p>
    </div>
  )
}
