"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { useCrossWindowTheme } from "@/lib/hooks/useCrossWindowTheme";

interface ThemeToggleProps {
  user?: {
    preferences?: {
      theme?: "light" | "dark" | "system";
    };
  };
}

export function ThemeToggle({ user }: ThemeToggleProps) {
  const { currentTheme, resolvedTheme, isUpdating, changeTheme } = useCrossWindowTheme(user || null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-base">Theme</Label>
          <p className="text-sm text-muted-foreground">
            Choose your preferred theme or sync with your system.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  const themes = [
    {
      value: "light" as const,
      label: "Light",
      icon: <Sun className="h-4 w-4" />,
    },
    {
      value: "dark" as const,
      label: "Dark", 
      icon: <Moon className="h-4 w-4" />,
    },
    {
      value: "system" as const,
      label: "System",
      icon: <Monitor className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base">Theme</Label>
        <p className="text-sm text-muted-foreground">
          Choose your preferred theme or sync with your system.
          {currentTheme === "system" && resolvedTheme && (
            <span className="block text-xs mt-1">
              Currently using: {resolvedTheme}
            </span>
          )}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {themes.map((themeOption) => (
          <Button
            key={themeOption.value}
            variant={currentTheme === themeOption.value ? "default" : "outline"}
            size="sm"
            onClick={() => changeTheme(themeOption.value)}
            disabled={isUpdating}
            className="flex flex-col gap-2 h-auto py-3 transition-all duration-200"
          >
            {isUpdating && currentTheme === themeOption.value ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              themeOption.icon
            )}
            <span className="text-xs">{themeOption.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}