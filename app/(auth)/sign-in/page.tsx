"use client";

import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/lib/auth/supabase-auth-service";
import { OAuthButtons } from "@/components/oauth-buttons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const router = useRouter();

  // Check for success message from password reset and OAuth errors
  useEffect(() => {
    // Clear form fields
    setEmail("");
    setPassword("");
    setError("");
    setSuccessMessage("");
    setLoading(false);
    
    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check for success message from password reset
    if (urlParams.get('message') === 'password-reset-success') {
      setSuccessMessage("Password reset successful! You can now sign in with your new password.");
    }
    
    // Check for OAuth errors
    if (urlParams.get('error') === 'oauth_error') {
      const errorMessage = urlParams.get('message') || 'OAuth authentication failed';
      setError(decodeURIComponent(errorMessage));
    }
    
    // Clean up URL if there are parameters
    if (urlParams.toString()) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await authService.signIn({
        email,
        password,
      });

      if (!result.success) {
        setError(result.error?.message ?? "Failed to sign in");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

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
            <CardTitle className="text-2xl font-bold text-foreground">
              Sign In
            </CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-md bg-green-50 dark:bg-green-950/20 p-3 text-sm text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800"
              >
                {successMessage}
              </motion.div>
            )}
            
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-md bg-destructive/15 p-3 text-sm text-destructive"
              >
                {error}
              </motion.div>
            )}
            
            <OAuthButtons mode="signin" />
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Label htmlFor="email">
                  Email
                </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
              </motion.div>
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Label htmlFor="password">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    className="pr-10"
                  />
                  <motion.button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {showPassword ? (
                        <motion.div
                          key="eye-off"
                          initial={{ rotate: -180, scale: 0 }}
                          animate={{ rotate: 0, scale: 1 }}
                          exit={{ rotate: 180, scale: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <EyeOff className="h-5 w-5" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="eye"
                          initial={{ rotate: -180, scale: 0 }}
                          animate={{ rotate: 0, scale: 1 }}
                          exit={{ rotate: 180, scale: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Eye className="h-5 w-5" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
                <div className="text-center mt-2">
                  <p className="text-sm text-muted-foreground">
                    Can't access your account?{" "}
                    <Link
                      href="/recovery"
                      className="font-medium text-primary hover:underline"
                    >
                      Use recovery code
                    </Link>
                  </p>
                </div>
              </motion.div>
              
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <p className="text-center text-sm text-muted-foreground w-full">
              Don't have an account?{" "}
              <Link
                href="/sign-up"
                className="font-medium text-primary hover:underline"
              >
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}