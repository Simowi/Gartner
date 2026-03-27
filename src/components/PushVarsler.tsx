'use client'
import { useEffect, useState } from 'react'
import { Bell, BellOff, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'

// Hjelpefunksjon for å konvertere VAPID-nøkkel (spesielt viktig for iOS/Safari)
function urlB64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function PushVarsler() {
  const [støttet, setStøttet] = useState(false)
  const [tillatelse, setTillatelse] = useState<NotificationPermission>('default')
  const [laster, setLaster] = useState(false)
  const [skjult, setSkjult] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('push-varsler-skjult') === 'true'
  })
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
      const nyTillatelse = await Notification.requestPermission()
      setTillatelse(nyTillatelse)
      
      if (nyTillatelse === 'granted') {
        await oppdaterVanningsCache()
        await visTestVarsel()

        // Lagre push-abonnement i Supabase
        try {
          const registration = await navigator.serviceWorker.ready
          const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
          
          if (!vapidKey) {
            throw new Error('Mangler NEXT_PUBLIC_VAPID_PUBLIC_KEY i miljøvariablene!')
          }

          const convertedVapidKey = urlB64ToUint8Array(vapidKey)
          const abonnement = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey
          })

          const { data: { user }, error: authError } = await supabase.auth.getUser()
          
          if (authError || !user) {
            console.error('Feil: Fant ikke innlogget bruker', authError)
          } else {
            console.log('Sender abonnement til Supabase for bruker:', user.id)
            
            const { error: dbError } = await supabase.from('push_abonnementer').upsert({
              bruker_id: user.id,
              abonnement: abonnement.toJSON(),
            }, { onConflict: 'bruker_id' })

            if (dbError) {
              console.error('Supabase lagringsfeil:', dbError)
            } else {
              console.log('Suksess! Push-abonnement er lagret i databasen.')
            }
          }
        } catch (e) {
          console.error('Push-abonnement feil:', e)
        }
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

  if (!støttet || skjult) return null

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
      {tillatelse === 'granted' && (
        <button onClick={() => { setSkjult(true); localStorage.setItem('push-varsler-skjult', 'true') }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', flexShrink: 0 }}>
          <X size={16} color="#4a4a42" />
        </button>
      )}

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
