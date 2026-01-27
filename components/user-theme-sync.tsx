"use client";

interface User {
  preferences?: {
    theme?: "light" | "dark" | "system";
  };
}

interface UserThemeSyncProps {
  user: User;
}

export function UserThemeSync({ user: _ }: UserThemeSyncProps) {
  // This component is now handled by useCrossWindowTheme hook
  // We keep it for backward compatibility but it doesn't do anything
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('UserThemeSync: Theme management now handled by useCrossWindowTheme hook');
  }
  
  return null; // This component doesn't render anything
}