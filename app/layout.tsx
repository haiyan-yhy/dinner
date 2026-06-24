import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "今晚 / 本周吃什么",
  description: "让 AI 帮你决定今晚吃什么，或者规划本周菜单",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="bg-orange-50 min-h-screen">{children}</body>
    </html>
  )
}
