/**
 * Classifie une ligne terminal pour coloration intelligente.
 */
export function getLineClass(line) {
  if (!line || typeof line !== 'string') return 'line--default'

  if (line.startsWith('> ')) return 'line--command'
  if (line.includes('╔') || line.includes('╝') || line.includes('║')) return 'line--banner'
  if (line.startsWith('[ERR]') || line.includes('DENIED') || line.includes('REFUSED')) return 'line--error'
  if (line.startsWith('[TRACE]') || line.includes('TRACE CRITIQUE') || line.includes('[!!!]')) return 'line--trace'
  if (line.startsWith('[ULTRATECH]') || line.includes('WE SEE') || line.includes('LOCALIS')) return 'line--ultratech'
  if (line.startsWith('[WARN]') || line.startsWith('⚠')) return 'line--warn'
  if (line.startsWith('[BOOT]') || line.startsWith('[KERNEL]') || line.startsWith('[CHECK]')) return 'line--boot'
  if (line.startsWith('[SYS]') || line.startsWith('[INFO]')) return 'line--sys'
  if (line.startsWith('[SCAN]') || line.startsWith('[CONNECT]') || line.startsWith('[NET]')) return 'line--net'
  if (line.startsWith('[MARKET]') || line.startsWith('[INV]')) return 'line--market'
  if (line.startsWith('[EVENT]') || line.includes('N0VA') || line.startsWith('>>>')) return 'line--nova'
  if (line.startsWith('«') || line.startsWith('—')) return 'line--dialogue'
  if (line.startsWith('[AUTH]') || line.startsWith('[SECOPS]')) return 'line--auth'
  if (line.includes('OK') && line.includes('...')) return 'line--success'
  if (line.startsWith('──')) return 'line--divider'

  return 'line--default'
}
