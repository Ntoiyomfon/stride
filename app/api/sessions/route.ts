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
        const { action, sessionId, deviceId } = body;

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
            // Create or update session record based on device ID
            const userAgent = request.headers.get('user-agent') || undefined;
            const forwardedFor = request.headers.get('x-forwarded-for');
            const realIp = request.headers.get('x-real-ip');
            const ipAddress = forwardedFor?.split(',')[0] || realIp || undefined;
            const clientDeviceId = deviceId || 'unknown';

            const { createSupabaseServiceClient } = await import("@/lib/supabase/utils");
            const serviceClient = await createSupabaseServiceClient();
            
            // Check if a session exists for this device ID
            const { data: existingSession } = await (serviceClient as any)
                .from('sessions')
                .select('id, session_id, last_active_at')
                .eq('user_id', sessionResult.user.id)
                .eq('device_id', clientDeviceId)
                .eq('is_revoked', false)
                .single();

            if (existingSession) {
                // Update existing session
                const { error: updateError } = await (serviceClient as any)
                    .from('sessions')
                    .update({ 
                        session_id: sessionResult.session.access_token,
                        last_active_at: new Date().toISOString(),
                        ip_address: ipAddress || '127.0.0.1',
                        user_agent: userAgent || 'Unknown'
                    })
                    .eq('id', existingSession.id);

                if (updateError) {
                    console.error('Failed to update session:', updateError);
                    return NextResponse.json({
                        error: "Failed to update session",
                        details: updateError.message
                    }, { status: 500 });
                }

                console.log('✅ Session updated for device:', clientDeviceId);
                return NextResponse.json({
                    success: true,
                    message: "Session updated successfully"
                });
            }

            // Create new session for this device
            const result = await sessionManager.createSessionRecord(
                sessionResult.session.access_token,
                sessionResult.user.id,
                userAgent,
                ipAddress,
                clientDeviceId
            );
            
            if (!result.success) {
                // If it's a duplicate key error, that's fine - session already exists
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

            console.log('✅ New session created for device:', clientDeviceId);
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