import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/user";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;
        await connectDB();

        const user = await User.findById(userId).select("profilePictureData");

        if (!user || !user.profilePictureData) {
            // Return a default placeholder or 404
            return new NextResponse("Not found", { status: 404 });
        }

        // Determine content type (simple check or default to png)
        // The base64 string usually starts with "data:image/png;base64,"
        const base64Data = user.profilePictureData;
        const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

        let buffer;
        let contentType = "image/png";

        if (matches && matches.length === 3) {
            contentType = matches[1];
            buffer = Buffer.from(matches[2], "base64");
        } else {
            // Assume raw base64 if no prefix
            buffer = Buffer.from(base64Data, "base64");
        }

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=3600", // Cache for 1 hour
            },
        });

    } catch (error) {
        console.error("Error serving avatar:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
