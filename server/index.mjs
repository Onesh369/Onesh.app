import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Hono } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import bcrypt from 'bcryptjs'
import {
  migrate,
  findUserByUsername,
  findUserByEmail,
  findUserById,
  createUser,
  listUsers,
  getUserData,
  saveUserData,
} from './db.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const distDir = join(rootDir, 'dist')
const dataDir = process.env.DATA_DIR || join(rootDir, 'data')
const secretFile = join(dataDir, 'secret')
const cookieName = 'onesh_session'
const port = Number(process.env.PORT || 8787)
const dummyHash = bcrypt.hashSync('onesh-dummy', 4)

process.chdir(rootDir)

const emptyData = {
  habits: [],
  completions: {},
  tasks: [],
  books: [],
  readingLog: [],
  themeMode: 'auto',
}

const hits = new Map()

function limited(key, max = 20, windowMs = 15 * 60 * 1000) {
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs)
  if (recent.length >= max) {
    hits.set(key, recent)
    return true
  }
  recent.push(now)
  hits.set(key, recent)
  return false
}

function b64url(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

async function ensureSecret() {
  await mkdir(dataDir, { recursive: true })
  if (!existsSync(secretFile)) {
    await writeFile(secretFile, randomBytes(48).toString('hex'), 'utf8')
  }
}

async function secret() {
  return readFile(secretFile, 'utf8')
}

function signToken(payload, key) {
  const header = b64url({ alg: 'HS256', typ: 'JWT' })
  const body = b64url({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
  })
  const data = `${header}.${body}`
  const sig = createHmac('sha256', key).update(data).digest('base64url')
  return `${data}.${sig}`
}

function verifyToken(token, key) {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const data = `${parts[0]}.${parts[1]}`
  const expected = createHmac('sha256', key).update(data).digest('base64url')
  const got = Buffer.from(parts[2])
  const want = Buffer.from(expected)
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null
    if (typeof payload.sub !== 'string' || typeof payload.username !== 'string') return null
    return payload
  } catch {
    return null
  }
}

function isRecord(value) {
  return typeof value === 'object' && value !== null
}

function sanitizeReadingEntry(value) {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.bookId !== 'string' || typeof value.date !== 'string') {
    return null
  }
  const toNum = (input) => Math.max(0, Math.round(Number(input) || 0))
  return {
    id: value.id,
    bookId: value.bookId,
    date: value.date,
    pages: toNum(value.pages),
    fromPage: toNum(value.fromPage),
    toPage: toNum(value.toPage),
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : new Date().toISOString(),
  }
}

function sanitizeData(value) {
  if (!isRecord(value)) return { ...emptyData }
  return {
    habits: Array.isArray(value.habits) ? value.habits : [],
    completions: isRecord(value.completions) ? value.completions : {},
    tasks: Array.isArray(value.tasks) ? value.tasks : [],
    books: Array.isArray(value.books) ? value.books : [],
    readingLog: Array.isArray(value.readingLog)
      ? value.readingLog.map(sanitizeReadingEntry).filter((entry) => entry !== null)
      : [],
    themeMode:
      value.themeMode === 'light' || value.themeMode === 'dark' || value.themeMode === 'auto'
        ? value.themeMode
        : 'auto',
  }
}

function usernameOk(username) {
  return typeof username === 'string' && /^[a-zA-Z0-9_]{3,24}$/.test(username)
}

function emailOk(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 255
}

function passwordOk(password) {
  return typeof password === 'string' && password.length >= 8 && password.length <= 72
}

async function currentUser(c) {
  const token = getCookie(c, cookieName)
  if (!token) return null
  const payload = verifyToken(token, await secret())
  if (!payload) return null
  return findUserById(payload.sub)
}

function setSession(c, token) {
  const proto = c.req.header('x-forwarded-proto')
  const secure = process.env.COOKIE_SECURE === 'true' || proto === 'https'
  setCookie(c, cookieName, token, {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    secure,
  })
}

function clearSession(c) {
  setCookie(c, cookieName, '', {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: 0,
    secure: process.env.COOKIE_SECURE === 'true' || c.req.header('x-forwarded-proto') === 'https',
  })
}

const app = new Hono()

