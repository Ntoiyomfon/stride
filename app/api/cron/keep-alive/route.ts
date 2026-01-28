import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/utils";

export async function GET(request: NextRequest) {
    try {
        // Verify the request is from Vercel Cron
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('🔄 Running database keep-alive cron job (every 96 hours)...');
        
        const supabase = await createSupabaseServiceClient();
        const startTime = Date.now();
        
        // Perform multiple lightweight queries to keep database active
        const operations = [];
        
        // 1. Count user profiles
        operations.push(
            supabase
                .from('user_profiles')
                .select('id', { count: 'exact', head: true })
        );
        
        // 2. Count boards
        operations.push(
            supabase
                .from('boards')
                .select('id', { count: 'exact', head: true })
        );
        
        // 3. Count sessions (cleanup old ones while we're at it)
        operations.push(
            supabase
                .from('sessions')
                .delete()
                .lt('expires_at', new Date().toISOString())
        );

        // Execute all operations
        const results = await Promise.allSettled(operations);
        const endTime = Date.now();
        
        // Check if any operations failed
        const failures = results.filter(result => result.status === 'rejected');
        
        if (failures.length > 0) {
            console.error('❌ Some keep-alive operations failed:', failures);
            return NextResponse.json({ 
                success: false, 
                error: 'Some database operations failed',
                failures: failures.length,
                timestamp: new Date().toISOString(),
                duration: `${endTime - startTime}ms`
            }, { status: 500 });
        }

        // Extract results
        const [profilesResult, boardsResult, sessionsResult] = results;
        
        console.log('✅ Database keep-alive successful');
        
        return NextResponse.json({
            success: true,
            message: 'Database keep-alive ping successful',
            timestamp: new Date().toISOString(),
            duration: `${endTime - startTime}ms`,
            operations: {
                profiles: profilesResult.status === 'fulfilled' ? 'success' : 'failed',
                boards: boardsResult.status === 'fulfilled' ? 'success' : 'failed',
                sessionCleanup: sessionsResult.status === 'fulfilled' ? 'success' : 'failed'
            }
        });
        
    } catch (error) {
        console.error('❌ Keep-alive cron job error:', error);
        return NextResponse.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

// Also handle POST requests in case Vercel sends POST
export async function POST(request: NextRequest) {
    return GET(request);
}