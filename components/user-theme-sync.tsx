"use client";

import { useUserTheme } from "@/lib/hooks/useUserTheme";

interface User {
  preferences?: {
    theme?: "light" | "dark" | "system";
  };
}

interface UserThemeSyncProps {
  user: User;
}

export function UserThemeSync({ user }: UserThemeSyncProps) {
  useUserTheme(user);
  return null; // This component doesn't render anything
}