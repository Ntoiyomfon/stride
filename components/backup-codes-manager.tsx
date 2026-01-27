"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Copy, Check, Key, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { regenerateBackupCodes } from "@/lib/actions/two-factor";

interface BackupCodesManagerProps {
    isOpen: boolean;
    onClose: () => void;
    backupCodesCount: number;
}

export function BackupCodesManager({ isOpen, onClose, backupCodesCount }: BackupCodesManagerProps) {
    const [loading, setLoading] = useState(false);
    const [verificationCode, setVerificationCode] = useState("");
    const [newBackupCodes, setNewBackupCodes] = useState<string[]>([]);
    const [copied, setCopied] = useState(false);
    const [step, setStep] = useState<"verify" | "codes">("verify");

    const handleRegenerate = async () => {
        if (!verificationCode || verificationCode.length !== 6) {
            toast.error("Please enter a valid 6-digit code");
            return;
        }

        setLoading(true);
        try {
            const result = await regenerateBackupCodes(verificationCode);
            if (result.error) {
                toast.error(result.error);
                return;
            }

            setNewBackupCodes(result.backupCodes!);
            setStep("codes");
            toast.success("New backup codes generated");
        } catch (error) {
            toast.error("Failed to regenerate backup codes");
        } finally {
            setLoading(false);
        }
    };

    const copyBackupCodes = async () => {
        const codesText = newBackupCodes.join("\n");
        await navigator.clipboard.writeText(codesText);
        setCopied(true);
        toast.success("Backup codes copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClose = () => {
        onClose();
        setStep("verify");
        setVerificationCode("");
        setNewBackupCodes([]);
        setCopied(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Manage Backup Codes
                    </DialogTitle>
                    <DialogDescription>
                        Generate new backup codes for your account
                    </DialogDescription>
                </DialogHeader>

                {step === "verify" && (
                    <div className="space-y-4">
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                        Important
                                    </p>
                                    <p className="text-sm text-amber-700 dark:text-amber-300">
                                        Generating new backup codes will invalidate all existing codes. Make sure to save the new ones.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="text-sm text-muted-foreground">
                            <p>You currently have <strong>{backupCodesCount}</strong> backup codes remaining.</p>
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
                            <Button variant="outline" onClick={handleClose} className="flex-1">
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleRegenerate} 
                                disabled={loading || verificationCode.length !== 6}
                                className="flex-1"
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Generate New Codes
                            </Button>
                        </div>
                    </div>
                )}

                {step === "codes" && (
                    <div className="space-y-4">
                        <div className="text-center space-y-2">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                                <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="font-semibold">New Backup Codes Generated</h3>
                            <p className="text-sm text-muted-foreground">
                                Save these codes in a safe place. Your old backup codes are no longer valid.
                            </p>
                        </div>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Key className="h-4 w-4" />
                                    New Backup Codes
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Each code can only be used once
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                                    {newBackupCodes.map((code, index) => (
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
                                    {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                                    Copy All Codes
                                </Button>
                            </CardContent>
                        </Card>

                        <Button onClick={handleClose} className="w-full">
                            Done
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}