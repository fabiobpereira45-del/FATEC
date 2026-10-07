import { Pool } from "pg"

// Conexão única com o Neon (somente servidor). Reutilizada entre requisições.
const globalForDb = globalThis as unknown as { pool?: Pool }

export const pool =
  globalForDb.pool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: 5 })

if (process.env.NODE_ENV !== "production") globalForDb.pool = pool
