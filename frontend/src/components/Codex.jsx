import { useLanguage } from '../i18n/LanguageProvider'
import { localeDateFormat } from '../i18n/helpers'
import './Codex.css'

function formatDate(iso, locale) {
  try {
    return new Date(iso).toLocaleString(localeDateFormat(), {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

/**
 * Codex des découvertes — secrets débloqués uniquement.
 */
export default function Codex({ codex }) {
  const { t, locale } = useLanguage()

  if (!codex) {
    return (
      <div className="codex codex--empty">
        <p>{t('codex.ui.loading')}</p>
      </div>
    )
  }

  const { entries, discoveredCount, total, progressLabel, novaRevealed } = codex
  const ratio = total ? discoveredCount / total : 0

  return (
    <div className="codex">
      <header className="codex__header">
        <div>
          <h2 className="codex__title">{t('codex.ui.title')}</h2>
          <p className="codex__subtitle">
            {novaRevealed
              ? t('codex.ui.subtitleRevealed', { count: discoveredCount, total })
              : t('codex.ui.subtitleHidden')}
          </p>
        </div>
        <div className="codex__progress-block">
          <span className="codex__progress-label">{t('codex.ui.secretsLabel')}</span>
          <strong className="codex__progress-value">{progressLabel}</strong>
          <div className="codex__progress-bar">
            <div className="codex__progress-fill" style={{ width: `${ratio * 100}%` }} />
          </div>
        </div>
      </header>

      <p className="codex__intro">{t('codex.ui.intro')}</p>

      <ul className="codex__list">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className={`codex__entry ${entry.discovered ? 'codex__entry--found' : 'codex__entry--locked'} ${entry.discovered ? `codex__entry--${entry.rarity}` : ''}`}
          >
            <div className="codex__entry-head">
              <span className="codex__slot">#{String(entry.slot).padStart(2, '0')}</span>
              <h3 className="codex__entry-name">{entry.name}</h3>
              {entry.discovered && entry.rarity && (
                <span className={`codex__rarity codex__rarity--${entry.rarity}`}>
                  {t(`codex.rarity.${entry.rarity}`) || entry.rarity}
                </span>
              )}
            </div>

            {entry.discovered ? (
              <>
                <p className="codex__desc">{entry.description}</p>
                <div className="codex__meta">
                  <span className="codex__date">
                    {t('codex.ui.discoveredAt', { date: formatDate(entry.discoveredAt, locale) })}
                  </span>
                </div>
                {entry.nextHint && (
                  <p className="codex__hint">
                    <span className="codex__hint-label">{t('codex.ui.nextHint')}</span>
                    {entry.nextHint}
                  </p>
                )}
              </>
            ) : (
              <p className="codex__locked-text">{t('codex.ui.lockedHint')}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
