'use client'

import { Toaster } from 'react-hot-toast'

export function Sonner() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#111827',
          color: '#ffffff',
          border: '1px solid rgba(255,255,255,0.1)',
        },
      }}
    />
  )
}
