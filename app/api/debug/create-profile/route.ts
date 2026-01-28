import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth/supabase-auth-service";
import { createSupabaseServerClient } from "@/lib/supabase/utils";

export async function POST(request: NextRequest) {
    try {
        const sessionResult = await AuthService.validateServerSession();
        
        if (!sessionResult.user) {
            return NextResponse.json({ 
                error: "Not authenticated"
            }, { status: 401 });
        }

        console.log('Creating profile for user:', sessionResult.user.id);
        console.log('User metadata:', sessionResult.user.user_metadata);
        console.log('User email:', sessionResult.user.email);
        
        // Create user profile using auth service
        const authService = new AuthService();
        const result = await authService.createUserProfile(sessionResult.user);
        
        if (!result.success) {
            return NextResponse.json({
                error: "Failed to create profile",
                details: result.error?.message || 'Unknown error'
            }, { status: 500 });
        }

        // Also initialize board
        try {
            const { initializeUserBoard } = await import('@/lib/init-user-board');
            const board = await initializeUserBoard(sessionResult.user.id);
            
            return NextResponse.json({
                success: true,
                profile: result.data,
                board: board,
                userId: sessionResult.user.id
            });
        } catch (boardError) {
            return NextResponse.json({
                success: true,
                profile: result.data,
                boardError: boardError instanceof Error ? boardError.message : 'Board creation failed',
                userId: sessionResult.user.id
            });
        }
    } catch (error) {
        console.error("Profile creation error:", error);
        return NextResponse.json({ 
            error: "Internal server error",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}