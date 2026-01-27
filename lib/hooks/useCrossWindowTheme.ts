"use client";

import { useEffect, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { updatePreferences } from "@/lib/actions/user";

interface User {
  preferences?: {
    theme?: "light" | "dark" | "system";
  };
}

/**
 * Cross-window theme synchronization hook
 * Ensures theme changes are synchronized across all browser windows/tabs
 */
export function useCrossWindowTheme(user: User | null) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Initialize theme from user preferences only once
  useEffect(() => {
    if (!user?.preferences?.theme || isInitialized) return;

    const userTheme = user.preferences.theme;
    const currentStoredTheme = localStorage.getItem('stride-theme');
    
    // Only set if different from stored theme (prevents conflicts)
    if (currentStoredTheme !== userTheme) {
      console.log(`Initializing theme from user preferences: ${currentStoredTheme} → ${userTheme}`);
      setTheme(userTheme);
      localStorage.setItem('stride-theme', userTheme);
    }
    
    setIsInitialized(true);
  }, [user?.preferences?.theme, isInitialized, setTheme]);

  // Listen for theme changes from other windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'stride-theme' && e.newValue && e.newValue !== theme) {
        console.log(`Theme changed in another window: ${e.oldValue} → ${e.newValue}`);
        setTheme(e.newValue);
      }
    };

    const handleThemeSync = (event: CustomEvent) => {
      const { theme: newTheme, source } = event.detail;
      if (newTheme && newTheme !== theme && source !== 'current-window') {
        console.log(`Theme sync from ${source}: ${theme} → ${newTheme}`);
        setTheme(newTheme);
      }
    };

    // Listen for localStorage changes (cross-window)
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom theme sync events
    window.addEventListener('theme-sync', handleThemeSync as EventListener);

    console.log('Cross-window theme listeners registered');

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('theme-sync', handleThemeSync as EventListener);
      console.log('Cross-window theme listeners removed');
    };
  }, [theme, setTheme]);

  // Function to change theme and sync across windows
  const changeTheme = useCallback(async (newTheme: "light" | "dark" | "system") => {
    if (isUpdating || newTheme === theme) return;

    setIsUpdating(true);

    try {
      // 1. Set theme immediately for instant feedback
      setTheme(newTheme);

      // 2. Update localStorage to trigger storage event in other windows
      localStorage.setItem('stride-theme', newTheme);

      // 3. Broadcast to other windows via BroadcastChannel (if supported)
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('stride-theme');
        channel.postMessage({ type: 'theme-change', theme: newTheme });
        channel.close();
      }

      // 4. Dispatch custom event for same-window components
      window.dispatchEvent(new CustomEvent('theme-sync', {
        detail: { theme: newTheme, source: 'current-window' }
      }));

      // 5. Save to database in background (only if user is logged in)
      if (user) {
        const result = await updatePreferences({ theme: newTheme });
        
        if (result.success) {
          // Trigger user preferences refresh across all components
          window.dispatchEvent(new CustomEvent('preferences-updated'));
        } else {
          console.error('Failed to save theme preference:', result.error);
          // Don't revert theme on database error - keep the UI change
        }
      }
      // If user is not logged in, theme is only saved to localStorage (which is fine)

    } catch (error) {
      console.error('Theme change error:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [theme, setTheme, isUpdating, user]);

  // Listen for BroadcastChannel messages
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') {
      console.log('BroadcastChannel not supported in this environment');
      return;
    }

    const channel = new BroadcastChannel('stride-theme');
    console.log('BroadcastChannel listener registered for stride-theme');
    
    const handleBroadcast = (event: MessageEvent) => {
      if (event.data.type === 'theme-change' && event.data.theme !== theme) {
        console.log(`Theme broadcast received: ${theme} → ${event.data.theme}`);
        setTheme(event.data.theme);
      }
    };

    channel.addEventListener('message', handleBroadcast);

    return () => {
      channel.removeEventListener('message', handleBroadcast);
      channel.close();
      console.log('BroadcastChannel listener removed');
    };
  }, [theme, setTheme]);

  return {
    currentTheme: theme,
    resolvedTheme,
    userTheme: user?.preferences?.theme,
    isInitialized,
    isUpdating,
    changeTheme
  };
}