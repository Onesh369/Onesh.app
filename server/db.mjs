import pg from 'pg'

const { Pool } = pg

let pool = null

export function getPool() {
  if (pool) return pool
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required')
  }
  pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  })
  pool.on('error', (err) => {
    console.error('Database pool error:', err.message)
  })
  return pool
}

export async function migrate() {
  const db = getPool()
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(24) UNIQUE NOT NULL,
      email VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await db.query(`
    CREATE TABLE IF NOT EXISTS user_data (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  /* Add email column if upgrading from an older schema without it */
  await db.query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'email'
      ) THEN
        ALTER TABLE users ADD COLUMN email VARCHAR(255) NOT NULL DEFAULT '';
      END IF;
    END $$
  `)
  /* Create a unique index on lowercase email (only for non-empty) */
  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx
    ON users (LOWER(email)) WHERE email <> ''
  `)
  /* Create a unique index on lowercase username */
  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_idx
    ON users (LOWER(username))
  `)
  console.log('Database migration complete')
}

/* ── User queries ── */

export async function findUserByUsername(username) {
  const db = getPool()
  const { rows } = await db.query(
    'SELECT id, username, email, password_hash FROM users WHERE LOWER(username) = LOWER($1)',
    [username],
  )
  return rows[0] ?? null
}

export async function findUserById(id) {
  const db = getPool()
  const { rows } = await db.query(
    'SELECT id, username, email FROM users WHERE id = $1',
    [id],
  )
  return rows[0] ?? null
}

export async function findUserByEmail(email) {
  const db = getPool()
  const { rows } = await db.query(
    'SELECT id, username, email, password_hash FROM users WHERE LOWER(email) = LOWER($1)',
    [email],
  )
  return rows[0] ?? null
}

export async function createUser(username, email, passwordHash) {
  const db = getPool()
  const { rows } = await db.query(
    `INSERT INTO users (username, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, username, email`,
    [username, email, passwordHash],
  )
  return rows[0]
}

export async function listUsers() {
  const db = getPool()
  const { rows } = await db.query(
    'SELECT id, username, email, created_at FROM users ORDER BY created_at DESC',
  )
  return rows
}

/* ── User data (app payload) ── */

export async function getUserData(userId) {
  const db = getPool()
  const { rows } = await db.query(
    'SELECT data FROM user_data WHERE user_id = $1',
    [userId],
  )
  return rows[0]?.data ?? null
}

export async function saveUserData(userId, data) {
  const db = getPool()
  await db.query(
    `INSERT INTO user_data (user_id, data, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (user_id) DO UPDATE SET data = $2, updated_at = NOW()`,
    [userId, JSON.stringify(data)],
  )
}
