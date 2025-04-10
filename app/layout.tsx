import type { ReactNode } from "react"
import { ClerkProvider } from "@clerk/nextjs"
import { ToastProvider } from "@/components/ui/toast-provider"
import "./globals.css"
import Spline from "@/components/spline/HeroBG";
import AuthButton from "@/components/AuthButton"
import { logos } from "@/constants";
import Footer from "@/components/Footer";
import ShiningBetaBadge from "@/components/ShiningBadge";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className="bg-transparent">
          <div className="fixed overflow-hidden inset-0 -z-0 bg-gradient-to-br from-black to-slate-800">
            <Spline />
          </div>

          <div className="relative pointer-events-none z-10 text-[#bad7f5] flex flex-col min-h-screen overflow-auto">
            {/* Header moved from Home page to layout */}
            <header className="flex pointer-events-auto justify-between items-center py-2 px-4 mx:2 sm:mx-4 lg:mx-8 my-4 rounded-xl">
              <div className="relative flex items-center space-x-2">
                <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  MELL🐰W
                </span>
                <ShiningBetaBadge
                  text="BETA"
                  className="bg-blue-700/70 border-blue-400"
                />
              </div>
              <AuthButton />
            </header>

            {/* Main content */}
            <main className="flex-1">
              {children}
            </main>

            {/* New Footer */}
            <Footer />
          </div>
          <ToastProvider />
        </body>
      </html>
    </ClerkProvider>
  )
}