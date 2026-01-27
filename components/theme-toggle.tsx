"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updatePreferences } from "@/lib/actions/user";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  userTheme?: "light" | "dark" | "system";
}

export function ThemeToggle({ userTheme = "system" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Set theme from user preference on mount
    if (userTheme && theme !== userTheme) {
      setTheme(userTheme);
    }
  }, [userTheme, theme, setTheme]);

  const handleThemeChange = async (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    
    // Save to user preferences
    try {
      await updatePreferences({ theme: newTheme });
    } catch (error) {
      console.error("Failed to save theme preference:", error);
    }
  };

  if (!mounted) {
    return null;
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
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {themes.map((themeOption) => (
          <Button
            key={themeOption.value}
            variant={theme === themeOption.value ? "default" : "outline"}
            size="sm"
            onClick={() => handleThemeChange(themeOption.value)}
            className="flex flex-col gap-2 h-auto py-3"
          >
            {themeOption.icon}
            <span className="text-xs">{themeOption.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}