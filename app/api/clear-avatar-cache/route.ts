import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/auth";

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Return cache-busting headers
        return NextResponse.json(
            { 
                success: true, 
                message: "Cache cleared",
                timestamp: Date.now(),
                userId: session.user.id
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