/* ── Signup ── */
app.post('/api/signup', async (c) => {
  const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  if (limited(`signup:${ip}`)) return c.json({ error: 'Too many attempts. Try again later.' }, 429)
  const body = await c.req.json().catch(() => null)
  const username = typeof body?.username === 'string' ? body.username.trim() : ''
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!usernameOk(username)) {
    return c.json({ error: 'Username must be 3–24 letters, numbers, or _.' }, 400)
  }
  if (!emailOk(email)) {
    return c.json({ error: 'Please enter a valid email address.' }, 400)
  }
  if (!passwordOk(password)) return c.json({ error: 'Password must be at least 8 characters.' }, 400)

  const existingUsername = await findUserByUsername(username)
  if (existingUsername) {
    return c.json({ error: 'That username is already taken. Try another.' }, 409)
  }
  const existingEmail = await findUserByEmail(email)
  if (existingEmail) {
    return c.json({ error: 'That email is already in use. Try another or sign in.' }, 409)
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await createUser(username, email, passwordHash)
  await saveUserData(user.id, emptyData)
  setSession(c, signToken({ sub: user.id, username: user.username }, await secret()))
  return c.json({ id: user.id, username: user.username })
})

/* ── Login ── */
app.post('/api/login', async (c) => {
  const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  if (limited(`login:${ip}`)) return c.json({ error: 'Too many attempts. Try again later.' }, 429)
  const body = await c.req.json().catch(() => null)
  const username = typeof body?.username === 'string' ? body.username.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  /* Allow login with either username or email */
  let user = await findUserByUsername(username)
  if (!user && username.includes('@')) {
    user = await findUserByEmail(username.toLowerCase())
  }

  const ok = await bcrypt.compare(password, user?.password_hash ?? dummyHash)
  if (!user || !ok) return c.json({ error: 'That username, email, or password does not match.' }, 401)
  setSession(c, signToken({ sub: user.id, username: user.username }, await secret()))
  return c.json({ id: user.id, username: user.username })
})

/* ── Logout ── */
app.post('/api/logout', (c) => {
  clearSession(c)
  return c.json({ ok: true })
})

/* ── Current user ── */
app.get('/api/me', async (c) => {
  const user = await currentUser(c)
  if (!user) return c.json({ error: 'Sign in required.' }, 401)
  return c.json({ id: user.id, username: user.username })
})

/* ── Get app data ── */
app.get('/api/data', async (c) => {
  const user = await currentUser(c)
  if (!user) return c.json({ error: 'Sign in required.' }, 401)
  try {
    const raw = await getUserData(user.id)
    return c.json(raw ? sanitizeData(raw) : emptyData)
  } catch {
    return c.json(emptyData)
  }
})

/* ── Save app data ── */
app.put('/api/data', async (c) => {
  const user = await currentUser(c)
  if (!user) return c.json({ error: 'Sign in required.' }, 401)
  const length = Number(c.req.header('content-length') || 0)
  if (length > 2_000_000) return c.json({ error: 'Data is too large.' }, 413)
  const body = await c.req.json().catch(() => null)
  const data = sanitizeData(body)
  await saveUserData(user.id, data)
  return c.json({ ok: true })
})

/* ── Admin: list users (protected by secret header) ── */
app.get('/api/admin/users', async (c) => {
  const adminKey = process.env.ADMIN_KEY
  if (!adminKey || c.req.header('x-admin-key') !== adminKey) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  const users = await listUsers()
  return c.json({ users })
})

/* ── Static files ── */
if (existsSync(distDir)) {
  app.use(
    '/*',
    serveStatic({
      root: './dist',
    }),
  )
  app.notFound(async (c) => {
    if (c.req.path.startsWith('/api/')) return c.json({ error: 'Not found' }, 404)
    const html = await readFile(join(distDir, 'index.html'), 'utf8')
    return c.html(html)
  })
} else {
  app.notFound((c) => {
    if (c.req.path.startsWith('/api/')) return c.json({ error: 'Not found' }, 404)
    return c.text('API running')
  })
}

await ensureSecret()
await migrate()

serve({ fetch: app.fetch, port, hostname: '0.0.0.0' }, (info) => {
  console.log(`Onesh API listening on port ${info.port}`)
})
