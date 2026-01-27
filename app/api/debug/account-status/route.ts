import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/auth";
import { getUser } from "@/lib/actions/user";
import connectDB from "@/lib/db";
import { Board, Column, JobApplication } from "@/lib/models";
import Session from "@/lib/models/session";

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        
        if (!session?.user) {
            return NextResponse.json({ 
                authenticated: false,
                message: "No active session"
            });
        }

        await connectDB();
        
        // Check if user exists in database
        const user = await getUser();
        
        // Count user's data
        const [boards, jobApplications, sessions] = await Promise.all([
            Board.countDocuments({ userId: session.user.id }),
            JobApplication.countDocuments({ userId: session.user.id }),
            Session.countDocuments({ userId: session.user.id })
        ]);

        return NextResponse.json({
            authenticated: true,
            userExists: !!user,
            sessionUserId: session.user.id,
            sessionId: session.session?.id,
            userData: user ? {
                id: user._id,
                name: user.name,
                email: user.email
            } : null,
            dataCount: {
                boards,
                jobApplications,
                sessions
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