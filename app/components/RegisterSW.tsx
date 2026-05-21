'use client'

import { useEffect } from 'react'

export default function RegisterSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration.scope)

          // Cek update setiap 60 detik
          setInterval(() => {
            registration.update()
          }, 60 * 1000)
        })
        .catch((error) => {
          console.log('SW registration failed: ', error)
        })
    }
  }, [])

  return null
}
