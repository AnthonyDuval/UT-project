import './HowToPlayPanel.css'

const STEPS = [
  {
    title: 'Tape help',
    body: 'Affiche ce que vous pouvez faire. De nouvelles actions apparaissent en explorant.',
  },
  {
    title: 'Lis les documents',
    body: 'Tapez files pour lister les documents, puis open note.txt pour les ouvrir.',
  },
  {
    title: 'Suis les indices',
    body: 'Chaque document peut révéler une nouvelle commande. Pas besoin de tout deviner.',
  },
  {
    title: 'Reste discret',
    body: 'UltraTech vous observe. Une jauge TRACE apparaît quand vous prenez des risques.',
  },
  {
    title: 'Explorez progressivement',
    body: 'Réseau, marché noir, programmes… tout se débloque au fil de l\'histoire.',
  },
]

/**
 * Panneau d'aide optionnel — le jeu s'apprend surtout en jouant.
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
          Vous avez accès à un terminal sécurisé. Lisez, explorez, connectez-vous
          à des signaux cachés — sans vous faire repérer.
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
          <p>Commencez par : help → files → open note.txt</p>
          <button type="button" className="howto__ok" onClick={onClose}>
            Compris
          </button>
        </footer>
      </div>
    </div>
  )
}
