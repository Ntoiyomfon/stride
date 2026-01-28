import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth/supabase-auth-service";
import { getUser } from "@/lib/actions/user";
import { createSupabaseServerClient } from "@/lib/supabase/utils";

export async function GET(request: NextRequest) {
    try {
        const sessionResult = await AuthService.validateServerSession();
        
        if (!sessionResult.user) {
            return NextResponse.json({ 
                authenticated: false,
                message: "No active session"
            });
        }

        const supabase = await createSupabaseServerClient();
        
        // Check if user exists in database
        const user = await getUser();
        
        // Count user's data
        const [boardsResult, jobApplicationsResult, sessionsResult] = await Promise.all([
            supabase.from('boards').select('id', { count: 'exact' }).eq('user_id', sessionResult.user.id),
            supabase.from('job_applications').select('id', { count: 'exact' }).eq('user_id', sessionResult.user.id),
            supabase.from('sessions').select('id', { count: 'exact' }).eq('user_id', sessionResult.user.id)
        ]);

        return NextResponse.json({
            authenticated: true,
            userExists: !!user,
            sessionUserId: sessionResult.user.id,
            sessionId: sessionResult.session?.access_token,
            userData: user ? {
                id: (user as any).id,
                name: (user as any).name,
                email: (user as any).email
            } : null,
            dataCount: {
                boards: boardsResult.count || 0,
                jobApplications: jobApplicationsResult.count || 0,
                sessions: sessionsResult.count || 0
            }
        });
    } catch (error) {
        console.error("Account status check error:", error);
        return NextResponse.json({ 
            error: "Internal server error",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}