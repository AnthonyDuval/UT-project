import fr from './fr'
import en from './en'
import { getLocale, normalizeLocale } from './storage'

const dictionaries = { fr, en }

function resolvePath(dict, key) {
  const keys = key.split('.')
  let val = dict
  for (const k of keys) {
    val = val?.[k]
    if (val === undefined) return undefined
  }
  return val
}

export function createTranslator(locale) {
  const code = normalizeLocale(locale) || 'en'
  const dict = dictionaries[code] || dictionaries.en

  function t(key, vars = {}) {
    const val = resolvePath(dict, key)
    if (val === undefined) {
      if (typeof console !== 'undefined') {
        console.warn('[i18n missing]', key)
      }
      return key
    }
    if (Array.isArray(val)) return val
    if (typeof val !== 'string') {
      if (typeof console !== 'undefined') {
        console.warn('[i18n missing]', key)
      }
      return key
    }
    return val.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : ''))
  }

  t.locale = code
  t.raw = (key) => resolvePath(dict, key)
  return t
}

export function translate(locale, key, vars) {
  return createTranslator(locale)(key, vars)
}

export function getTranslator(locale) {
  return createTranslator(locale ?? getLocale())
}

export { dictionaries, getLocale }
