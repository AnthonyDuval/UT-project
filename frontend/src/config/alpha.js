/**
 * Configuration alpha publique — liens et feedback (via variables Vite).
 *
 * Exemple .env :
 *   VITE_NETLIFY_URL=https://ultratech-online.netlify.app
 *   VITE_FEEDBACK_EMAIL=contact@example.com
 *   VITE_FEEDBACK_DISCORD=https://discord.gg/xxxxx
 *   VITE_FEEDBACK_TWITTER=https://twitter.com/handle
 */

export const ALPHA_CONFIG = {
  netlifyUrl: import.meta.env.VITE_NETLIFY_URL || '',
  feedbackEmail: import.meta.env.VITE_FEEDBACK_EMAIL || '',
  feedbackDiscord: import.meta.env.VITE_FEEDBACK_DISCORD || '',
  feedbackTwitter: import.meta.env.VITE_FEEDBACK_TWITTER || '',
}
