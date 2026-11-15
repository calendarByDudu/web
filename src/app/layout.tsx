import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import {
  ThemeProvider,
  themeInitScript,
} from "@/components/theme-provider"
import { PwaRegister } from "@/components/pwa-register"
import { Toaster } from "@/components/ui/toast"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "calendarByDudu",
  description: "Mobile-first calendar app",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "calendarByDudu",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#252525" },
  ],
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-dvh">
        <ThemeProvider>
          <PwaRegister />
          <Toaster timeout={3000}>
            <div className="app-shell mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-background">
              {children}
            </div>
          </Toaster>
        </ThemeProvider>
      </body>
    </html>
  )
}
