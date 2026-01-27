import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/auth";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log("Attempting to logout user:", session.user.id);

        await connectDB();
        
        // Direct database cleanup - remove all sessions for this user
        const mongoose = await import("mongoose");
        const db = mongoose.connection.db;
        
        if (db) {
            try {
                const sessionsCollection = db.collection('session');
                const deleteResult = await sessionsCollection.deleteMany({
                    userId: session.user.id
                });
                console.log(`Deleted ${deleteResult.deletedCount} sessions from database`);
            } catch (dbError) {
                console.error("Database session cleanup failed:", dbError);
            }
        }

        // Try Better Auth API methods
        try {
            await auth.api.revokeOtherSessions({
                headers: request.headers
            });
            console.log("Successfully revoked other sessions via API");
        } catch (error) {
            console.error("Failed to revoke other sessions via API:", error);
        }

        try {
            const signOutResult = await auth.api.signOut({
                headers: request.headers
            });
            console.log("SignOut API result:", signOutResult);
        } catch (signOutError) {
            console.error("SignOut API failed:", signOutError);
        }

        // Create response with aggressively cleared cookies
        const response = NextResponse.json({ success: true });
        
        // Clear all possible auth-related cookies
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
            // Clear for multiple path and domain combinations
            response.cookies.set(cookieName, '', {
                expires: new Date(0),
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            });
            
            response.cookies.set(cookieName, '', {
                expires: new Date(0),
                path: '/',
                domain: request.nextUrl.hostname,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            });
        });
        
        return response;
    } catch (error) {
        console.error("Logout all sessions error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}