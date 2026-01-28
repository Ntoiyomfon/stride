"use server";

import { sessionManager, SessionManager } from "@/lib/auth/session-manager";
import { authService } from "@/lib/auth/supabase-auth-service";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import type { SessionInfo } from "@/lib/auth/session-manager";

/**
 * Create a session record for the current user session
 */
export async function createSessionRecord(sessionId: string, userId: string) {
    try {
        const requestHeaders = await headers();
        const userAgent = requestHeaders.get('user-agent') || 'Unknown';
        const ipAddress = requestHeaders.get('x-forwarded-for') || 
                         requestHeaders.get('x-real-ip') || 
                         '127.0.0.1';
        
        const result = await sessionManager.createSessionRecord(
            sessionId, 
            userId, 
            userAgent, 
            ipAddress
        );
        
        return result;
    } catch (error) {
        console.error('Failed to create session record:', error);
        return { success: false, error: "Failed to create session record" };
    }
}

/**
 * Update session activity timestamp
 */
export async function updateSessionActivity(sessionId: string) {
    try {
        const result = await sessionManager.updateSessionActivity(sessionId);
        return result;
    } catch (error) {
        console.error('Failed to update session activity:', error);
        return { success: false, error: "Failed to update session activity" };
    }
}

/**
 * Get all active sessions for the current user
 */
export async function getUserSessions(userId?: string): Promise<{ sessions?: SessionInfo[]; error?: string }> {
    try {
        // Get current session to identify which one is current
        const currentSession = await authService.getSession();
        if (!currentSession.success || !currentSession.data) {
            return { error: "No active session found" };
        }

        const targetUserId = userId || currentSession.data.user?.id;
        if (!targetUserId) {
            return { error: "User ID not found" };
        }

        const result = await sessionManager.getUserSessions(
            targetUserId, 
            currentSession.data.access_token
        );
        
        return result;
    } catch (error) {
        console.error('Failed to get user sessions:', error);
        return { error: "Failed to retrieve sessions" };
    }
}

/**
 * Revoke a specific session
 */
export async function revokeSession(sessionId: string): Promise<{ success?: boolean; error?: string }> {
    try {
        // Get current session to prevent self-revocation and get user ID
        const currentSession = await authService.getSession();
        if (!currentSession.success || !currentSession.data) {
            return { error: "No active session found" };
        }

        if (sessionId === currentSession.data.access_token) {
            return { error: "Cannot revoke current session" };
        }

        const userId = currentSession.data.user?.id;
        if (!userId) {
            return { error: "User ID not found" };
        }

        const result = await sessionManager.revokeSession(sessionId, userId);
        
        if (result.success) {
            revalidatePath('/settings');
        }
        
        return result;
    } catch (error) {
        console.error('Failed to revoke session:', error);
        return { error: "Failed to revoke session" };
    }
}

/**
 * Revoke all other sessions for the current user
 */
export async function revokeAllOtherSessions(): Promise<{ success?: boolean; error?: string }> {
    try {
        // Get current session
        const currentSession = await authService.getSession();
        if (!currentSession.success || !currentSession.data) {
            return { error: "No active session found" };
        }

        const userId = currentSession.data.user?.id;
        if (!userId) {
            return { error: "User ID not found" };
        }

        const result = await sessionManager.revokeAllOtherSessions(
            currentSession.data.access_token, 
            userId
        );
        
        if (result.success) {
            revalidatePath('/settings');
        }
        
        return result;
    } catch (error) {
        console.error('Failed to revoke other sessions:', error);
        return { error: "Failed to revoke other sessions" };
    }
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<{ success?: boolean; error?: string }> {
    try {
        const result = await sessionManager.cleanupExpiredSessions();
        return result;
    } catch (error) {
        console.error('Failed to cleanup expired sessions:', error);
        return { error: "Failed to cleanup expired sessions" };
    }
}

/**
 * Server-side session creation (for use in API routes)
 */
export async function createServerSessionRecord(
    sessionId: string,
    userId: string,
    userAgent?: string,
    ipAddress?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const result = await SessionManager.createServerSessionRecord(
            sessionId,
            userId,
            userAgent,
            ipAddress
        );
        
        return result;
    } catch (error) {
        console.error('Failed to create server session record:', error);
        return { 
            success: false, 
            error: "Failed to create server session record" 
        };
    }
}