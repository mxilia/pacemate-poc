import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PaceMate',
  icons: { icon: '/brand/pacemate-logo.png', apple: '/brand/pacemate-logo.png' },
  description: 'Your running plan, daily coach, and training progress.',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
