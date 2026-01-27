import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stride - Track Your Job Applications",
  description: "Stay organized, follow up on time, and know where you stand with your job applications.",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}