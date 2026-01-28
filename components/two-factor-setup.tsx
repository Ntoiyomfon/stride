"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Copy, Check, Shield, Smartphone, Key } from "lucide-react";
import { toast } from "sonner";
import { enrollMFA, verifyMFAEnrollment, generateBackupCodes } from "@/lib/actions/two-factor";

interface TwoFactorSetupProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
}

export function TwoFactorSetup({ isOpen, onClose, onComplete }: TwoFactorSetupProps) {
    const [step, setStep] = useState<"setup" | "verify" | "backup">("setup");
    const [loading, setLoading] = useState(false);
    const [qrCode, setQrCode] = useState("");
    const [secret, setSecret] = useState("");
    const [factorId, setFactorId] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [copiedSecret, setCopiedSecret] = useState(false);
    const [copiedBackup, setCopiedBackup] = useState(false);

    const handleInitiate = async () => {
        setLoading(true);
        try {
            const result = await enrollMFA();
            if (!result.success) {
                toast.error((result as any).error?.toString() || "Failed to enroll MFA");
                return;
            }

            const successResult = result as any;
            if (!successResult.data) {
                toast.error("No enrollment data received");
                return;
            }

            setFactorId(successResult.data.id);
            setQrCode(successResult.data.totp.qr_code);
            setSecret(successResult.data.totp.secret);
            setStep("verify");
        } catch (error) {
            toast.error("Failed to initiate 2FA setup");
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!verificationCode || verificationCode.length !== 6) {
            toast.error("Please enter a valid 6-digit code");
            return;
        }

        setLoading(true);
        try {
            const result = await verifyMFAEnrollment(factorId, verificationCode);
            if (!result.success || result.error) {
                toast.error((result as any).error?.toString() || "Failed to verify MFA");
                return;
            }

            // Generate backup codes after successful verification
            const backupResult = await generateBackupCodes();
            if (backupResult.success && (backupResult as any).data) {
                setBackupCodes((backupResult as any).data);
            }
            
            setStep("backup");
            toast.success("Two-factor authentication enabled successfully!");
        } catch (error) {
            toast.error("Failed to verify 2FA setup");
        } finally {
            setLoading(false);
        }
    };

    const copySecret = async () => {
        await navigator.clipboard.writeText(secret);
        setCopiedSecret(true);
        toast.success("Secret copied to clipboard");
        setTimeout(() => setCopiedSecret(false), 2000);
    };

    const copyBackupCodes = async () => {
        const codesText = backupCodes.join("\n");
        await navigator.clipboard.writeText(codesText);
        setCopiedBackup(true);
        toast.success("Backup codes copied to clipboard");
        setTimeout(() => setCopiedBackup(false), 2000);
    };

    const handleComplete = () => {
        onComplete();
        onClose();
        // Reset state for next time
        setStep("setup");
        setQrCode("");
        setSecret("");
        setVerificationCode("");
        setBackupCodes([]);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Enable Two-Factor Authentication
                    </DialogTitle>
                    <DialogDescription>
                        Add an extra layer of security to your account
                    </DialogDescription>
                </DialogHeader>

                {step === "setup" && (
                    <div className="space-y-4">
                        <div className="text-sm text-muted-foreground space-y-2">
                            <p>Two-factor authentication (2FA) adds an extra layer of security to your account.</p>
                            <p>You'll need an authenticator app like:</p>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                                <li>Google Authenticator</li>
                                <li>Authy</li>
                                <li>Microsoft Authenticator</li>
                            </ul>
                        </div>
                        <Button onClick={handleInitiate} disabled={loading} className="w-full">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Smartphone className="mr-2 h-4 w-4" />
                            Set Up 2FA
                        </Button>
                    </div>
                )}

                {step === "verify" && (
                    <div className="space-y-4">
                        <div className="text-center space-y-4">
                            <div className="bg-white p-4 rounded-lg inline-block">
                                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-medium">Or enter this code manually:</p>
                                <div className="flex items-center gap-2">
                                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono flex-1 text-center">
                                        {secret}
                                    </code>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={copySecret}
                                        className="shrink-0"
                                    >
                                        {copiedSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="verification-code">Enter verification code</Label>
                            <Input
                                id="verification-code"
                                placeholder="000000"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                maxLength={6}
                                className="text-center text-lg tracking-widest"
                            />
                            <p className="text-xs text-muted-foreground">
                                Enter the 6-digit code from your authenticator app
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setStep("setup")} className="flex-1">
                                Back
                            </Button>
                            <Button 
                                onClick={handleVerify} 
                                disabled={loading || verificationCode.length !== 6}
                                className="flex-1"
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Verify & Enable
                            </Button>
                        </div>
                    </div>
                )}

                {step === "backup" && (
                    <div className="space-y-4">
                        <div className="text-center space-y-2">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                                <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="font-semibold">2FA Enabled Successfully!</h3>
                            <p className="text-sm text-muted-foreground">
                                Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
                            </p>
                        </div>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Key className="h-4 w-4" />
                                    Backup Codes
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Each code can only be used once
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                                    {backupCodes.map((code, index) => (
                                        <div key={index} className="bg-muted px-2 py-1 rounded text-center">
                                            {code}
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={copyBackupCodes}
                                    className="w-full"
                                >
                                    {copiedBackup ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                                    Copy All Codes
                                </Button>
                            </CardContent>
                        </Card>

                        <Button onClick={handleComplete} className="w-full">
                            Complete Setup
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}