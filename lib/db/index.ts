import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Supabase connection with pooling
const connectionString = process.env.DATABASE_URL!

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// Connection pool for queries
const queryClient = postgres(connectionString, {
  prepare: false, // Required for connection pooling (pgbouncer)
  max: 1, // Supabase recommends max 1 for serverless
})

export const db = drizzle(queryClient, { schema })

// For migrations (direct connection)
export const getMigrationDb = () => {
  const directUrl = process.env.DIRECT_URL || connectionString
  const migrationClient = postgres(directUrl, { max: 1 })
  return drizzle(migrationClient, { schema })
}