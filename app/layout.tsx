import type { Metadata } from 'next'
import { Orbitron, Outfit } from 'next/font/google'
import './globals.css'

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  weight: ['400', '600', '700', '900'],
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'GameVault — Ta bibliothèque 100%',
  description: 'Suis ta progression, partage tes complétion avec tes potes.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${orbitron.variable} ${outfit.variable}`}>
      <body>{children}</body>
    </html>
  )
}
