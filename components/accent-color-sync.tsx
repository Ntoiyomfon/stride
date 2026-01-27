"use client";

import { useEffect } from "react";

interface User {
  preferences?: {
    accentColor?: "red" | "blue" | "green" | "yellow" | "gray" | "pink";
  };
}

interface AccentColorSyncProps {
  user: User;
}

export function AccentColorSync({ user }: AccentColorSyncProps) {
  useEffect(() => {
    const accentColor = user.preferences?.accentColor || "pink";
    const root = document.documentElement;
    
    switch (accentColor) {
      case "red":
        root.style.setProperty("--primary", "#ef4444");
        root.style.setProperty("--ring", "#ef4444");
        break;
      case "blue":
        root.style.setProperty("--primary", "#3b82f6");
        root.style.setProperty("--ring", "#3b82f6");
        break;
      case "green":
        root.style.setProperty("--primary", "#22c55e");
        root.style.setProperty("--ring", "#22c55e");
        break;
      case "yellow":
        root.style.setProperty("--primary", "#eab308");
        root.style.setProperty("--ring", "#eab308");
        break;
      case "gray":
        root.style.setProperty("--primary", "#6b7280");
        root.style.setProperty("--ring", "#6b7280");
        break;
      case "pink":
      default:
        root.style.setProperty("--primary", "#f76382");
        root.style.setProperty("--ring", "#f76382");
        break;
    }
  }, [user.preferences?.accentColor]);

  return null; // This component doesn't render anything
}