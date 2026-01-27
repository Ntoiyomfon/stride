"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Shield, Smartphone, Key } from "lucide-react";
import { toast } from "sonner";
import { verifyTwoFactorLogin } from "@/lib/actions/two-factor";

interface TwoFactorChallengeProps {
    onSuccess: () => void;
    onCancel?: () => void;
}

export function TwoFactorChallenge({ onSuccess, onCancel }: TwoFactorChallengeProps) {
    const [loading, setLoading] = useState(false);
    const [verificationCode, setVerificationCode] = useState("");
    const [useBackupCode, setUseBackupCode] = useState(false);

    const handleVerify = async () => {
        if (!verificationCode) {
            toast.error("Please enter a verification code");
            return;
        }

        if (!useBackupCode && verificationCode.length !== 6) {
            toast.error("Please enter a valid 6-digit code");
            return;
        }

        if (useBackupCode && verificationCode.length !== 8) {
            toast.error("Please enter a valid 8-character backup code");
            return;
        }

        setLoading(true);
        try {
            const result = await verifyTwoFactorLogin(verificationCode);
            if (result.error) {
                toast.error(result.error);
                return;
            }

            toast.success("Verification successful");
            onSuccess();
        } catch (error) {
            toast.error("Failed to verify code");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (value: string) => {
        if (useBackupCode) {
            // Backup codes are 8-character alphanumeric
            setVerificationCode(value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8));
        } else {
            // TOTP codes are 6-digit numbers
            setVerificationCode(value.replace(/\D/g, "").slice(0, 6));
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>
                    Enter your verification code to continue
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="verification-code">
                        {useBackupCode ? "Backup Code" : "Verification Code"}
                    </Label>
                    <Input
                        id="verification-code"
                        placeholder={useBackupCode ? "XXXXXXXX" : "000000"}
                        value={verificationCode}
                        onChange={(e) => handleInputChange(e.target.value)}
                        maxLength={useBackupCode ? 8 : 6}
                        className="text-center text-lg tracking-widest font-mono"
                    />
                    <p className="text-xs text-muted-foreground text-center">
                        {useBackupCode 
                            ? "Enter one of your 8-character backup codes"
                            : "Enter the 6-digit code from your authenticator app"
                        }
                    </p>
                </div>

                <div className="space-y-3">
                    <Button 
                        onClick={handleVerify} 
                        disabled={loading || !verificationCode || (useBackupCode ? verificationCode.length !== 8 : verificationCode.length !== 6)}
                        className="w-full"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {useBackupCode ? <Key className="mr-2 h-4 w-4" /> : <Smartphone className="mr-2 h-4 w-4" />}
                        Verify
                    </Button>

                    <div className="text-center">
                        <Button
                            variant="link"
                            size="sm"
                            onClick={() => {
                                setUseBackupCode(!useBackupCode);
                                setVerificationCode("");
                            }}
                            className="text-xs"
                        >
                            {useBackupCode 
                                ? "Use authenticator app instead" 
                                : "Use backup code instead"
                            }
                        </Button>
                    </div>

                    {onCancel && (
                        <Button
                            variant="outline"
                            onClick={onCancel}
                            className="w-full"
                        >
                            Cancel
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}