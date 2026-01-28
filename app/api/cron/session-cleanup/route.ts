import { NextRequest, NextResponse } from 'next/server'
import { sessionManager } from '@/lib/auth/session-manager'

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request (in production, you'd check auth headers)
    const authHeader = request.headers.get('authorization')
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Clean up expired sessions
    const result = await sessionManager.cleanupExpiredSessions()
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: `Cleaned up ${result.deletedCount || 0} expired sessions` 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error || 'Unknown error' 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Session cleanup cron error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

// Also allow POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request)
}