import '@/app/globals.css'
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import Navbar from '@/components/layout/Navbar'
import CartDrawer from '@/components/shop/CartDrawer'
import AuthProvider from '@/components/providers/AuthProvider'
import ToasterProvider from '@/components/providers/ToasterProvider'
import MusicAudioController from '@/components/music/MusicAudioController'

// GlobalMusicPlayer reads from localStorage - never runs on the server.
const GlobalMusicPlayer = dynamic(
  () => import('@/components/music/GlobalMusicPlayer'),
  { ssr: false }
)

export const metadata: Metadata = {
  title: 'CuongThai V2',
  description: 'Portfolio & E-commerce Platform with AI Integration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body suppressHydrationWarning className="bg-darkbg text-text-primary antialiased">
        <AuthProvider>
          <ToasterProvider />
          <Navbar />
          {children}
          <CartDrawer />
          {/* Audio element lives here — never unmounts during navigation */}
          <MusicAudioController />
          {/* Player UI reads from/writes to the same store */}
          <GlobalMusicPlayer />
        </AuthProvider>
      </body>
    </html>
  )
}
