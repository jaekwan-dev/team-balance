import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { count } from 'drizzle-orm'

export const runtime = 'nodejs'
export const maxDuration = 10

export async function GET() {
  const startTime = Date.now()
  
  try {
    console.log('[DB Test] Starting database connection test...')
    
    // Simple query to test DB connection
    const result = await db.select({ count: count() }).from(users)
    
    const executionTime = Date.now() - startTime
    console.log(`[DB Test] Success in ${executionTime}ms`)
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful',
      userCount: Number(result[0]?.count || 0),
      executionTime: `${executionTime}ms`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error(`[DB Test] Error after ${executionTime}ms:`, error)
    
    return NextResponse.json(
      {
        status: 'error',
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        executionTime: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

