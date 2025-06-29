'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <Toaster 
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              background: 'white',
              color: 'black',
              border: '1px solid #e5e7eb',
            },
          }}
        />
      </ThemeProvider>
    </SessionProvider>
  )
}
