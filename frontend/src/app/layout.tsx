import '@/app/globals.css'
import type { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'

export const metadata: Metadata = {
  title: 'CuongHoangDev V2',
  description: 'Portfolio & E-commerce Platform with AI Integration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className="bg-darkbg text-text-primary antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  )
}
