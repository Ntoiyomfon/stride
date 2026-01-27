import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stride - Dashboard",
  description: "Manage your job applications and track your progress.",
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}