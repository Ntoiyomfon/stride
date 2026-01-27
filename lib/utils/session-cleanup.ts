/**
 * Utility functions for cleaning up orphaned sessions
 */

import connectDB from "@/lib/db";
import Session from "@/lib/models/session";
import User from "@/lib/models/user";

/**
 * Clean up sessions for users that no longer exist
 */
export async function cleanupOrphanedSessions(): Promise<number> {
    try {
        await connectDB();
        
        // Get all unique user IDs from sessions
        const sessionUserIds = await Session.distinct('userId', { isRevoked: false });
        
        // Check which users still exist
        const existingUsers = await User.find({ 
            _id: { $in: sessionUserIds } 
        }).select('_id');
        
        const existingUserIds = existingUsers.map(u => u._id.toString());
        
        // Find orphaned sessions (sessions for users that don't exist)
        const orphanedUserIds = sessionUserIds.filter(
            userId => !existingUserIds.includes(userId)
        );
        
        if (orphanedUserIds.length === 0) {
            return 0;
        }
        
        // Revoke orphaned sessions
        const result = await Session.updateMany(
            { 
                userId: { $in: orphanedUserIds },
                isRevoked: false 
            },
            { 
                $set: { 
                    isRevoked: true,
                    lastActiveAt: new Date()
                } 
            }
        );
        
        console.log(`Cleaned up ${result.modifiedCount} orphaned sessions for ${orphanedUserIds.length} deleted users`);
        
        return result.modifiedCount;
    } catch (error) {
        console.error('Failed to cleanup orphaned sessions:', error);
        return 0;
    }
}

/**
 * Clean up expired sessions (older than 90 days)
 */
export async function cleanupExpiredSessions(): Promise<number> {
    try {
        await connectDB();
        
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        
        const result = await Session.deleteMany({
            $or: [
                { isRevoked: true, lastActiveAt: { $lt: ninetyDaysAgo } },
                { lastActiveAt: { $lt: ninetyDaysAgo } }
            ]
        });
        
        console.log(`Deleted ${result.deletedCount} expired sessions`);
        
        return result.deletedCount;
    } catch (error) {
        console.error('Failed to cleanup expired sessions:', error);
        return 0;
    }
}