import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stride - Authentication",
  description: "Sign in or sign up to track your job applications.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}