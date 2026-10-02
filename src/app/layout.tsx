import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Sistem Manajemen Stok Sparepart',
  description: 'Aplikasi manajemen persediaan sparepart dengan fitur stok masuk, keluar, opname, dan laporan',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning className={cn("font-sans", inter.variable)}>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  )
}