"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useCrossWindowTheme } from "@/lib/hooks/useCrossWindowTheme";

interface ThemeToggleButtonProps {
  user?: {
    preferences?: {
      theme?: "light" | "dark" | "system";
    };
  };
}

export function ThemeToggleButton({ user }: ThemeToggleButtonProps) {
  const { resolvedTheme, isUpdating, changeTheme } = useCrossWindowTheme(user || null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = async () => {
    if (isUpdating) return;
    
    const newTheme = resolvedTheme === "dark" ? "light" : "dark";
    await changeTheme(newTheme);
  };

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <div className="h-4 w-4 bg-muted animate-pulse rounded" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      disabled={isUpdating}
      className="h-8 w-8 transition-all duration-200"
    >
      {isUpdating ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : resolvedTheme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}