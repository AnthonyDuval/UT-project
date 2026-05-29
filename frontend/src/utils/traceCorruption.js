/**
 * Corruption visuelle progressive liée à la TRACE.
 * Subtile — jamais agressif.
 */

export function getTraceCorruption(traceLevel = 0) {
  if (traceLevel >= 85) {
    return {
      tier: 3,
      className: 'app--trace-tier-3',
      scanlineOpacity: 0.22,
      rgbSplit: true,
      warp: true,
      label: 'critique',
    }
  }
  if (traceLevel >= 55) {
    return {
      tier: 2,
      className: 'app--trace-tier-2',
      scanlineOpacity: 0.16,
      rgbSplit: true,
      warp: false,
      label: 'élevée',
    }
  }
  if (traceLevel >= 28) {
    return {
      tier: 1,
      className: 'app--trace-tier-1',
      scanlineOpacity: 0.1,
      rgbSplit: false,
      warp: false,
      label: 'modérée',
    }
  }
  return {
    tier: 0,
    className: '',
    scanlineOpacity: 0.05,
    rgbSplit: false,
    warp: false,
    label: 'faible',
  }
}
