"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { debugThemeState, validateThemeConsistency } from "@/lib/utils/theme-debug";

export function ThemeTest() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      validateThemeConsistency();
    }
  }, [theme, resolvedTheme, mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-card border rounded-lg shadow-lg text-xs space-y-2 max-w-xs">
      <h4 className="font-semibold">Theme Debug</h4>
      <div>
        <strong>Theme:</strong> {theme}
      </div>
      <div>
        <strong>Resolved:</strong> {resolvedTheme}
      </div>
      <div>
        <strong>HTML Class:</strong> {document.documentElement.className.includes('dark') ? 'dark' : 'light'}
      </div>
      <div className="flex gap-1">
        <Button size="sm" variant="outline" onClick={() => setTheme('light')}>
          Light
        </Button>
        <Button size="sm" variant="outline" onClick={() => setTheme('dark')}>
          Dark
        </Button>
        <Button size="sm" variant="outline" onClick={() => setTheme('system')}>
          System
        </Button>
      </div>
      <Button size="sm" variant="outline" onClick={debugThemeState} className="w-full">
        Debug
      </Button>
    </div>
  );
}