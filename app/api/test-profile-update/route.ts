import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/auth";
import { authClient } from "@/lib/auth/auth-client";

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, image } = await request.json();

        // Test profile update
        const updateData: { name?: string; image?: string } = {};
        if (name) updateData.name = name;
        if (image) updateData.image = image;

        return NextResponse.json({
            success: true,
            currentUser: session.user,
            updateData,
            message: "Profile update test endpoint"
        });
    } catch (error) {
        console.error("Test profile update error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}