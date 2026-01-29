"use server";

import { mfaService, MFAService } from "@/lib/auth/mfa-service";
import { AuthService } from "@/lib/auth/supabase-auth-service";
import { revalidatePath } from "next/cache";

/**
 * Server action to enroll in MFA
 */
export async function enrollMFA(friendlyName?: string) {
    try {
        console.log('🔐 Server action: enrollMFA called')
        
        // Use validateServerSession instead of getSession for security
        const sessionResult = await AuthService.validateServerSession();
        if (!sessionResult.user || !sessionResult.session) {
            console.error('❌ No valid session for MFA enrollment')
            return { success: false, error: "Not authenticated" };
        }

        console.log('✅ Valid session found for user:', sessionResult.user.id)
        
        // First check if user already has MFA factors
        const existingFactors = await mfaService.listFactors();
        if (existingFactors.success && existingFactors.data && existingFactors.data.length > 0) {
            console.log('⚠️ User already has MFA factors:', existingFactors.data.length)
            return { 
                success: false, 
                error: "Two-factor authentication is already enabled for this account" 
            };
        }
        
        const result = await mfaService.enrollMFA('totp', friendlyName || 'Authenticator App');
        
        if (!result.success) {
            console.error('❌ MFA enrollment failed:', result.error)
        } else {
            console.log('✅ MFA enrollment successful')
        }
        
        return result;
    } catch (error) {
        console.error('❌ Failed to enroll MFA:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : "Failed to enroll MFA" 
        };
    }
}

/**
 * Server action to verify MFA enrollment
 */
export async function verifyMFAEnrollment(factorId: string, code: string) {
    try {
        console.log('🔐 Server action: verifyMFAEnrollment called for factor:', factorId)
        
        const sessionResult = await AuthService.validateServerSession();
        if (!sessionResult.user || !sessionResult.session) {
            console.error('❌ No valid session for MFA verification')
            return { success: false, error: "Not authenticated" };
        }

        console.log('✅ Valid session found for user:', sessionResult.user.id)
        
        const result = await mfaService.verifyEnrollment(factorId, code);
        
        if (result.success) {
            console.log('✅ MFA verification successful, updating user profile')
            // Update user profile to mark 2FA as enabled
            await mfaService.updateUserMFAStatus(sessionResult.user.id, true);
            revalidatePath('/settings');
        } else {
            console.error('❌ MFA verification failed:', result.error)
        }
        
        return result;
    } catch (error) {
        console.error('❌ Failed to verify MFA enrollment:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : "Failed to verify MFA enrollment" 
        };
    }
}

/**
 * Server action to list MFA factors
 */
export async function listMFAFactors() {
    try {
        const sessionResult = await AuthService.validateServerSession();
        if (!sessionResult.user || !sessionResult.session) {
            return { success: false, error: "Not authenticated" };
        }

        const result = await mfaService.listFactors();
        return result;
    } catch (error) {
        console.error('Failed to list MFA factors:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : "Failed to list MFA factors" 
        };
    }
}

/**
 * Server action to unenroll MFA factor
 */
export async function unenrollMFAFactor(factorId: string) {
    try {
        const sessionResult = await AuthService.validateServerSession();
        if (!sessionResult.user || !sessionResult.session) {
            return { success: false, error: "Not authenticated" };
        }

        const result = await mfaService.unenrollFactor(factorId);
        
        if (result.success) {
            // Check if any factors remain
            const factorsResult = await mfaService.listFactors();
            if (factorsResult.success && (!factorsResult.data || factorsResult.data.length === 0)) {
                // No factors remain, disable 2FA in profile
                await mfaService.updateUserMFAStatus(sessionResult.user.id, false);
            }
            revalidatePath('/settings');
        }
        
        return result;
    } catch (error) {
        console.error('Failed to unenroll MFA factor:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : "Failed to unenroll MFA factor" 
        };
    }
}

/**
 * Server action to generate backup codes
 */
export async function generateBackupCodes() {
    try {
        const sessionResult = await AuthService.validateServerSession();
        if (!sessionResult.user || !sessionResult.session) {
            return { success: false, error: "Not authenticated" };
        }

        const result = await mfaService.generateBackupCodes(sessionResult.user.id);
        return result;
    } catch (error) {
        console.error('Failed to generate backup codes:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : "Failed to generate backup codes" 
        };
    }
}

