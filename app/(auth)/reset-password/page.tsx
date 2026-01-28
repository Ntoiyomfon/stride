"use client";

import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordAfterRecovery } from "@/lib/actions/recovery";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { KeyRound } from "lucide-react";

interface RecoverySession {
  userId: string;
  email: string;
  timestamp: number;
}

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recoverySession, setRecoverySession] = useState<RecoverySession | null>(null);

  const router = useRouter();

  useEffect(() => {
    // Clear form fields
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setLoading(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    
    // Check for valid recovery session
    const sessionData = sessionStorage.getItem('recovery-session');
    if (!sessionData) {
      router.push('/sign-in');
      return;
    }

    try {
      const session: RecoverySession = JSON.parse(sessionData);
      const now = Date.now();
      const sessionAge = now - session.timestamp;
      const maxAge = 10 * 60 * 1000; // 10 minutes

      if (sessionAge > maxAge) {
        sessionStorage.removeItem('recovery-session');
        router.push('/sign-in');
        return;
      }

      setRecoverySession(session);
    } catch (error) {
      router.push('/sign-in');
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!recoverySession) {
      setError("Invalid recovery session");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await resetPasswordAfterRecovery(
        recoverySession.userId,
        newPassword
      );

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        // Clear recovery session
        sessionStorage.removeItem('recovery-session');
        
        // Instead of trying to sign in, redirect to sign-in page with success message
        router.push("/sign-in?message=password-reset-success");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];

  if (!recoverySession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
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
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <KeyRound className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  Set New Password
                </CardTitle>
                <CardDescription>
                  You signed in using account recovery. Set a new password to continue.
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
              <h3 className="font-medium text-foreground mb-2">Password Requirements</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• At least 8 characters long</li>
                <li>• Mix of uppercase and lowercase letters</li>
                <li>• Include numbers and special characters</li>
                <li>• Cannot reuse your previous password</li>
              </ul>
            </div>

            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Account:</strong> {recoverySession.email}
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Label htmlFor="newPassword">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={8}
                    className="pr-10"
                    autoComplete="new-password"
                  />
                  <motion.button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {showNewPassword ? (
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
                
                {newPassword && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Password Strength</span>
                      <span className={`font-medium ${passwordStrength >= 3 ? 'text-green-600' : passwordStrength >= 2 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {strengthLabels[passwordStrength - 1] || "Very Weak"}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-2 flex-1 rounded-full ${
                            level <= passwordStrength
                              ? strengthColors[passwordStrength - 1] || "bg-red-500"
                              : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>

              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Label htmlFor="confirmPassword">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={8}
                    className="pr-10"
                    autoComplete="new-password"
                  />
                  <motion.button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {showConfirmPassword ? (
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
                
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-600">Passwords do not match</p>
                )}
              </motion.div>
              
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={loading || newPassword !== confirmPassword || passwordStrength < 2}
              >
                {loading ? "Setting Password..." : "Set New Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}