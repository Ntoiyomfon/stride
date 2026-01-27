import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/auth";
import { getUserSessions, cleanupExpiredSessions } from "@/lib/actions/session-management";

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const result = await getUserSessions();
        
        return NextResponse.json({
            currentSession: session.session?.id,
            userId: session.user.id,
            sessions: result.sessions || [],
            error: result.error
        });
    } catch (error) {
        console.error("Debug sessions error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getSession();
        
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const result = await cleanupExpiredSessions();
        
        return NextResponse.json({
            success: result.success,
            error: result.error
        });
    } catch (error) {
        console.error("Cleanup sessions error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}