"use client";

import { useState, useEffect } from "react";
import { getUser } from "@/lib/actions/user";

interface User {
  _id: string;
  name: string;
  email: string;
  image?: string;
  preferences?: {
    emailNotifications?: boolean;
    weeklySummary?: boolean;
    defaultBoardView?: string;
    theme?: "light" | "dark" | "system";
    accentColor?: "red" | "blue" | "green" | "yellow" | "gray" | "pink";
  };
}

/**
 * Hook to get user preferences with caching and real-time updates
 */
export function useUserPreferences() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const userData = await getUser();
      setUser(userData);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch user preferences:', err);
      setError('Failed to load user preferences');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Listen for preference updates
  useEffect(() => {
    const handlePreferenceUpdate = () => {
      console.log('Preferences updated event received, refetching user data');
      fetchUser();
    };

    const handleThemeSync = () => {
      // Refresh user data when theme changes to keep it in sync
      console.log('Theme sync event received, refetching user data');
      fetchUser();
    };

    window.addEventListener('preferences-updated', handlePreferenceUpdate);
    window.addEventListener('theme-sync', handleThemeSync);

    return () => {
      window.removeEventListener('preferences-updated', handlePreferenceUpdate);
      window.removeEventListener('theme-sync', handleThemeSync);
    };
  }, []);

  return {
    user,
    loading,
    error,
    refetch: fetchUser
  };
}