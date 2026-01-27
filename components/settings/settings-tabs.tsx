"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateProfile, updatePreferences, deleteAccount, updateProfilePicture, changePassword } from "@/lib/actions/user";
import { getTwoFactorStatus } from "@/lib/actions/two-factor";
import { Loader2, User as UserIcon, Lock, Bell, Download, Trash2, Camera, Eye, EyeOff, Palette, Shield, ShieldCheck, Key } from "lucide-react";
import { authClient } from "@/lib/auth/auth-client";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import { AccentColorSelector } from "@/components/accent-color-selector";
import { TwoFactorSetup } from "@/components/two-factor-setup";
import { TwoFactorDisable } from "@/components/two-factor-disable";
import { ConnectedAccounts } from "@/components/connected-accounts";
import { SessionManager } from "@/components/session-manager";
import { BackupCodesManager } from "@/components/backup-codes-manager";
import { refreshAvatarImages, clearAvatarCache } from "@/lib/utils/avatar-cache";
import { clearAllClientData } from "@/lib/utils/account-cleanup";
import { useAvatarKey } from "@/lib/hooks/useAvatarKey";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface User {
    _id: string;
    name: string;
    email: string;
    image?: string;
    preferences?: {
        emailNotifications?: boolean;
        weeklySummary?: boolean;
        defaultBoardView?: string;
        theme?: "light" | "dark" | "system";
        accentColor?: "red" | "blue" | "green" | "yellow" | "gray" | "pink";
    };
}

