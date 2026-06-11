import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ARS - Gerenciamento de Atividades e Rotinas',
  description: 'Sistema de gerenciamento de atividades e rotinas',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'ARS' },
  other: { 'mobile-web-app-capable': 'yes' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  )
}
