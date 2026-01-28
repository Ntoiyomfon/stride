import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth/supabase-auth-service";

export async function POST(request: NextRequest) {
    try {
        const sessionResult = await AuthService.validateServerSession();
        
        if (!sessionResult.user || !sessionResult.session) {
            return NextResponse.json({ 
                error: "Not authenticated"
            }, { status: 401 });
        }

        // Create/update user profile
        const authService = new AuthService();
        const result = await authService.createUserProfile(sessionResult.user);
        
        if (!result.success) {
            return NextResponse.json({
                error: "Failed to create profile",
                details: result.error
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            profile: result.data
        });
    } catch (error) {
        console.error("Profile creation error:", error);
        return NextResponse.json({ 
            error: "Internal server error",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}