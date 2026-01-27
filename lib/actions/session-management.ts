"use server";

import { getSession } from "@/lib/auth/auth";
import connectDB from "@/lib/db";
import Session from "@/lib/models/session";
import { parseUserAgent, getLocationFromIP } from "@/lib/utils/device-parser";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { SessionInfo } from "@/lib/types/session";



export async function createSessionRecord(sessionId: string, userId: string) {
    try {
        await connectDB();
        
        const requestHeaders = await headers();
        const userAgent = requestHeaders.get('user-agent') || 'Unknown';
        const ipAddress = requestHeaders.get('x-forwarded-for') || 
                         requestHeaders.get('x-real-ip') || 
                         '127.0.0.1';
        
        // Parse device information
        const deviceInfo = parseUserAgent(userAgent);
        
        // Get location (async, but don't wait for it to complete session creation)
        const locationPromise = getLocationFromIP(ipAddress);
        
        // Before creating a new session record, clean up any duplicates
        // This ensures our custom session tracking stays in sync with BetterAuth
        await Session.deleteMany({
            userId,
            sessionId: { $ne: sessionId }, // Keep the current session
            $or: [
                { userAgent },
                { ipAddress }
            ]
        });
        
        // Create session record
        const session = new Session({
            sessionId,
            userId,
            ipAddress,
            userAgent,
            ...deviceInfo,
            createdAt: new Date(),
            lastActiveAt: new Date(),
            isRevoked: false
        });
        
        await session.save();
        
        // Update location asynchronously
        locationPromise.then(async (location) => {
            try {
                await Session.findOneAndUpdate(
                    { sessionId },
                    { $set: { location } }
                );
            } catch (error) {
                console.error('Failed to update session location:', error);
            }
        });
        
        return { success: true };
    } catch (error) {
        console.error('Failed to create session record:', error);
        return { error: "Failed to create session record" };
    }
}

export async function updateSessionActivity(sessionId: string) {
    try {
        await connectDB();
        
        await Session.findOneAndUpdate(
            { sessionId, isRevoked: false },
            { $set: { lastActiveAt: new Date() } }
        );
        
        return { success: true };
    } catch (error) {
        console.error('Failed to update session activity:', error);
        return { error: "Failed to update session activity" };
    }
}

export async function getUserSessions(userId?: string): Promise<{ sessions?: SessionInfo[]; error?: string }> {
    try {
        await connectDB();
        
        // Get current session to identify which one is current
        const currentSession = await getSession();
        if (!currentSession?.session?.id) {
            return { error: "No active session found" };
        }
        
        const targetUserId = userId || currentSession.user?.id;
        if (!targetUserId) {
            return { error: "User ID not found" };
        }
        
        // Auto-cleanup duplicate sessions before returning the list
        try {
            const { cleanupUserSessions } = await import("../utils/session-deduplication");
            const cleanupResult = await cleanupUserSessions(targetUserId);
            if (cleanupResult.success && cleanupResult.cleaned && cleanupResult.cleaned > 0) {
                console.log(`Auto-cleanup: removed ${cleanupResult.cleaned} duplicate sessions for user ${targetUserId}`);
            }
        } catch (error) {
            console.error('Auto session cleanup error:', error);
        }
        
        // Get all active sessions for the user
        const sessions = await Session.find({
            userId: targetUserId,
            isRevoked: false
        }).sort({ lastActiveAt: -1 }).lean();
        
        const sessionInfos: SessionInfo[] = sessions.map(session => ({
            sessionId: session.sessionId,
            browser: session.browser || 'Unknown',
            os: session.os || 'Unknown',
            deviceType: session.deviceType || 'desktop',
            location: session.location || { city: 'Unknown', country: 'Unknown' },
            ipAddress: session.ipAddress,
            createdAt: new Date(session.createdAt),
            lastActiveAt: new Date(session.lastActiveAt),
            isCurrent: session.sessionId === currentSession.session.id
        }));
        
        // Serialize to ensure no Mongoose objects are passed to client
        return { sessions: JSON.parse(JSON.stringify(sessionInfos)) };
    } catch (error) {
        console.error('Failed to get user sessions:', error);
        return { error: "Failed to retrieve sessions" };
    }
}

export async function revokeSession(sessionId: string): Promise<{ success?: boolean; error?: string }> {
    try {
        await connectDB();
        
        // Get current session to prevent self-revocation
        const currentSession = await getSession();
        if (!currentSession?.session?.id) {
            return { error: "No active session found" };
        }
        
        if (sessionId === currentSession.session.id) {
            return { error: "Cannot revoke current session" };
        }
        
        // Mark session as revoked
        const result = await Session.findOneAndUpdate(
            { 
                sessionId, 
                userId: currentSession.user?.id,
                isRevoked: false 
            },
            { 
                $set: { 
                    isRevoked: true,
                    lastActiveAt: new Date()
                } 
            }
        );
        
        if (!result) {
            return { error: "Session not found or already revoked" };
        }
        
        revalidatePath('/settings');
        return { success: true };
    } catch (error) {
        console.error('Failed to revoke session:', error);
        return { error: "Failed to revoke session" };
    }
}

export async function revokeAllOtherSessions(): Promise<{ success?: boolean; error?: string }> {
    try {
        await connectDB();
        
        // Get current session
        const currentSession = await getSession();
        if (!currentSession?.session?.id || !currentSession.user?.id) {
            return { error: "No active session found" };
        }
        
        // Revoke all other sessions for this user
        await Session.updateMany(
            { 
                userId: currentSession.user.id,
                sessionId: { $ne: currentSession.session.id },
                isRevoked: false 
            },
            { 
                $set: { 
                    isRevoked: true,
                    lastActiveAt: new Date()
                } 
            }
        );
        
        revalidatePath('/settings');
        return { success: true };
    } catch (error) {
        console.error('Failed to revoke other sessions:', error);
        return { error: "Failed to revoke other sessions" };
    }
}

export async function cleanupExpiredSessions(): Promise<{ success?: boolean; error?: string }> {
    try {
        await connectDB();
        
        // Remove sessions older than 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        await Session.deleteMany({
            $or: [
                { isRevoked: true, lastActiveAt: { $lt: thirtyDaysAgo } },
                { lastActiveAt: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } } // 90 days inactive
            ]
        });
        
        return { success: true };
    } catch (error) {
        console.error('Failed to cleanup expired sessions:', error);
        return { error: "Failed to cleanup expired sessions" };
    }
}