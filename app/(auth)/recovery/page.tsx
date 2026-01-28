"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recoverAccount } from "@/lib/actions/recovery";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Shield, ArrowLeft } from "lucide-react";

export default function RecoveryPage() {
  const [identifier, setIdentifier] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  // Clear form when component mounts
  useEffect(() => {
    setIdentifier("");
    setRecoveryCode("");
    setError("");
    setLoading(false);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await recoverAccount(identifier, recoveryCode);

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        // This functionality will be implemented later
        router.push("/sign-in?message=recovery-not-implemented");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Normalize code input - uppercase and remove spaces
    const value = e.target.value.toUpperCase().replace(/\s/g, '');
    setRecoveryCode(value);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.4,
          ease: [0.23, 1, 0.32, 1],
          delay: 0.1
        }}
      >
        <Card className="w-full md:w-[538px] shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  Account Recovery
                </CardTitle>
                <CardDescription>
                  Use a recovery code generated when you enabled 2FA
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-md bg-destructive/15 p-3 text-sm text-destructive"
              >
                {error}
              </motion.div>
            )}

            <div className="rounded-lg bg-muted/50 p-4">
              <h3 className="font-medium text-foreground mb-2">Recovery Instructions</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Enter your email address or username</li>
                <li>• Enter one of your 8-character backup codes</li>
                <li>• You'll be required to set a new password</li>
                <li>• Each recovery code can only be used once</li>
              </ul>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Label htmlFor="identifier">
                  Email or Username
                </Label>
                <Input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="your@email.com or username"
                  required
                  autoComplete="username"
                />
              </motion.div>

              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Label htmlFor="recoveryCode">
                  Recovery Code
                </Label>
                <Input
                  id="recoveryCode"
                  type="text"
                  value={recoveryCode}
                  onChange={handleCodeChange}
                  placeholder="XXXXXXXX"
                  required
                  maxLength={8}
                  className="font-mono text-center tracking-wider"
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the 8-character recovery code from your backup codes
                </p>
              </motion.div>
              
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? "Recovering Account..." : "Recover Account"}
              </Button>
            </form>

            <div className="text-center">
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}