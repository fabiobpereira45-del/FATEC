// Cria (ou atualiza) o usuário master do FATEC no Neon.
// Uso: MASTER_PASSWORD=... node scripts/seed-master.mjs
import { betterAuth } from "better-auth"
import { Pool } from "pg"
import { readFileSync } from "fs"

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split("\n")
    .filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)] })
)
const EMAIL = "professor@fatec.com"
const NAME = "Pb. Fábio Barreto"
const PASSWORD = process.env.MASTER_PASSWORD
if (!PASSWORD || PASSWORD.length < 8) throw new Error("Defina MASTER_PASSWORD (mínimo 8 caracteres)")

const pool = new Pool({ connectionString: env.DATABASE_URL })
const auth = betterAuth({
  database: pool,
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  user: { additionalFields: { role: { type: "string", required: false, defaultValue: "student", input: false } } },
})

const existing = await pool.query('select id from "user" where email = $1', [EMAIL])
let userId = existing.rows[0]?.id
if (!userId) {
  const res = await auth.api.signUpEmail({ body: { email: EMAIL, password: PASSWORD, name: NAME } })
  userId = res.user.id
  console.log("usuário criado")
} else {
  console.log("usuário já existia; papel será atualizado")
}
await pool.query('update "user" set role = $1, "emailVerified" = true where id = $2', ["master", userId])
await pool.query(
  `insert into professor_accounts (id, role, active) values ($1, 'master', true)
   on conflict (id) do update set role = 'master', active = true`,
  [userId]
)
console.log("master pronto:", EMAIL)
await pool.end()
