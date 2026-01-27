"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

interface User {
  preferences?: {
    theme?: "light" | "dark" | "system";
  };
}

export function useUserTheme(user: User | null) {
  const { setTheme } = useTheme();

  useEffect(() => {
    if (user?.preferences?.theme) {
      setTheme(user.preferences.theme);
    }
  }, [user?.preferences?.theme, setTheme]);
}