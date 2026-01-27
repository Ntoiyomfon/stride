"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

interface User {
  preferences?: {
    theme?: "light" | "dark" | "system";
  };
}

export function useUserTheme(user: User | null) {
  const { theme, setTheme } = useTheme();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Only set theme if user has a preference and it's different from current theme
    if (user?.preferences?.theme && !isInitialized) {
      const userTheme = user.preferences.theme;
      
      // Only update if the theme is actually different
      if (theme !== userTheme) {
        setTheme(userTheme);
      }
      
      setIsInitialized(true);
    }
  }, [user?.preferences?.theme, theme, setTheme, isInitialized]);

  // Return current theme state for debugging
  return {
    currentTheme: theme,
    userTheme: user?.preferences?.theme,
    isInitialized
  };
}