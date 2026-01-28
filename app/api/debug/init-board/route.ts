import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth/supabase-auth-service";
import { initializeUserBoard } from "@/lib/init-user-board";

export async function POST(request: NextRequest) {
    try {
        const sessionResult = await AuthService.validateServerSession();
        
        if (!sessionResult.user) {
            return NextResponse.json({ 
                error: "Not authenticated"
            }, { status: 401 });
        }

        console.log('Initializing board for user:', sessionResult.user.id);
        
        const board = await initializeUserBoard(sessionResult.user.id);
        
        return NextResponse.json({
            success: true,
            board: board,
            userId: sessionResult.user.id
        });
    } catch (error) {
        console.error("Board initialization error:", error);
        return NextResponse.json({ 
            error: "Failed to initialize board",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}