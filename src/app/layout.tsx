import "./globals.css"
import { ReactNode } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AuthProvider } from "@/components/auth-provider"
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/react"

// Primary font - Modern geometric sans for headlines
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
})

// Body font - Clean and readable
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
})

// Mono font - For code and numbers
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata = {
  title: "Acadly - Campus Marketplace",
  description: "The ultimate marketplace for students. Buy, sell, and trade within your campus community. Secure payments, verified users, real-time chat.",
  keywords: ["campus marketplace", "student marketplace", "buy sell textbooks", "college trading", "KTU", "Kerala students"],
  authors: [{ name: "Acadly" }],
  openGraph: {
    title: "Acadly - Campus Marketplace",
    description: "The ultimate marketplace for students. Buy, sell, and trade within your campus community.",
    type: "website",
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html 
      lang="en" 
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#7c3aed" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className="font-body flex flex-col min-h-screen antialiased">
        <AuthProvider>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </AuthProvider>
        <Analytics />
        <script dangerouslySetInnerHTML={{ __html: `
          if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/service-worker.js').catch(() => {});
            });
          }
        `}} />
      </body>
    </html>
  )
}