/**
 * Server action to verify backup code
 */
export async function verifyBackupCode(code: string) {
    try {
        const sessionResult = await AuthService.validateServerSession();
        if (!sessionResult.user || !sessionResult.session) {
            return { success: false, error: "Not authenticated" };
        }

        const result = await mfaService.verifyBackupCode(sessionResult.user.id, code);
        return result;
    } catch (error) {
        console.error('Failed to verify backup code:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : "Failed to verify backup code" 
        };
    }
}

/**
 * Server action to create MFA challenge
 */
export async function createMFAChallenge(factorId: string) {
    try {
        const result = await mfaService.createChallenge(factorId);
        return result;
    } catch (error) {
        console.error('Failed to create MFA challenge:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : "Failed to create MFA challenge" 
        };
    }
}

/**
 * Server action to verify MFA challenge
 */
export async function verifyMFAChallenge(factorId: string, challengeId: string, code: string) {
    try {
        const result = await mfaService.verifyChallenge(factorId, challengeId, code);
        return result;
    } catch (error) {
        console.error('Failed to verify MFA challenge:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : "Failed to verify MFA challenge" 
        };
    }
}

/**
 * Server action to disable 2FA completely
 */
export async function disable2FA() {
    try {
        const sessionResult = await AuthService.validateServerSession();
        if (!sessionResult.user || !sessionResult.session) {
            return { success: false, error: "Not authenticated" };
        }

        const userId = sessionResult.user.id;

        // Get all factors
        const factorsResult = await mfaService.listFactors();
        if (!factorsResult.success) {
            return { success: false, error: "Failed to list MFA factors" };
        }

        // Unenroll all factors
        const factors = factorsResult.data || [];
        for (const factor of factors) {
            await mfaService.unenrollFactor(factor.id);
        }

        // Update user profile
        await mfaService.updateUserMFAStatus(userId, false);

        // Clear backup codes
        await ((mfaService.client as any)
            .from('user_profiles')
            .update({
                two_factor_backup_codes: [],
                updated_at: new Date().toISOString()
            })
            .eq('id', userId));

        revalidatePath('/settings');
        return { success: true };
    } catch (error) {
        console.error('Failed to disable 2FA:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : "Failed to disable 2FA" 
        };
    }
}

/**
 * Server action to get user's 2FA status
 */
export async function get2FAStatus() {
    try {
        const sessionResult = await AuthService.validateServerSession();
        if (!sessionResult.user || !sessionResult.session) {
            return { success: false, error: "Not authenticated" };
        }

        const userId = sessionResult.user.id;

        // Use server client to get user profile
        const { createSupabaseServerClient } = await import('../supabase/utils')
        const serverClient = await createSupabaseServerClient()

        // Get user profile
        const { data: profile, error: profileError } = await (serverClient
            .from('user_profiles')
            .select('two_factor_enabled, two_factor_backup_codes')
            .eq('id', userId)
            .single() as any);

        if (profileError) {
            console.error('Failed to get user profile for 2FA status:', profileError)
            return { success: false, error: "Failed to get user profile" };
        }

        // Get MFA factors
        const factorsResult = await mfaService.listFactors();
        if (!factorsResult.success) {
            console.error('Failed to list MFA factors:', factorsResult.error)
            return { success: false, error: "Failed to list MFA factors" };
        }

        const factors = factorsResult.data || [];
        const hasBackupCodes = ((profile as any)?.two_factor_backup_codes || []).length > 0;

        console.log('2FA Status check:', {
            profileEnabled: (profile as any)?.two_factor_enabled,
            factorsCount: factors.length,
            hasBackupCodes
        })

        return {
            success: true,
            data: {
                enabled: (profile as any)?.two_factor_enabled || false,
                factors,
                hasBackupCodes,
                backupCodesCount: ((profile as any)?.two_factor_backup_codes || []).length
            }
        };
    } catch (error) {
        console.error('Failed to get 2FA status:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : "Failed to get 2FA status" 
        };
    }
}

/**
 * Server action to verify two-factor login (stub for future implementation)
 */
export async function verifyTwoFactorLogin(code: string) {
    // This is a stub function for the TwoFactorChallenge component
    // In a full implementation, this would handle 2FA verification during login
    return { success: false, error: "Two-factor login verification not yet implemented" };
}