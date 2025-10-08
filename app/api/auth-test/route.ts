import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'
export const maxDuration = 10

export async function GET() {
  const startTime = Date.now()
  
  try {
    console.log('[Auth Test] Starting auth test...')
    
    const session = await auth()
    
    const executionTime = Date.now() - startTime
    console.log(`[Auth Test] Completed in ${executionTime}ms`)
    
    if (!session?.user) {
      return NextResponse.json({
        status: 'no-session',
        message: 'No active session',
        executionTime: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
      })
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Session found',
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        level: session.user.level,
      },
      executionTime: `${executionTime}ms`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error(`[Auth Test] Error after ${executionTime}ms:`, error)
    
    return NextResponse.json(
      {
        status: 'error',
        message: 'Auth check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        executionTime: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

