import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/db";
import Session from "@/lib/models/session";

export async function POST(request: NextRequest) {
    try {
        const { userId } = await request.json();
        
        if (!userId) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        console.log(`Invalidating all sessions for user: ${userId}`);

        await connectDB();
        
        // Revoke all sessions in our tracking system
        await Session.updateMany(
            { userId },
            { $set: { isRevoked: true, lastActiveAt: new Date() } }
        );

        // Clear Better Auth sessions
        const mongoose = await import("mongoose");
        const db = mongoose.connection.db;
        
        if (db) {
            await db.collection('session').deleteMany({ userId });
        }

        // Create response with aggressive cookie clearing
        const response = NextResponse.json({ success: true });
        
        const cookiesToClear = [
            'better-auth.session_token',
            'better-auth.csrf_token', 
            'better-auth.session',
            'better-auth.csrf',
            'session',
            'auth-token',
            'auth_token',
            'sessionToken',
            'session_token',
            'csrf_token',
            'csrf-token'
        ];
        
        cookiesToClear.forEach(cookieName => {
            response.cookies.set(cookieName, '', {
                expires: new Date(0),
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            });
        });
        
        return response;
    } catch (error) {
        console.error("Session invalidation error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}