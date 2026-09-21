import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { LANG_KEY } from '../constants'
import { ar } from './ar'
import { en, type Messages } from './en'
import { fr } from './fr'

export type Locale = 'en' | 'fr' | 'ar'
export type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string

export const LOCALES: Locale[] = ['en', 'fr', 'ar']
export const LOCALE_TAGS: Record<Locale, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  ar: 'ar-MA',
}

const dictionaries: Record<Locale, Messages> = { en, fr, ar }

const API_ERROR_KEYS: Record<string, MessageKey> = {
  'Too many attempts. Try again later.': 'errors.tooMany',
  'Username must be 3–24 letters, numbers, or _.': 'errors.usernameRule',
  'Please enter a valid email address.': 'errors.emailInvalid',
  'Password must be at least 8 characters.': 'errors.passwordRule',
  'That username is already taken. Try another.': 'errors.usernameTaken',
  'That email is already in use. Try another or sign in.': 'errors.emailTaken',
  'That username or password does not match.': 'errors.badCredentials',
  'Cannot reach Onesh. Check your connection and try again.': 'errors.offline',
  'Something went wrong. Try again.': 'errors.generic',
  'Sign in required.': 'errors.signInRequired',
  'Data is too large.': 'errors.dataTooLarge',
}

type I18n = {
  locale: Locale
  dir: 'ltr' | 'rtl'
  localeTag: string
  setLocale: (locale: Locale) => void
  t: Translate
  translateError: (message: string) => string
}

const I18nContext = createContext<I18n | null>(null)

type LeafPaths<T, Prefix extends string = ''> = T extends string
  ? Prefix
  : {
      [K in keyof T & string]: LeafPaths<T[K], Prefix extends '' ? K : `${Prefix}.${K}`>
    }[keyof T & string]

export type MessageKey = LeafPaths<Messages>

function getPath(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, piece) => {
    if (current && typeof current === 'object' && piece in current) {
      return (current as Record<string, unknown>)[piece]
    }
    return undefined
  }, source)
}

function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`))
}

export function translate(locale: Locale, key: MessageKey, vars?: Record<string, string | number>) {
  const fromLocale = getPath(dictionaries[locale], key)
  const fallback = getPath(en, key)
  const template = typeof fromLocale === 'string' ? fromLocale : typeof fallback === 'string' ? fallback : key
  return interpolate(template, vars)
}

export function readLocale(): Locale {
  try {
    const value = localStorage.getItem(LANG_KEY)
    return value === 'fr' || value === 'ar' ? value : 'en'
  } catch {
    return 'en'
  }
}

export function applyLocale(locale: Locale) {
  const dir = locale === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = locale
  document.documentElement.dir = dir
  document.documentElement.dataset.lang = locale
  document.title = translate(locale, 'meta.title')
}

export function writeLocale(locale: Locale) {
  try {
    localStorage.setItem(LANG_KEY, locale)
  } catch {
    /* ignore quota / private mode */
  }
  applyLocale(locale)
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => readLocale())

  useEffect(() => {
    applyLocale(locale)
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    writeLocale(next)
    setLocaleState(next)
  }, [])

  const t = useCallback<Translate>((key, vars) => translate(locale, key, vars), [locale])

  const translateError = useCallback(
    (message: string) => {
      const key = API_ERROR_KEYS[message]
      return key ? translate(locale, key) : translate(locale, 'errors.generic')
    },
    [locale],
  )

  const value = useMemo<I18n>(
    () => ({
      locale,
      dir: locale === 'ar' ? 'rtl' : 'ltr',
      localeTag: LOCALE_TAGS[locale],
      setLocale,
      t,
      translateError,
    }),
    [locale, setLocale, t, translateError],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n must be used within LanguageProvider')
  return value
}
