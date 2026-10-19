import type { Metadata } from "next"
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google"
import "./globals.css"

import { AppShell } from "@/components/app-shell"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/sonner"

const fontSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
})

const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Daily Expense — Pencatatan Kredit & PayLater",
  description:
    "Aplikasi pencatatan kredit dan paylater: catat tagihan, lihat daftar, dan laporan dengan filter periode.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${fontSans.variable} ${fontMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <AppShell>{children}</AppShell>
          <Toaster position="top-center" />
        </Providers>
      </body>
    </html>
  )
}
