export const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,24}$/

export function cleanUsername(value: string) {
  return value.replace(/[^A-Za-z0-9_]/g, '').slice(0, 24)
}

export function usernameHint(value: string) {
  if (!value) return '3–24 letters, numbers, or _'
  if (value.length < 3) return `${3 - value.length} more character${value.length === 2 ? '' : 's'}`
  if (!USERNAME_PATTERN.test(value)) return 'Only letters, numbers, and _'
  return ''
}

export function passwordHint(value: string, confirm?: string) {
  if (!value) return 'At least 8 characters'
  if (value.length < 8) return `${8 - value.length} more to go`
  if (confirm !== undefined && confirm.length > 0 && confirm !== value) return 'Passwords do not match yet'
  return ''
}

export function passwordScore(value: string) {
  let score = 0
  if (value.length >= 8) score += 1
  if (value.length >= 12) score += 1
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1
  if (/\d/.test(value) || /[^A-Za-z0-9]/.test(value)) score += 1
  return score
}

export function passwordScoreLabel(score: number) {
  if (score <= 1) return 'Keep going'
  if (score === 2) return 'Okay'
  if (score === 3) return 'Strong'
  return 'Solid'
}

export function canSubmit(mode: 'signin' | 'signup', username: string, password: string, confirm: string) {
  if (!USERNAME_PATTERN.test(username) || password.length < 8) return false
  if (mode === 'signup' && password !== confirm) return false
  return true
}
