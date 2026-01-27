"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCrossWindowTheme } from "@/lib/hooks/useCrossWindowTheme";

interface ThemeDebugPanelProps {
  user?: {
    preferences?: {
      theme?: "light" | "dark" | "system";
    };
  };
}

export function ThemeDebugPanel({ user }: ThemeDebugPanelProps) {
  const { theme: nextTheme, resolvedTheme: nextResolved } = useTheme();
  const { currentTheme, resolvedTheme, userTheme, isInitialized, isUpdating, changeTheme } = useCrossWindowTheme(user || null);
  const [mounted, setMounted] = useState(false);
  const [storageTheme, setStorageTheme] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setStorageTheme(localStorage.getItem('stride-theme'));
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      setStorageTheme(localStorage.getItem('stride-theme'));
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('theme-sync', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('theme-sync', handleStorageChange);
    };
  }, []);

  if (!mounted || process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 p-4 bg-card border rounded-lg shadow-lg text-xs space-y-2 max-w-sm z-50">
      <h4 className="font-semibold text-sm">Theme Debug Panel</h4>
      
      <div className="space-y-1">
        <div><strong>Next Themes:</strong> {nextTheme} → {nextResolved}</div>
        <div><strong>Cross Window:</strong> {currentTheme} → {resolvedTheme}</div>
        <div><strong>User DB:</strong> {userTheme || 'none'}</div>
        <div><strong>localStorage:</strong> {storageTheme || 'none'}</div>
        <div><strong>HTML Class:</strong> {document.documentElement.classList.contains('dark') ? 'dark' : 'light'}</div>
        <div><strong>Initialized:</strong> {isInitialized ? 'Yes' : 'No'}</div>
        <div><strong>Updating:</strong> {isUpdating ? 'Yes' : 'No'}</div>
      </div>

      <div className="flex gap-1">
        <Button size="sm" variant="outline" onClick={() => changeTheme('light')} disabled={isUpdating}>
          Light
        </Button>
        <Button size="sm" variant="outline" onClick={() => changeTheme('dark')} disabled={isUpdating}>
          Dark
        </Button>
        <Button size="sm" variant="outline" onClick={() => changeTheme('system')} disabled={isUpdating}>
          System
        </Button>
      </div>

      <Button 
        size="sm" 
        variant="outline" 
        onClick={() => {
          console.log('Theme Debug State:', {
            nextTheme,
            nextResolved,
            currentTheme,
            resolvedTheme,
            userTheme,
            storageTheme,
            htmlClass: document.documentElement.className,
            isInitialized,
            isUpdating
          });
        }}
        className="w-full"
      >
        Log State
      </Button>
    </div>
  );
}