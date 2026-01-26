import type { Metadata } from "next";
import { Onest } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import PageTransition from "@/components/page-transition";

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
      <body
        className={`${onest.variable} font-sans antialiased`}
      >
          <Navbar />
          <PageTransition>{children}</PageTransition>

      </body>
    </html>
  );
}
