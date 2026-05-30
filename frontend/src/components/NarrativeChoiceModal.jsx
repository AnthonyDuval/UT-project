import { useCallback, useEffect, useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageProvider'
import './NarrativeChoiceModal.css'

const AUTO_DISMISS_MS = 50000
const ENTER_MS = 380
const EXIT_MS = 420

const CHOICE_OPTIONS = {
  nova_listen: ['listen', 'ignore'],
  veil_cut: ['cut', 'stay'],
  morse_intel: ['buy', 'decline'],
  ut_ignore: ['ignore', 'obey'],
  echo_signal: ['save', 'cut', 'sell'],
  veil_protocol: ['cooperate', 'ignore', 'warn_nova'],
}

const DEFAULT_OPTION = {
  nova_listen: 'ignore',
  veil_cut: 'stay',
  morse_intel: 'decline',
  ut_ignore: 'obey',
  echo_signal: 'cut',
  veil_protocol: 'ignore',
}

export default function NarrativeChoiceModal({ choice, onChoice }) {
  const { t } = useLanguage()
  const resolvedRef = useRef(false)
  const pendingChoiceIdRef = useRef(null)
  const [phase, setPhase] = useState('hidden')
  /** Snapshot local — survit à choice=null pendant l'animation de sortie. */
  const [snapshot, setSnapshot] = useState(null)

  const choiceId = snapshot?.id ?? null
  const options = choiceId ? (CHOICE_OPTIONS[choiceId] || []) : []

  const finishExit = useCallback(() => {
    setPhase('hidden')
    setSnapshot(null)
    pendingChoiceIdRef.current = null
    resolvedRef.current = false
  }, [])

  const choose = useCallback((option) => {
    const id = pendingChoiceIdRef.current ?? snapshot?.id
    if (resolvedRef.current || !id) return

    resolvedRef.current = true
    setPhase('exit')
    onChoice?.(id, option)
  }, [snapshot?.id, onChoice])

  useEffect(() => {
    if (!choice?.open || !choice?.id) return undefined

    resolvedRef.current = false
    pendingChoiceIdRef.current = choice.id
    setSnapshot({ id: choice.id, startedAt: choice.startedAt ?? Date.now() })
    setPhase('enter')

    const enterTimer = setTimeout(() => setPhase('visible'), ENTER_MS)
    const fallback = DEFAULT_OPTION[choice.id]
      || CHOICE_OPTIONS[choice.id]?.[1]
      || CHOICE_OPTIONS[choice.id]?.[0]
    const autoTimer = setTimeout(() => {
      if (fallback) choose(fallback)
    }, AUTO_DISMISS_MS)

    return () => {
      clearTimeout(enterTimer)
      clearTimeout(autoTimer)
    }
  }, [choice?.open, choice?.id, choice?.startedAt, choose])

  useEffect(() => {
    if (choice?.open || !snapshot) return
    if (phase === 'exit' || phase === 'hidden') return
    setPhase('exit')
  }, [choice?.open, snapshot, phase])

  useEffect(() => {
    if (phase !== 'exit') return undefined
    const exitTimer = setTimeout(finishExit, EXIT_MS)
    return () => clearTimeout(exitTimer)
  }, [phase, finishExit])

  if (!snapshot?.id) {
    return null
  }

  if (!CHOICE_OPTIONS[snapshot.id]) {
    // eslint-disable-next-line no-console
    console.warn('[NarrativeChoiceModal] unknown choice id', snapshot.id)
    return null
  }

  const prefix = `influenceChoices.${snapshot.id}`

  return (
    <div
      className={`narrative-choice ${phase}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="narrative-choice-title"
    >
      <div className="narrative-choice__backdrop" aria-hidden="true" />
      <div className="narrative-choice__scanlines" aria-hidden="true" />
      <div className="narrative-choice__panel">
        <div className="narrative-choice__header">
          <span className="narrative-choice__seal">{t(`${prefix}.seal`)}</span>
        </div>
        <h2 id="narrative-choice-title" className="narrative-choice__title">
          {t(`${prefix}.title`)}
        </h2>
        <p className="narrative-choice__subtitle">{t(`${prefix}.subtitle`)}</p>

        <div className="narrative-choice__choices">
          {options.map((opt, index) => (
            <button
              key={opt}
              type="button"
              className={`narrative-choice__option${index === 1 ? ' narrative-choice__option--alt' : ''}`}
              onClick={() => choose(opt)}
              disabled={phase === 'exit'}
            >
              <span className="narrative-choice__option-label">{t(`${prefix}.options.${opt}.label`)}</span>
              <span className="narrative-choice__option-hint">{t(`${prefix}.options.${opt}.hint`)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
