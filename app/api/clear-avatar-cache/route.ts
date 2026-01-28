import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth/supabase-auth-service";

export async function POST(request: NextRequest) {
    try {
        const sessionResult = await AuthService.validateServerSession();
        
        if (!sessionResult.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Return cache-busting headers
        return NextResponse.json(
            { 
                success: true, 
                message: "Cache cleared",
                timestamp: Date.now(),
                userId: sessionResult.user.id
            },
            {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            }
        );
    } catch (error) {
        console.error("Clear cache error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}