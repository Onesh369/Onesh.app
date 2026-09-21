import type { AppData } from '../types'
import { parseAppData } from './storage'

export type AuthUser = {
  id: string
  username: string
}

export class AuthError extends Error {
  constructor(message = 'Sign in required.') {
    super(message)
    this.name = 'AuthError'
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      ...init,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    })
  } catch {
    throw new Error('Cannot reach Onesh. Check your connection and try again.')
  }
  const body = (await response.json().catch(() => null)) as { error?: string } | T | null
  if (response.status === 401) {
    if (path !== '/api/me') window.dispatchEvent(new Event('onesh-auth-expired'))
    throw new AuthError(isErrorBody(body) && body.error ? body.error : 'Sign in required.')
  }
  if (!response.ok) {
    throw new Error(isErrorBody(body) && body.error ? body.error : 'Something went wrong. Try again.')
  }
  return body as T
}

function isErrorBody(value: unknown): value is { error?: string } {
  return typeof value === 'object' && value !== null
}

export function getMe() {
  return request<AuthUser>('/api/me')
}

export function signup(username: string, email: string, password: string) {
  return request<AuthUser>('/api/signup', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  })
}

export function login(username: string, password: string) {
  return request<AuthUser>('/api/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function logout() {
  return request<{ ok: boolean }>('/api/logout', { method: 'POST' })
}

export async function getData() {
  const data = await request<AppData>('/api/data')
  return parseAppData(data)
}

export function putData(data: AppData) {
  return request<{ ok: boolean }>('/api/data', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
