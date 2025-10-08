import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// 빌드 시에는 환경 변수가 없을 수 있으므로 더미 URL 사용
const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/dummy'

// Connection pool for queries with aggressive timeouts for Vercel
const queryClient = postgres(connectionString, {
  prepare: false, // Required for connection pooling (pgbouncer)
  max: 1, // Supabase recommends max 1 for serverless
  onnotice: () => {}, // Suppress notices
  idle_timeout: 20, // Close idle connections after 20s
  connect_timeout: 10, // Connection timeout: 10s
  max_lifetime: 60 * 30, // Max connection lifetime: 30 minutes
})

export const db = drizzle(queryClient, { schema })

// For migrations (direct connection)
export const getMigrationDb = () => {
  const directUrl = process.env.DIRECT_URL || connectionString
  const migrationClient = postgres(directUrl, { max: 1 })
  return drizzle(migrationClient, { schema })
}