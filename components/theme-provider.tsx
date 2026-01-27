"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeProvider({ 
  children,
  ...props 
}: {
  children: React.ReactNode;
  attribute?: "class" | "data-theme";
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent flash of wrong theme during hydration
  if (!mounted) {
    return (
      <div className="theme-loading">
        {children}
      </div>
    );
  }

  return (
    <NextThemesProvider 
      {...props}
      storageKey="stride-theme"
      enableColorScheme={false}
    >
      {children}
    </NextThemesProvider>
  );
}