const LOCALE_KEY = 'ut_locale'
const SUPPORTED = ['fr', 'en']

export function detectBrowserLocale() {
  const lang = (navigator.language || navigator.userLanguage || 'en').toLowerCase()
  if (lang.startsWith('fr')) return 'fr'
  return 'en'
}

export function normalizeLocale(value) {
  if (!value) return null
  const code = String(value).toLowerCase().slice(0, 2)
  return SUPPORTED.includes(code) ? code : null
}

export function loadStoredLocale() {
  try {
    return normalizeLocale(localStorage.getItem(LOCALE_KEY))
  } catch {
    return null
  }
}

export function getInitialLocale() {
  return loadStoredLocale() || detectBrowserLocale()
}

export function saveLocale(locale) {
  const code = normalizeLocale(locale)
  if (!code) return
  try {
    localStorage.setItem(LOCALE_KEY, code)
  } catch {
    /* storage optional */
  }
}

export function getLocale() {
  return loadStoredLocale() || detectBrowserLocale()
}

export { LOCALE_KEY, SUPPORTED }
