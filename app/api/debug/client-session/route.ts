import { NextRequest, NextResponse } from "next/server";
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase/database.types'

export async function GET(request: NextRequest) {
    try {
        // Try to get session from cookies directly
        const cookies = request.cookies.getAll();
        const supabaseCookies = cookies.filter(cookie => 
            cookie.name.startsWith('sb-') || cookie.name.includes('supabase')
        );

        console.log('Available cookies:', supabaseCookies.map(c => c.name));

        return NextResponse.json({
            cookieCount: cookies.length,
            supabaseCookies: supabaseCookies.map(c => ({ name: c.name, hasValue: !!c.value })),
            allCookieNames: cookies.map(c => c.name)
        });
    } catch (error) {
        console.error("Client session check error:", error);
        return NextResponse.json({ 
            error: "Internal server error",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}