import '@/app/globals.css'
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import Navbar from '@/components/layout/Navbar'
import CartDrawer from '@/components/shop/CartDrawer'
import AuthProvider from '@/components/providers/AuthProvider'
import ToasterProvider from '@/components/providers/ToasterProvider'
import MusicAudioController from '@/components/music/MusicAudioController'
import LocaleWrapper from '@/components/providers/LocaleWrapper'

// GlobalMusicPlayer reads from localStorage - never runs on the server.
const GlobalMusicPlayer = dynamic(
  () => import('@/components/music/GlobalMusicPlayer'),
  { ssr: false }
)

// FloatingAIAssistant reads from Zustand + localStorage - never runs on the server.
const FloatingAIAssistant = dynamic(
  () => import('@/components/chat/FloatingAIAssistant'),
  { ssr: false }
)

export const metadata: Metadata = {
  title: 'CuongThai V2',
  description: 'Portfolio & E-commerce Platform with AI Integration',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="bg-darkbg text-text-primary antialiased">
        <AuthProvider>
          <ToasterProvider />
          <LocaleWrapper>
            <Navbar />
            {children}
            <CartDrawer />
            {/* Audio element lives here — never unmounts during navigation */}
            <MusicAudioController />
            {/* Player UI reads from/writes to the same store */}
            <GlobalMusicPlayer />
            {/* Floating Ai CuongMini — appears on every page */}
            <FloatingAIAssistant />
          </LocaleWrapper>
        </AuthProvider>
      </body>
    </html>
  )
}
