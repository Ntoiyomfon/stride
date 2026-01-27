"use server";

import { generateSecret, generateURI, verify } from 'otplib';
import QRCode from 'qrcode';
import { getSession } from "@/lib/auth/auth";
import connectDB from "@/lib/db";
import User from "@/lib/models/user";
import { encryptSecret, decryptSecret, hashBackupCode, generateBackupCodes } from "@/lib/crypto";
import { revalidatePath } from "next/cache";

export async function initiateTwoFactor() {
    const session = await getSession();
    if (!session?.user) return { error: "Unauthorized" };

    await connectDB();

    try {
        // Generate TOTP secret
        const secret = generateSecret();
        const encryptedSecret = encryptSecret(secret);

        // Store encrypted secret temporarily (not enabled yet)
        await User.findByIdAndUpdate(session.user.id, {
            $set: { twoFactorSecret: encryptedSecret }
        });

        // Generate QR code URI
        const otpauth = generateURI({
            issuer: 'Stride Job Tracker',
            label: session.user.email,
            secret: secret
        });

        const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

        return {
            success: true,
            qrCode: qrCodeDataUrl,
            secret: secret, // For manual entry
            backupUrl: otpauth
        };
    } catch (error) {
        console.error("Failed to initiate 2FA:", error);
        return { error: "Failed to initiate 2FA setup" };
    }
}

export async function verifyTwoFactorSetup(token: string) {
    const session = await getSession();
    if (!session?.user) return { error: "Unauthorized" };

    await connectDB();

    try {
        const user = await User.findById(session.user.id);
        if (!user?.twoFactorSecret) {
            return { error: "No 2FA setup in progress" };
        }

        // Decrypt secret and verify token
        const secret = decryptSecret(user.twoFactorSecret);
        const isValid = verify({ token, secret });

        if (!isValid) {
            return { error: "Invalid verification code" };
        }

        // Generate backup codes
        const backupCodes = generateBackupCodes();
        const hashedBackupCodes = backupCodes.map(code => hashBackupCode(code));

        // Enable 2FA
        await User.findByIdAndUpdate(session.user.id, {
            $set: {
                twoFactorEnabled: true,
                twoFactorVerifiedAt: new Date(),
                twoFactorBackupCodes: hashedBackupCodes
            }
        });

        revalidatePath("/settings");

        return {
            success: true,
            backupCodes: backupCodes // Return raw codes for user to save
        };
    } catch (error) {
        console.error("Failed to verify 2FA setup:", error);
        return { error: "Failed to verify 2FA setup" };
    }
}

export async function verifyTwoFactorLogin(token: string) {
    const session = await getSession();
    if (!session?.user) return { error: "Unauthorized" };

    await connectDB();

    try {
        const user = await User.findById(session.user.id);
        if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
            return { error: "2FA not enabled" };
        }

        // Check if it's a backup code
        if (token.length === 8 && /^[A-Z0-9]+$/.test(token)) {
            const hashedToken = hashBackupCode(token);
            const codeIndex = user.twoFactorBackupCodes?.indexOf(hashedToken);
            
            if (codeIndex !== undefined && codeIndex !== -1) {
                // Remove used backup code
                const updatedCodes = [...(user.twoFactorBackupCodes || [])];
                updatedCodes.splice(codeIndex, 1);
                
                await User.findByIdAndUpdate(session.user.id, {
                    $set: {
                        twoFactorBackupCodes: updatedCodes,
                        lastTwoFactorAt: new Date()
                    }
                });

                return { success: true, method: "backup" };
            }
        }

        // Verify TOTP token
        const secret = decryptSecret(user.twoFactorSecret);
        const isValid = verify({ token, secret });

        if (!isValid) {
            return { error: "Invalid verification code" };
        }

        // Update last 2FA time
        await User.findByIdAndUpdate(session.user.id, {
            $set: { lastTwoFactorAt: new Date() }
        });

        return { success: true, method: "totp" };
    } catch (error) {
        console.error("Failed to verify 2FA login:", error);
        return { error: "Failed to verify 2FA code" };
    }
}

