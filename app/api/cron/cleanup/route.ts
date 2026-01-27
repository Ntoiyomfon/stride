import { NextRequest, NextResponse } from "next/server";
import { cleanupOrphanedSessions, cleanupExpiredSessions } from "@/lib/utils/session-cleanup";

export async function POST(request: NextRequest) {
    try {
        // Verify this is a legitimate cron request (you might want to add auth here)
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log("Starting scheduled cleanup tasks...");

        // Run cleanup tasks
        const [orphanedCount, expiredCount] = await Promise.all([
            cleanupOrphanedSessions(),
            cleanupExpiredSessions()
        ]);

        const result = {
            success: true,
            timestamp: new Date().toISOString(),
            cleaned: {
                orphanedSessions: orphanedCount,
                expiredSessions: expiredCount
            }
        };

        console.log("Cleanup completed:", result);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Cleanup cron job error:", error);
        return NextResponse.json({ 
            error: "Cleanup failed",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// Allow manual cleanup for testing (remove in production)
export async function GET(request: NextRequest) {
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: "Not available in production" }, { status: 404 });
    }

    return POST(request);
}