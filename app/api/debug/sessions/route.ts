import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/auth";
import connectDB from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        
        const mongoose = await import("mongoose");
        const db = mongoose.connection.db;
        
        if (!db) {
            return NextResponse.json({ error: "Database not available" }, { status: 500 });
        }
        
        // Check sessions collection
        const sessionsCollection = db.collection('session');
        const userSessions = await sessionsCollection.find({
            userId: session.user.id
        }).toArray();
        
        // Also check all collections to see what Better Auth is using
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        
        return NextResponse.json({
            currentUser: session.user.id,
            userSessions: userSessions,
            allCollections: collectionNames,
            sessionCount: userSessions.length
        });
    } catch (error) {
        console.error("Debug sessions error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}