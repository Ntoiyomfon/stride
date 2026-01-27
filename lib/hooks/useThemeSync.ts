"use client";

import { useEffect, useState, useCallback } from "react";
import { useTheme } from "next-themes";

interface User {
  preferences?: {
    theme?: "light" | "dark" | "system";
  };
}

/**
 * Enhanced theme synchronization hook that prevents flickering
 * and ensures proper theme persistence
 */
export function useThemeSync(user: User | null) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastUserTheme, setLastUserTheme] = useState<string | null>(null);

  // Debounced theme setter to prevent rapid changes
  const setThemeDebounced = useCallback((newTheme: string) => {
    if (theme !== newTheme) {
      setTheme(newTheme);
    }
  }, [theme, setTheme]);

  // Initialize theme from user preferences
  useEffect(() => {
    if (!user?.preferences?.theme || isInitialized) return;

    const userTheme = user.preferences.theme;
    
    // Only set if different from current theme and we haven't set it before
    if (userTheme !== lastUserTheme) {
      setThemeDebounced(userTheme);
      setLastUserTheme(userTheme);
      setIsInitialized(true);
    }
  }, [user?.preferences?.theme, isInitialized, lastUserTheme, setThemeDebounced]);

  // Listen for theme changes from other components
  useEffect(() => {
    const handleThemeChange = (event: CustomEvent) => {
      const newTheme = event.detail.theme;
      if (newTheme && newTheme !== theme) {
        setThemeDebounced(newTheme);
      }
    };

    window.addEventListener('theme-changed', handleThemeChange as EventListener);
    
    return () => {
      window.removeEventListener('theme-changed', handleThemeChange as EventListener);
    };
  }, [theme, setThemeDebounced]);

  return {
    currentTheme: theme,
    resolvedTheme,
    userTheme: user?.preferences?.theme,
    isInitialized
  };
}