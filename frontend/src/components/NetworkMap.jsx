import './NetworkMap.css'

const SECURITY_COLORS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  BLACK: 'black',
  UNKNOWN: 'unknown',
}

/**
 * Mini carte réseau stylisée — nœuds découverts et connexion active.
 */
export default function NetworkMap({ network }) {
  if (!network) return null

  const { nodes = [], currentNode, connected } = network
  const displayNodes = nodes.filter((n) => n.id !== 'local')

  if (displayNodes.length === 0) {
    return (
      <div className="netmap netmap--empty">
        <span className="netmap__placeholder">Aucun nœud détecté</span>
        <span className="netmap__hint">Le réseau garde encore des secrets</span>
      </div>
    )
  }

  return (
    <div className={`netmap ${connected ? 'netmap--connected' : ''}`}>
      <div className="netmap__grid">
        {/* Nœud local (hub) */}
        <div className={`netmap__node netmap__node--local ${currentNode === 'local' ? 'netmap__node--active' : ''}`}>
          <span className="netmap__dot" />
          <span className="netmap__label">LOCAL</span>
        </div>

        <div className="netmap__links" aria-hidden="true">
          <div className="netmap__link-line" />
        </div>

        <div className="netmap__remote">
          {displayNodes.map((node) => (
            <div
              key={node.id}
              className={[
                'netmap__node',
                `netmap__node--${SECURITY_COLORS[node.securityLevel] || 'unknown'}`,
                node.current ? 'netmap__node--active' : '',
                node.hacked ? 'netmap__node--hacked' : '',
              ].filter(Boolean).join(' ')}
              title={`${node.name} — ${node.securityLevel}`}
            >
              <span className="netmap__dot" />
              <span className="netmap__label">{node.name.replace(/_/g, ' ')}</span>
              {node.hacked && <span className="netmap__badge">✓</span>}
              {node.current && <span className="netmap__pulse" />}
            </div>
          ))}
        </div>
      </div>

      {connected && (
        <div className="netmap__packets" aria-hidden="true">
          <span className="netmap__packet" />
          <span className="netmap__packet netmap__packet--delay" />
        </div>
      )}
    </div>
  )
}
