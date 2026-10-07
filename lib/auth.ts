import { betterAuth } from "better-auth"
import { Pool } from "pg"

// Autenticação do FATEC: Better Auth sobre o Neon (somente servidor).
export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "student", input: false },
    },
  },
})
