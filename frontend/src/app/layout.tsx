import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Chinese Learning App',
  description: 'An app to help you learn Chinese',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}