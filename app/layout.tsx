import type { ReactNode } from "react"
import { ClerkProvider } from "@clerk/nextjs"
import { ToastProvider } from "@/components/ui/toast-provider"
import "./globals.css"

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-gray-50 text-gray-900">
          {children}
          <ToastProvider />
        </body>
      </html>
    </ClerkProvider>
  )
}