import './DemoBanner.css'

/**
 * Bannière discrète — mode démo sans backend.
 */
export default function DemoBanner() {
  return (
    <div className="demo-banner" role="status" aria-live="polite">
      <span className="demo-banner__dot" aria-hidden="true" />
      MODE DEMO OFFLINE
    </div>
  )
}
