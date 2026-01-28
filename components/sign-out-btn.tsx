"use client";

import { authService } from "@/lib/auth/supabase-auth-service";
import { DropdownMenuItem } from "./ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const result = await authService.signOut();
      if (result.success) {
        toast.success("Signed out successfully");
        router.push("/sign-in");
      } else {
        console.error("Sign out error:", result.error);
        toast.error("Error signing out. Please try again.");
      }
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Error signing out. Please try again.");
    }
  };

  return (
    <DropdownMenuItem onClick={handleSignOut}>
      Log Out
    </DropdownMenuItem>
  );
}