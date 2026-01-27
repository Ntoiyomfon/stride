"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Determine layout based on route
  const isPublicRoute = pathname === "/";
  const isAuthRoute = pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");
  const isAppRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/settings");

  if (isPublicRoute) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    );
  }

  if (isAuthRoute) {
    return (
      <>
        <Navbar />
        {children}
      </>
    );
  }

  if (isAppRoute) {
    return (
      <>
        <Navbar />
        {children}
      </>
    );
  }

  // Default layout with navbar
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}