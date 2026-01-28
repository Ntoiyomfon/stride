import type { Metadata } from "next";
import { Onest } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import LayoutWrapper from "@/components/layout-wrapper";
import { SessionSync } from "@/components/session-sync";

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stride",
  description: "Job tracking application for job hunters",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('stride-theme') || 'system';
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                const resolvedTheme = theme === 'system' ? systemTheme : theme;
                document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className={`${onest.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionSync />
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