export async function disableTwoFactor(password: string) {
    const session = await getSession();
    if (!session?.user) return { error: "Unauthorized" };

    await connectDB();

    try {
        // Verify password using Better Auth
        const { authClient } = await import("@/lib/auth/auth-client");
        const passwordCheck = await authClient.signIn.email({
            email: session.user.email,
            password: password
        });

        if (passwordCheck.error) {
            return { error: "Invalid password" };
        }

        // Disable 2FA
        await User.findByIdAndUpdate(session.user.id, {
            $unset: {
                twoFactorSecret: "",
                twoFactorBackupCodes: "",
                twoFactorVerifiedAt: "",
                lastTwoFactorAt: ""
            },
            $set: {
                twoFactorEnabled: false
            }
        });

        revalidatePath("/settings");

        return { success: true };
    } catch (error) {
        console.error("Failed to disable 2FA:", error);
        return { error: "Failed to disable 2FA" };
    }
}

export async function regenerateBackupCodes(token: string) {
    const session = await getSession();
    if (!session?.user) return { error: "Unauthorized" };

    await connectDB();

    try {
        const user = await User.findById(session.user.id);
        if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
            return { error: "2FA not enabled" };
        }

        // Verify current 2FA token
        const secret = decryptSecret(user.twoFactorSecret);
        const isValid = verify({ token, secret });

        if (!isValid) {
            return { error: "Invalid verification code" };
        }

        // Generate new backup codes
        const backupCodes = generateBackupCodes();
        const hashedBackupCodes = backupCodes.map(code => hashBackupCode(code));

        await User.findByIdAndUpdate(session.user.id, {
            $set: { twoFactorBackupCodes: hashedBackupCodes }
        });

        return {
            success: true,
            backupCodes: backupCodes
        };
    } catch (error) {
        console.error("Failed to regenerate backup codes:", error);
        return { error: "Failed to regenerate backup codes" };
    }
}

export async function logoutAllSessions() {
    const session = await getSession();
    if (!session?.user) return { error: "Unauthorized" };

    try {
        await connectDB();
        
        // Direct database approach - remove all sessions for this user
        const mongoose = await import("mongoose");
        const db = mongoose.connection.db;
        
        if (!db) {
            throw new Error("Database connection not available");
        }
        
        // Better Auth typically stores sessions in a 'session' collection
        const sessionsCollection = db.collection('session');
        
        // Remove all sessions for this user
        const deleteResult = await sessionsCollection.deleteMany({
            userId: session.user.id
        });
        
        console.log(`Deleted ${deleteResult.deletedCount} sessions for user ${session.user.id}`);
        
        // Also try the Better Auth API as backup
        try {
            const { auth } = await import("@/lib/auth/auth");
            const { headers } = await import("next/headers");
            
            await auth.api.revokeOtherSessions({
                headers: await headers()
            });
        } catch (apiError) {
            console.log("Better Auth API failed, but database cleanup succeeded:", apiError);
        }

        return { success: true, deletedSessions: deleteResult.deletedCount };
    } catch (error) {
        console.error("Failed to revoke sessions:", error);
        return { error: "Failed to revoke sessions on server" };
    }
}

export async function getTwoFactorStatus() {
    const session = await getSession();
    if (!session?.user) return { error: "Unauthorized" };

    await connectDB();

    try {
        const user = await User.findById(session.user.id).select(
            'twoFactorEnabled twoFactorVerifiedAt lastTwoFactorAt twoFactorBackupCodes'
        );

        return {
            success: true,
            enabled: user?.twoFactorEnabled || false,
            verifiedAt: user?.twoFactorVerifiedAt,
            lastUsedAt: user?.lastTwoFactorAt,
            backupCodesCount: user?.twoFactorBackupCodes?.length || 0
        };
    } catch (error) {
        console.error("Failed to get 2FA status:", error);
        return { error: "Failed to get 2FA status" };
    }
}