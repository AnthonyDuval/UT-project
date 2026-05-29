import './HowToPlayPanel.css'

const STEPS = [
  {
    title: 'Tape help',
    body: 'Liste les commandes déjà débloquées. D\'autres se cachent dans les fichiers — rien n\'est donné d\'emblée.',
  },
  {
    title: 'Consulte les fichiers',
    body: 'Utilise ls puis open [fichier] dans le panneau gauche ou le terminal. readme.txt et system.log sont le point de départ.',
  },
  {
    title: 'Trouve les commandes cachées',
    body: 'Certaines actions (lire un log, scanner le réseau…) débloquent scan, connect, probe et d\'autres outils.',
  },
  {
    title: 'Surveille la TRACE UltraTech',
    body: 'Chaque action risquée augmente la jauge TRACE (0–100 %). À 100 % : Game Over. La barre rouge en haut te prévient.',
  },
  {
    title: 'Utilise le Black Market',
    body: 'Après la Mission 1, achète des consommables anti-trace ou des programmes .exe pour réduire la menace.',
  },
  {
    title: 'Cherche les secrets',
    body: 'Certaines commandes ne figurent pas dans help. Les fichiers corrompus et une TRACE élevée révèlent parfois autre chose…',
  },
]

/**
 * Panneau « Comment jouer ? » — règles essentielles de l'alpha.
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
          UltraTech Online est un terminal narratif : explore, infiltre des nœuds réseau
          et reste sous le radar de la surveillance corporatiste.
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
          <p>Mission 1 — Signal Fantôme : lire les fichiers → scan → connect relay_ghost</p>
          <button type="button" className="howto__ok" onClick={onClose}>
            Compris
          </button>
        </footer>
      </div>
    </div>
  )
}
