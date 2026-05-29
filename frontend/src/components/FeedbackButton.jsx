import { useState } from 'react'
import { ALPHA_CONFIG } from '../config/alpha'
import './FeedbackButton.css'

/**
 * Bouton feedback alpha — mailto ou panneau contact configurable.
 */
export default function FeedbackButton({ variant = 'secondary' }) {
  const [open, setOpen] = useState(false)
  const { feedbackEmail, feedbackDiscord, feedbackTwitter } = ALPHA_CONFIG
  const hasLinks = feedbackEmail || feedbackDiscord || feedbackTwitter

  const handleClick = () => {
    if (feedbackEmail && !feedbackDiscord && !feedbackTwitter) {
      window.location.href = `mailto:${feedbackEmail}?subject=${encodeURIComponent('UT-Project Alpha — Feedback')}`
      return
    }
    setOpen(true)
  }

  return (
    <>
      <button
        type="button"
        className={`feedback-btn feedback-btn--${variant}`}
        onClick={handleClick}
      >
        Signaler un bug / Donner un avis
      </button>

      {open && (
        <div className="feedback-modal" role="dialog" aria-modal="true">
          <button
            type="button"
            className="feedback-modal__backdrop"
            onClick={() => setOpen(false)}
            aria-label="Fermer"
          />
          <div className="feedback-modal__panel">
            <h3>Feedback Alpha</h3>
            <p>Merci de tester UltraTech Online ! Décrivez le bug ou votre avis :</p>

            <ul className="feedback-modal__links">
              {feedbackEmail && (
                <li>
                  <a href={`mailto:${feedbackEmail}?subject=${encodeURIComponent('UT-Project Alpha — Feedback')}`}>
                    ✉ Email — {feedbackEmail}
                  </a>
                </li>
              )}
              {feedbackDiscord && (
                <li>
                  <a href={feedbackDiscord} target="_blank" rel="noopener noreferrer">
                    Discord
                  </a>
                </li>
              )}
              {feedbackTwitter && (
                <li>
                  <a href={feedbackTwitter} target="_blank" rel="noopener noreferrer">
                    Twitter / X
                  </a>
                </li>
              )}
              {!hasLinks && (
                <li className="feedback-modal__placeholder">
                  Configurez VITE_FEEDBACK_EMAIL, VITE_FEEDBACK_DISCORD ou VITE_FEEDBACK_TWITTER
                  dans votre fichier .env pour activer les liens de contact.
                </li>
              )}
            </ul>

            <button type="button" className="feedback-modal__close" onClick={() => setOpen(false)}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  )
}
