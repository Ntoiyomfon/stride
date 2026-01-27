"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ShieldOff, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { disableTwoFactor } from "@/lib/actions/two-factor";

interface TwoFactorDisableProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
}

export function TwoFactorDisable({ isOpen, onClose, onComplete }: TwoFactorDisableProps) {
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleDisable = async () => {
        if (!password) {
            toast.error("Please enter your password");
            return;
        }

        setLoading(true);
        try {
            const result = await disableTwoFactor(password);
            if (result.error) {
                toast.error(result.error);
                return;
            }

            toast.success("Two-factor authentication disabled");
            onComplete();
            onClose();
            setPassword("");
        } catch (error) {
            toast.error("Failed to disable 2FA");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        onClose();
        setPassword("");
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <ShieldOff className="h-5 w-5" />
                        Disable Two-Factor Authentication
                    </DialogTitle>
                    <DialogDescription>
                        This will remove the extra security layer from your account
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-destructive">
                                    Security Warning
                                </p>
                                <p className="text-sm text-destructive/80">
                                    Disabling 2FA will make your account less secure. Anyone with your password will be able to access your account.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Confirm your password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-1/2 -translate-y-1/2 h-9 w-9 px-0 hover:bg-transparent text-muted-foreground hover:text-foreground"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                <span className="sr-only">Toggle password visibility</span>
                            </Button>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button variant="outline" onClick={handleClose} className="flex-1">
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive"
                            onClick={handleDisable} 
                            disabled={loading || !password}
                            className="flex-1"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Disable 2FA
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}