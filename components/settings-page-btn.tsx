"use client";

import { DropdownMenuItem } from "./ui/dropdown-menu";
import { useRouter } from "next/navigation";

export default function SettingsPageBtn() {
  const router = useRouter();

  return (
    <DropdownMenuItem
      onClick={() => {
        router.push("/settings");
      }}
    >
      Settings
    </DropdownMenuItem>
  );
}