import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Star Wish",
  description: "Send your wish to the universe",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}