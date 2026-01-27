"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updatePreferences } from "@/lib/actions/user";
import { Check } from "lucide-react";
import { useState } from "react";

interface AccentColorSelectorProps {
  currentColor?: "red" | "blue" | "green" | "yellow" | "gray" | "pink";
}

export function AccentColorSelector({ currentColor = "pink" }: AccentColorSelectorProps) {
  const [selectedColor, setSelectedColor] = useState(currentColor);

  const colors = [
    {
      name: "Pink",
      value: "pink" as const,
      class: "bg-pink-500",
      hoverClass: "hover:bg-pink-600",
    },
    {
      name: "Red", 
      value: "red" as const,
      class: "bg-red-500",
      hoverClass: "hover:bg-red-600",
    },
    {
      name: "Blue",
      value: "blue" as const,
      class: "bg-blue-500", 
      hoverClass: "hover:bg-blue-600",
    },
    {
      name: "Green",
      value: "green" as const,
      class: "bg-green-500",
      hoverClass: "hover:bg-green-600",
    },
    {
      name: "Yellow",
      value: "yellow" as const,
      class: "bg-yellow-500",
      hoverClass: "hover:bg-yellow-600",
    },
    {
      name: "Gray",
      value: "gray" as const,
      class: "bg-gray-500",
      hoverClass: "hover:bg-gray-600",
    },
  ];

  const handleColorChange = async (color: "red" | "blue" | "green" | "yellow" | "gray" | "pink") => {
    setSelectedColor(color);
    
    // Update CSS custom properties for the selected color
    const root = document.documentElement;
    
    switch (color) {
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
    
    // Save to user preferences
    try {
      await updatePreferences({ accentColor: color });
    } catch (error) {
      console.error("Failed to save accent color preference:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base">Accent Color</Label>
        <p className="text-sm text-muted-foreground">
          Choose your preferred accent color for buttons and highlights.
        </p>
      </div>
      <div className="grid grid-cols-6 gap-3">
        {colors.map((color) => (
          <Button
            key={color.value}
            variant="outline"
            size="sm"
            onClick={() => handleColorChange(color.value)}
            className={`relative h-12 w-full p-0 border-2 ${
              selectedColor === color.value 
                ? "border-foreground" 
                : "border-border hover:border-muted-foreground"
            }`}
          >
            <div className={`w-full h-full rounded ${color.class} ${color.hoverClass} flex items-center justify-center`}>
              {selectedColor === color.value && (
                <Check className="h-4 w-4 text-white" />
              )}
            </div>
            <span className="sr-only">{color.name}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}