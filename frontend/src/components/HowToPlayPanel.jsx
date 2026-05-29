import './HowToPlayPanel.css'

const STEPS = [
  {
    title: 'Lisez tout',
    body: 'Documents, logs, archives corrompues. Les réponses sont dans le texte — pas dans un manuel.',
  },
  {
    title: 'Retenez les mots étranges',
    body: 'Des noms interdits circulent dans les fichiers. Essayez-les au terminal.',
  },
  {
    title: 'Observez les réactions',
    body: 'Le système répond, se tait, ou ment. Chaque essai révèle quelque chose.',
  },
  {
    title: 'Restez discret',
    body: 'UltraTech surveille. Plus vous forcez, plus la TRACE monte.',
  },
  {
    title: 'Faites confiance à personne',
    body: 'N0VA, UltraTech, les logs effacés — tout le monde a un agenda.',
  },
]

/**
 * Panneau d'aide optionnel — ton enquête, pas tutoriel technique.
 */
export default function HowToPlayPanel({ open, onClose }) {
  if (!open) return null

  return (
    <div className="howto" role="dialog" aria-modal="true" aria-labelledby="howto-title">
      <button type="button" className="howto__backdrop" onClick={onClose} aria-label="Fermer" />
      <div className="howto__panel">
        <header className="howto__header">
          <h2 id="howto-title">Comment jouer ?</h2>
          <button type="button" className="howto__close" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </header>

        <p className="howto__intro">
          Vous avez accès illégal à un terminal UltraTech. Ce n'est pas un cours
          d'informatique — c'est une enquête dans un réseau interdit.
        </p>

        <ol className="howto__list">
          {STEPS.map((step, i) => (
            <li key={step.title} className="howto__item">
              <span className="howto__step-num">{i + 1}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <footer className="howto__footer">
          <p>Commencez par lire ce qui traîne sur le terminal.</p>
          <button type="button" className="howto__ok" onClick={onClose}>
            Compris
          </button>
        </footer>
      </div>
    </div>
  )
}
