import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth/supabase-auth-service";
import { sessionManager } from "@/lib/auth/session-manager";

export async function GET(request: NextRequest) {
    try {
        const sessionResult = await AuthService.validateServerSession();
        
        if (!sessionResult.user || !sessionResult.session) {
            return NextResponse.json({ 
                error: "Not authenticated"
            }, { status: 401 });
        }

        console.log('Getting sessions for user:', sessionResult.user.id);
        
        // Get user sessions
        const result = await sessionManager.getUserSessions(
            sessionResult.user.id, 
            sessionResult.session.access_token
        );
        
        if (result.error) {
            return NextResponse.json({
                error: "Failed to get sessions",
                details: result.error
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            sessions: result.sessions || []
        });
    } catch (error) {
        console.error("Get sessions error:", error);
        return NextResponse.json({ 
            error: "Internal server error",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const sessionResult = await AuthService.validateServerSession();
        
        if (!sessionResult.user || !sessionResult.session) {
            return NextResponse.json({ 
                error: "Not authenticated"
            }, { status: 401 });
        }

        const body = await request.json();
        const { action, sessionId } = body;

        console.log('Session action:', action, 'for user:', sessionResult.user.id);

        if (action === 'revoke' && sessionId) {
            // Revoke specific session
            const result = await sessionManager.revokeSession(sessionId, sessionResult.user.id);
            
            if (!result.success) {
                return NextResponse.json({
                    error: "Failed to revoke session",
                    details: result.error
                }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                message: "Session revoked successfully"
            });
        } else if (action === 'revokeAllOthers') {
            // Revoke all other sessions
            const result = await sessionManager.revokeAllOtherSessions(
                sessionResult.session.access_token, 
                sessionResult.user.id
            );
            
            if (!result.success) {
                return NextResponse.json({
                    error: "Failed to revoke sessions",
                    details: result.error
                }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                message: `${result.revokedCount || 0} sessions revoked successfully`,
                revokedCount: result.revokedCount || 0
            });
        } else if (action === 'create') {
            // Create session record - check if it already exists first
            const userAgent = request.headers.get('user-agent') || undefined;
            const forwardedFor = request.headers.get('x-forwarded-for');
            const realIp = request.headers.get('x-real-ip');
            const ipAddress = forwardedFor?.split(',')[0] || realIp || undefined;

            // Check if session already exists
            const existingResult = await sessionManager.getUserSessions(
                sessionResult.user.id, 
                sessionResult.session.access_token
            );
            
            if (existingResult.sessions && existingResult.sessions.length > 0) {
                // Session already exists, return success
                return NextResponse.json({
                    success: true,
                    message: "Session already exists"
                });
            }

            const result = await sessionManager.createSessionRecord(
                sessionResult.session.access_token,
                sessionResult.user.id,
                userAgent,
                ipAddress
            );
            
            if (!result.success) {
                // If it's a duplicate key error, that's actually fine - session already exists
                if (result.error && result.error.includes('duplicate key')) {
                    return NextResponse.json({
                        success: true,
                        message: "Session already exists"
                    });
                }
                
                return NextResponse.json({
                    error: "Failed to create session",
                    details: result.error
                }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                message: "Session created successfully"
            });
        } else {
            return NextResponse.json({
                error: "Invalid action"
            }, { status: 400 });
        }
    } catch (error) {
        console.error("Session action error:", error);
        return NextResponse.json({ 
            error: "Internal server error",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}