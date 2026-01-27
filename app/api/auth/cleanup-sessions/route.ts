import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/auth";
import { deduplicateSessions, cleanupUserSessions } from "@/lib/utils/session-deduplication";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userOnly = searchParams.get('userOnly') === 'true';

    let result;
    
    if (userOnly) {
      // Clean up sessions for current user only
      result = await cleanupUserSessions(session.user.id);
    } else {
      // Clean up all duplicate sessions (admin function)
      result = await deduplicateSessions();
    }

    if (result?.success) {
      return NextResponse.json({
        success: true,
        message: `Cleaned up ${result.cleaned} duplicate sessions`,
        cleaned: result.cleaned
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result?.error || "Unknown error occurred"
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Session cleanup API error:', error);
    return NextResponse.json({
      success: false,
      error: "Failed to cleanup sessions"
    }, { status: 500 });
  }
}