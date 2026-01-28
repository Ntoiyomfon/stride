import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth/supabase-auth-service";
import { getUserSessions, cleanupExpiredSessions } from "@/lib/actions/supabase-session-management";

export async function GET(request: NextRequest) {
    try {
        const sessionResult = await AuthService.validateServerSession();
        
        if (!sessionResult.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const result = await getUserSessions();
        
        return NextResponse.json({
            currentSession: sessionResult.session?.access_token,
            userId: sessionResult.user.id,
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
        const sessionResult = await AuthService.validateServerSession();
        
        if (!sessionResult.user) {
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