import '@/app/globals.css'
import type { Metadata } from 'next'

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
        {children}
      </body>
    </html>
  )
}
