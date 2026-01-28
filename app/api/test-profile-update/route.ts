import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth/supabase-auth-service";

export async function POST(request: NextRequest) {
    try {
        const sessionResult = await AuthService.validateServerSession();
        
        if (!sessionResult.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, image } = await request.json();

        // Test profile update
        const updateData: { name?: string; image?: string } = {};
        if (name) updateData.name = name;
        if (image) updateData.image = image;

        return NextResponse.json({
            success: true,
            currentUser: sessionResult.user,
            updateData,
            message: "Profile update test endpoint"
        });
    } catch (error) {
        console.error("Test profile update error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}