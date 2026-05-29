import './Codex.css'

const RARITY_LABELS = {
  commun: 'Commun',
  rare: 'Rare',
  interdit: 'Interdit',
  anomalie: 'Anomalie',
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
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
  if (!codex) {
    return (
      <div className="codex codex--empty">
        <p>Chargement du registre...</p>
      </div>
    )
  }

  const { entries, discoveredCount, total, progressLabel } = codex
  const ratio = total ? discoveredCount / total : 0

  return (
    <div className="codex">
      <header className="codex__header">
        <div>
          <h2 className="codex__title">CODEX DES DÉCOUVERTES</h2>
          <p className="codex__subtitle">Registre clandestin — classification N0VA/███</p>
        </div>
        <div className="codex__progress-block">
          <span className="codex__progress-label">Secrets découverts</span>
          <strong className="codex__progress-value">{progressLabel}</strong>
          <div className="codex__progress-bar">
            <div className="codex__progress-fill" style={{ width: `${ratio * 100}%` }} />
          </div>
        </div>
      </header>

      <p className="codex__intro">
        Les anomalies, commandes oubliées et fichiers corrompus apparaissent ici une fois observés.
        Les entrées verrouillées n&apos;existent pas — officiellement.
      </p>

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
                  {RARITY_LABELS[entry.rarity] || entry.rarity}
                </span>
              )}
            </div>

            {entry.discovered ? (
              <>
                <p className="codex__desc">{entry.description}</p>
                <div className="codex__meta">
                  <span className="codex__date">Découvert : {formatDate(entry.discoveredAt)}</span>
                </div>
                {entry.nextHint && (
                  <p className="codex__hint">
                    <span className="codex__hint-label">Piste suivante</span>
                    {entry.nextHint}
                  </p>
                )}
              </>
            ) : (
              <p className="codex__locked-text">
                Entrée non cataloguée. Continuez d&apos;explorer le terminal, les fichiers et les silences du réseau.
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
