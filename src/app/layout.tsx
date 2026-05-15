import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BillKar — Simple Billing for Shops',
  description: 'Create and manage bills for your shop. Simple, fast, professional.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-[#F5F5F7] min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
