import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Gartner',
  description: 'Ditt personlige plantedashboard',
  manifest: '/manifest.json',
  themeColor: '#154212',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Gartner',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="no">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}
