import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

interface BackToHomeButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "link";
}

export function BackToHomeButton({ className = "", variant = "outline" }: BackToHomeButtonProps) {
  return (
    <Button asChild variant={variant} className={className}>
      <Link href="/" className="inline-flex items-center gap-2">
        <Home className="h-4 w-4" />
        Back to Home
      </Link>
    </Button>
  );
}