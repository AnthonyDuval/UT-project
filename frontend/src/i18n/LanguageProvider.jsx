import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { createTranslator } from './index'
import { getInitialLocale, saveLocale, normalizeLocale } from './storage'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(getInitialLocale)

  const setLocale = useCallback((next) => {
    const code = normalizeLocale(next)
    if (!code) return
    saveLocale(code)
    setLocaleState(code)
  }, [])

  const t = useMemo(() => createTranslator(locale), [locale])

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      localeCode: locale.toUpperCase(),
      localeLabel: t(`settings.lang.${locale}`),
    }),
    [locale, setLocale, t],
  )

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}

/** Alias for immersion docs — t("mission.active") */
export function useTranslation() {
  return useLanguage()
}