export default function SettingsTabs({ user, activeTab = "account" }: { user: User; activeTab?: string }) {
    const [loading, setLoading] = useState(false);
    const { avatarKey, refreshAvatarKey } = useAvatarKey();
    const [profileData, setProfileData] = useState({
        name: user.name,
        image: user.image || "",
    });

    const [preferences, setPreferences] = useState({
        emailNotifications: user.preferences?.emailNotifications ?? true,
        weeklySummary: user.preferences?.weeklySummary ?? false,
    });

    const [hasChanges, setHasChanges] = useState(false);

    // Update local state when user prop changes (e.g., after profile update)
    useEffect(() => {
        setProfileData({
            name: user.name,
            image: user.image || "",
        });
        setPreferences({
            emailNotifications: user.preferences?.emailNotifications ?? true,
            weeklySummary: user.preferences?.weeklySummary ?? false,
        });
    }, [user.name, user.image, user.preferences?.emailNotifications, user.preferences?.weeklySummary]);

    // Password State
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // 2FA State
    const [twoFactorStatus, setTwoFactorStatus] = useState({
        enabled: false,
        backupCodesCount: 0,
        verifiedAt: null as Date | null,
        lastUsedAt: null as Date | null,
    });
    const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
    const [showTwoFactorDisable, setShowTwoFactorDisable] = useState(false);
    const [showBackupCodes, setShowBackupCodes] = useState(false);

    // Load 2FA status on component mount
    useEffect(() => {
        const load2FAStatus = async () => {
            try {
                const result = await getTwoFactorStatus();
                if (result.success) {
                    setTwoFactorStatus({
                        enabled: result.enabled,
                        backupCodesCount: result.backupCodesCount,
                        verifiedAt: result.verifiedAt ? new Date(result.verifiedAt) : null,
                        lastUsedAt: result.lastUsedAt ? new Date(result.lastUsedAt) : null,
                    });
                }
            } catch (error) {
                console.error("Failed to load 2FA status:", error);
            }
        };
        load2FAStatus();
    }, []);

    // Handlers
    const handlePasswordChange = (field: string, value: string) => {
        setPasswordData(prev => ({ ...prev, [field]: value }));
    };

    const refresh2FAStatus = async () => {
        try {
            const result = await getTwoFactorStatus();
            if (result.success) {
                setTwoFactorStatus({
                    enabled: result.enabled,
                    backupCodesCount: result.backupCodesCount,
                    verifiedAt: result.verifiedAt ? new Date(result.verifiedAt) : null,
                    lastUsedAt: result.lastUsedAt ? new Date(result.lastUsedAt) : null,
                });
            }
        } catch (error) {
            console.error("Failed to refresh 2FA status:", error);
        }
    };
    const onUpdatePassword = async () => {
        if (!passwordData.currentPassword || !passwordData.newPassword) {
            toast.error("Please fill in both password fields");
            return;
        }

        if (passwordData.newPassword.length < 8) {
            toast.error("New password must be at least 8 characters long");
            return;
        }

        if (passwordData.currentPassword === passwordData.newPassword) {
            toast.error("New password must be different from current password");
            return;
        }

        setLoading(true);
        try {
            const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);

            if (result.error) {
                toast.error(result.error);
                return;
            }

            toast.success("Password updated successfully! You will be signed out shortly.");
            setPasswordData({ currentPassword: "", newPassword: "" });

            // Sign out after a short delay to let the toast be seen
            setTimeout(async () => {
                await authClient.signOut();
                window.location.href = "/sign-in";
            }, 2000);
        } catch (error: any) {
            console.error("Unexpected password update error:", error);
            toast.error("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const onDeleteAccount = async () => {
        setLoading(true);
        
        try {
            console.log("Starting account deletion process...");
            
            // Delete account on server first
            const res = await deleteAccount();
            
            if (res.success) {
                console.log("Account deleted successfully");
                toast.success("Account deleted successfully. Redirecting...");
                
                // Clear all client-side data
                try {
                    clearAllClientData();
                } catch (clearError) {
                    console.error("Error clearing client data:", clearError);
                }
                
                // Sign out and redirect
                try {
                    await authClient.signOut();
                } catch (signOutError) {
                    console.error("AuthClient signOut failed:", signOutError);
                }
                
                // Small delay to show success message, then redirect
                setTimeout(() => {
                    window.location.href = '/sign-in';
                }, 1000);
                
            } else {
                console.error("Account deletion failed:", res.error);
                toast.error(res.error || "Failed to delete account");
                setLoading(false);
            }
        } catch (error) {
            console.error("Account deletion error:", error);
            
            // More specific error message
            const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
            toast.error(`Account deletion failed: ${errorMessage}`);
            setLoading(false);
        }
    };

    const handleProfileChange = (field: string, value: string) => {
        setProfileData(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const handlePreferenceChange = (field: string, value: boolean) => {
        setPreferences(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };
    const onSaveProfile = async () => {
        setLoading(true);
        try {
            let finalImageUrl = profileData.image;
            let imageUploadFailed = false;
            let nameUpdateFailed = false;

            // Step 1: Handle image upload if needed
            if (profileData.image && profileData.image.startsWith("data:")) {
                try {
                    const res = await updateProfilePicture(profileData.image);
                    if (res.error || !res.imageUrl) {
                        console.error("Image upload failed:", res.error);
                        toast.error(res.error || "Failed to upload image");
                        imageUploadFailed = true;
                        finalImageUrl = user.image || ""; // Keep original image
                    } else {
                        finalImageUrl = res.imageUrl;
                        // Update local state immediately with the new image URL (with cache buster)
                        setProfileData(prev => ({ ...prev, image: finalImageUrl }));
                        
                        // Force re-render of avatar
                        refreshAvatarKey();
                        
                        // Force refresh all avatar images in the DOM to bypass cache
                        refreshAvatarImages(finalImageUrl);
                        
                        // Also clear cache for this user
                        if (user._id) {
                            clearAvatarCache(user._id);
                        }
                    }
                } catch (imageError) {
                    console.error("Image upload error:", imageError);
                    imageUploadFailed = true;
                    finalImageUrl = user.image || "";
                }
            }

            // Step 2: Update user profile with Better Auth
            try {
                const updateData: { name: string; image?: string } = {
                    name: profileData.name,
                };

                // Always include image in update (either new URL or existing)
                updateData.image = finalImageUrl;

                const { error } = await authClient.updateUser(updateData);

                if (error) {
                    console.error("Profile update error:", error);
                    toast.error(error.message || "Failed to update profile");
                    nameUpdateFailed = true;
                } else {
                    // Update local state immediately
                    setProfileData(prev => ({ 
                        ...prev, 
                        name: profileData.name,
                        image: finalImageUrl 
                    }));
                }
            } catch (updateError) {
                console.error("Profile update error:", updateError);
                nameUpdateFailed = true;
                toast.error("Failed to update profile");
            }

            // Step 3: Show appropriate success/error messages
            if (!nameUpdateFailed && !imageUploadFailed) {
                toast.success("Profile updated successfully!");
            } else if (!nameUpdateFailed && imageUploadFailed) {
                toast.success("Name updated successfully! Image upload failed - please try again.");
            } else if (nameUpdateFailed && !imageUploadFailed) {
                toast.error("Image uploaded but profile update failed. Please try again.");
            } else {
                toast.error("Failed to update profile. Please try again.");
                return; // Don't proceed with session refresh if everything failed
            }

            // Step 4: Refresh session and UI only if at least something succeeded
            if (!nameUpdateFailed) {
                try {
                    // Force refresh the auth client session
                    await authClient.getSession();
                    
                    // Update local state
                    setHasChanges(false);
                    
                    // Trigger profile update event for navbar and other components
                    window.dispatchEvent(new CustomEvent('profile-updated', {
                        detail: { 
                            name: profileData.name, 
                            image: finalImageUrl,
                            userId: user._id 
                        }
                    }));
                    
                } catch (refreshError) {
                    console.error('Failed to refresh session:', refreshError);
                    // Don't reload page, just show a message
                    toast.info("Profile updated! Please refresh the page to see changes in the navbar.");
                }
            }

        } catch (error: any) {
            console.error("Unexpected profile update error:", error);
            toast.error("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const onSavePreferences = async () => {
        setLoading(true);
        await updatePreferences(preferences);
        setLoading(false);
        setHasChanges(false);
    };

    // Mock Image Upload (User requested "Profile picture upload" but I don't have S3 credentials)
    // I will implement the UI behavior but it will just accept a URL or mock the action.
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 2MB limit
        if (file.size > 2 * 1024 * 1024) {
            alert("File size must be less than 2MB");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setProfileData(prev => ({ ...prev, image: base64String }));
            setHasChanges(true);
        };
        reader.readAsDataURL(file);
    };
    return (
        <Tabs value={activeTab} className="w-full">
            <div className="hidden">
                <TabsList className="flex flex-col h-auto items-stretch bg-transparent p-0 gap-1 text-left">
                    <TabsTrigger
                        value="account"
                        className="justify-start px-3 py-2 data-[state=active]:bg-secondary data-[state=active]:text-foreground hover:bg-muted/50 rounded-md transition-all"
                    >
                        <UserIcon className="mr-2 h-4 w-4" />
                        Account
                    </TabsTrigger>
                    <TabsTrigger
                        value="security"
                        className="justify-start px-3 py-2 data-[state=active]:bg-secondary data-[state=active]:text-foreground hover:bg-muted/50 rounded-md transition-all"
                    >
                        <Lock className="mr-2 h-4 w-4" />
                        Security
                    </TabsTrigger>
                    <TabsTrigger
                        value="customization"
                        className="justify-start px-3 py-2 data-[state=active]:bg-secondary data-[state=active]:text-foreground hover:bg-muted/50 rounded-md transition-all"
                    >
                        <Palette className="mr-2 h-4 w-4" />
                        Customization
                    </TabsTrigger>
                    <TabsTrigger
                        value="preferences"
                        className="justify-start px-3 py-2 data-[state=active]:bg-secondary data-[state=active]:text-foreground hover:bg-muted/50 rounded-md transition-all"
                    >
                        <Bell className="mr-2 h-4 w-4" />
                        Preferences
                    </TabsTrigger>
                    <TabsTrigger
                        value="data"
                        className="justify-start px-3 py-2 data-[state=active]:bg-secondary data-[state=active]:text-foreground hover:bg-muted/50 rounded-md transition-all"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Data
                    </TabsTrigger>
                </TabsList>
            </div>

            <div className="w-full">
                {/* ACCOUNT TAB */}
                <TabsContent value="account" className="mt-0 space-y-6">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium">Account</h3>
                            <p className="text-sm text-muted-foreground">
                                Manage your profile and personal details.
                            </p>
                        </div>
                        <Separator />

                        <Card>
                            <CardHeader>
                                <CardTitle>Profile</CardTitle>
                                <CardDescription>
                                    Update your public profile information.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex flex-col md:flex-row gap-6 items-start">
                                    <div className="flex flex-col items-center gap-3">
                                        <Avatar className="h-24 w-24" key={avatarKey}>
                                            <AvatarImage 
                                                src={profileData.image ? `${profileData.image}&_=${avatarKey}` : ""} 
                                                className="object-cover" 
                                            />
                                            <AvatarFallback className="text-xl bg-primary/10">
                                                {profileData.name.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="relative">
                                            <Input
                                                type="file"
                                                accept="image/png, image/jpeg"
                                                className="hidden"
                                                id="avatar-upload"
                                                onChange={handleImageUpload}
                                            />
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" asChild>
                                                    <label htmlFor="avatar-upload" className="cursor-pointer">
                                                        <Camera className="mr-2 h-3.5 w-3.5" />
                                                        Change
                                                    </label>
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => {
                                                        refreshAvatarKey();
                                                        if (user._id) {
                                                            clearAvatarCache(user._id);
                                                        }
                                                        toast.success("Avatar cache cleared");
                                                    }}
                                                    type="button"
                                                >
                                                    Refresh
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 flex-1 w-full">
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">Full Name</Label>
                                            <Input
                                                id="name"
                                                value={profileData.name}
                                                onChange={(e) => handleProfileChange("name", e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                value={user.email}
                                                disabled
                                                className="bg-muted text-muted-foreground cursor-not-allowed"
                                            />
                                            <p className="text-[0.8rem] text-muted-foreground">
                                                Email is managed by your authentication provider.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t px-6 py-4">
                                <Button onClick={onSaveProfile} disabled={loading || !hasChanges}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </TabsContent>
                {/* SECURITY TAB */}
                <TabsContent value="security" className="mt-0 space-y-6">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium">Security</h3>
                            <p className="text-sm text-muted-foreground">
                                Manage your password, two-factor authentication, and session security.
                            </p>
                        </div>
                        <Separator />

                        {/* Two-Factor Authentication */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    {twoFactorStatus.enabled ? (
                                        <ShieldCheck className="h-5 w-5 text-green-600" />
                                    ) : (
                                        <Shield className="h-5 w-5" />
                                    )}
                                    Two-Factor Authentication
                                </CardTitle>
                                <CardDescription>
                                    {twoFactorStatus.enabled 
                                        ? "Add an extra layer of security to your account with 2FA"
                                        : "Secure your account with two-factor authentication"
                                    }
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {twoFactorStatus.enabled ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between rounded-lg border p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                                    Two-factor authentication is enabled
                                                </p>
                                                <p className="text-xs text-green-700 dark:text-green-300">
                                                    Your account is protected with 2FA
                                                </p>
                                            </div>
                                            <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        </div>

                                        {twoFactorStatus.verifiedAt && (
                                            <div className="text-sm text-muted-foreground">
                                                <p>Enabled on: {twoFactorStatus.verifiedAt.toLocaleDateString()}</p>
                                                {twoFactorStatus.lastUsedAt && (
                                                    <p>Last used: {twoFactorStatus.lastUsedAt.toLocaleDateString()}</p>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowBackupCodes(true)}
                                                className="flex items-center gap-2"
                                            >
                                                <Key className="h-4 w-4" />
                                                Manage Backup Codes ({twoFactorStatus.backupCodesCount})
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowTwoFactorDisable(true)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                Disable 2FA
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium">
                                                    Two-factor authentication is disabled
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Add an extra layer of security to your account
                                                </p>
                                            </div>
                                            <Shield className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <Button
                                            onClick={() => setShowTwoFactorSetup(true)}
                                            className="w-full sm:w-auto"
                                        >
                                            <Shield className="mr-2 h-4 w-4" />
                                            Enable Two-Factor Authentication
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Password */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Password</CardTitle>
                                <CardDescription>
                                    Change your password securely.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 max-w-sm">
                                    <div className="grid gap-2">
                                        <Label htmlFor="current">Current Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="current"
                                                type={showCurrentPassword ? "text" : "password"}
                                                value={passwordData.currentPassword}
                                                onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
                                                className="pr-10"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-1/2 -translate-y-1/2 h-9 w-9 px-0 hover:bg-transparent text-muted-foreground hover:text-foreground"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            >
                                                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                <span className="sr-only">Toggle password visibility</span>
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="new">New Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="new"
                                                type={showNewPassword ? "text" : "password"}
                                                value={passwordData.newPassword}
                                                onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                                                className="pr-10"
                                                minLength={8}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-1/2 -translate-y-1/2 h-9 w-9 px-0 hover:bg-transparent text-muted-foreground hover:text-foreground"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                            >
                                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                <span className="sr-only">Toggle password visibility</span>
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Password must be at least 8 characters long
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t px-6 py-4">
                                <Button
                                    onClick={onUpdatePassword}
                                    disabled={loading || !passwordData.currentPassword || !passwordData.newPassword}
                                >
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Update Password
                                </Button>
                            </CardFooter>
                        </Card>

                        {/* Session Management */}
                        <ConnectedAccounts />
                        <SessionManager />
                    </div>
                </TabsContent>
                {/* CUSTOMIZATION TAB */}
                <TabsContent value="customization" className="mt-0 space-y-6">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium">Customization</h3>
                            <p className="text-sm text-muted-foreground">
                                Personalize your experience with themes and display preferences.
                            </p>
                        </div>
                        <Separator />
                        <Card>
                            <CardHeader>
                                <CardTitle>Appearance</CardTitle>
                                <CardDescription>
                                    Customize how Stride looks and feels.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ThemeToggle user={user} />
                                <div className="mt-6">
                                    <AccentColorSelector currentColor={user.preferences?.accentColor} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* PREFERENCES TAB */}
                <TabsContent value="preferences" className="mt-0 space-y-6">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium">Preferences</h3>
                            <p className="text-sm text-muted-foreground">
                                Customize your experience and notification settings.
                            </p>
                        </div>
                        <Separator />
                        <Card>
                            <CardHeader>
                                <CardTitle>Notifications</CardTitle>
                                <CardDescription>
                                    Control how we contact you.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Email Notifications</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Receive emails about your account activity.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={preferences.emailNotifications}
                                        onCheckedChange={(checked) => handlePreferenceChange("emailNotifications", checked)}
                                    />
                                </div>
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Weekly Summary</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Get a weekly digest of your application progress.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={preferences.weeklySummary}
                                        onCheckedChange={(checked) => handlePreferenceChange("weeklySummary", checked)}
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="border-t px-6 py-4">
                                <Button onClick={onSavePreferences} disabled={loading || !hasChanges}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Preferences
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </TabsContent>

                {/* DATA TAB */}
                <TabsContent value="data" className="mt-0 space-y-6">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium">Data Management</h3>
                            <p className="text-sm text-muted-foreground">
                                Control your personal data.
                            </p>
                        </div>
                        <Separator />

                        <Card>
                            <CardHeader>
                                <CardTitle>Export Data</CardTitle>
                                <CardDescription>
                                    Download all your job applications as a CSV file.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline">
                                    <Download className="mr-2 h-4 w-4" />
                                    Export CSV
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="border-destructive/20 bg-destructive/5">
                            <CardHeader>
                                <CardTitle className="text-destructive">Delete Account</CardTitle>
                                <CardDescription className="text-destructive/80">
                                    Permanently remove your account and all associated data. This action cannot be undone.
                                </CardDescription>
                            </CardHeader>
                            <CardFooter className="border-t border-destructive/10 px-6 py-4 bg-destructive/10">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="destructive"
                                            disabled={loading}
                                        >
                                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete Account
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete your
                                                account and remove your data from our servers.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={onDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                Delete Account
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardFooter>
                        </Card>
                    </div>
                </TabsContent>
            </div>

            {/* 2FA Dialogs */}
            <TwoFactorSetup
                isOpen={showTwoFactorSetup}
                onClose={() => setShowTwoFactorSetup(false)}
                onComplete={refresh2FAStatus}
            />
            <TwoFactorDisable
                isOpen={showTwoFactorDisable}
                onClose={() => setShowTwoFactorDisable(false)}
                onComplete={refresh2FAStatus}
            />
            <BackupCodesManager
                isOpen={showBackupCodes}
                onClose={() => setShowBackupCodes(false)}
                backupCodesCount={twoFactorStatus.backupCodesCount}
            />
        </Tabs>
    );
}