import type React from "react"
import type { Metadata } from "next"

import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: "aiKart — Agentic CRM | AI-Driven Business Management",
  description: "An AI-driven business management platform for vendors and customers powered by aiKart agentic workflows",
  generator: "aiKart.co",
  icons: {
    icon: [
      {
        url: "/logo-icon.png",
      },
    ],
    apple: "/logo-icon.png",
  },
}

/**
 * Root layout component for the application.
 * Wraps the entire application with providers (Theme, Auth, Analytics).
 * Sets up global fonts and metadata.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
