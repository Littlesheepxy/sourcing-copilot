import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from "../components/theme/theme-provider";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "SourcingBot - Boss直聘智能助手",
  description: "智能筛选Boss直聘简历并自动打招呼的AI助手",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
} 