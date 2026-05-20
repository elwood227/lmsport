import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Разработок электронных учебных програм',
  description: 'Система управления электронными учебными программами',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/logo1.jpg',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/logo1.jpg',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/logo1.jpg',
        type: 'image/jpeg',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className="dark bg-slate-950">
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
