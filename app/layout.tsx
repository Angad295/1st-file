import type React from "react"
import type { Metadata, Viewport } from "next"
import { Fraunces, IBM_Plex_Mono, Saira_Stencil_One } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600", "700", "900"],
})

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  weight: ["400", "500", "600"],
})

const sairaStencil = Saira_Stencil_One({
  subsets: ["latin"],
  variable: "--font-saira-stencil",
  weight: "400",
})

export const metadata: Metadata = {
  title: "AI Werewolf Arena — Watch Machines Deceive Each Other",
  description:
    "A multi-agent social deduction arena. AI agents play Werewolf in real time — read their public statements and private reasoning as they lie, deduce, and vote.",
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: "#1a1b1e",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`bg-background ${fraunces.variable} ${plexMono.variable} ${sairaStencil.variable}`}>
      <body className="font-mono antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
