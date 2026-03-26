'use client'
import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export default function PushVarsler() {
  const [støttet, setStøttet] = useState(false)
  const [tillatelse, setTillatelse] = useState<NotificationPermission>('default')
  const [laster, setLaster] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      setStøttet(true)
      setTillatelse(Notification.permission)
      registrerServiceWorker()
    }
  }, [])

  async function registrerServiceWorker() {
    try {
      await navigator.serviceWorker.register('/sw.js')
    } catch (e) {
      console.error('Service worker feil:', e)
    }
  }

  async function aktiverVarsler() {
    setLaster(true)
    try {
      const tillatelse = await Notification.requestPermission()
      setTillatelse(tillatelse)
      if (tillatelse === 'granted') {
        await oppdaterVanningsCache()
        await visTestVarsel()
      }
    } catch (e) {
      console.error('Varsel-feil:', e)
    }
    setLaster(false)
  }

  async function oppdaterVanningsCache() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('planter')
        .select('id, navn, neste_vanning')
        .eq('bruker_id', user.id)
      if (data) {
        const cache = await caches.open('gartner-data')
        await cache.put('vanning-varsler', new Response(JSON.stringify(data)))
      }
    } catch (e) {
      console.error('Cache-feil:', e)
    }
  }

  async function visTestVarsel() {
    const reg = await navigator.serviceWorker.ready
    await reg.showNotification('Gartner 🌿', {
      body: 'Varsler er aktivert! Du får beskjed når plantene dine trenger vann.',
      icon: '/icon-192.png',
      tag: 'test-varsel',
    })
  }

  if (!støttet) return null

  return (
    <div style={{
      borderRadius: '16px',
      padding: '16px',
      backgroundColor: tillatelse === 'granted' ? '#d4e8d0' : '#f0ece3',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {tillatelse === 'granted' ? (
          <Bell size={18} color="#154212" />
        ) : (
          <BellOff size={18} color="#4a4a42" />
        )}
        <div>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '14px', fontWeight: 700, color: '#1c1c18' }}>
            {tillatelse === 'granted' ? 'Varsler aktivert' : 'Aktiver vannvarsler'}
          </p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#4a4a42' }}>
            {tillatelse === 'granted' ? 'Du får beskjed når plantene trenger vann' : 'Få påminnelse når plantene trenger vann'}
          </p>
        </div>
      </div>
      {tillatelse !== 'granted' && (
        <button
          onClick={aktiverVarsler}
          disabled={laster || tillatelse === 'denied'}
          style={{
            padding: '8px 14px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: tillatelse === 'denied' ? '#c4c0b7' : '#154212',
            color: 'white',
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            fontWeight: 600,
            cursor: tillatelse === 'denied' ? 'not-allowed' : 'pointer',
            flexShrink: 0,
          }}
        >
          {laster ? '...' : tillatelse === 'denied' ? 'Blokkert' : 'Aktiver'}
        </button>
      )}
    </div>
  )
}
