import { getLocale, getTranslator } from './index'

/** Map filename → i18n key segment (technical names unchanged). */
export const FILE_I18N_KEYS = {
  'note.txt': 'note_txt',
  'system.log': 'system_log',
  'toolkit_manifest.txt': 'toolkit_manifest_txt',
  'ghost_relay.log': 'ghost_relay_log',
  'nova_contact.dat': 'nova_contact_dat',
  'satlink_manifest.dat': 'satlink_manifest_dat',
  'nova_orbital_fragment.dat': 'nova_orbital_fragment_dat',
  'memory_fragment.log': 'memory_fragment_log',
  'unknown_signal.enc': 'unknown_signal_enc',
  'do_not_open.sys': 'do_not_open_sys',
  'archive_███.dat': 'archive_redacted_dat',
}

export function fileI18nKey(filename) {
  return FILE_I18N_KEYS[filename] || filename.replace(/[^a-z0-9]/gi, '_')
}

export function tx(key, vars) {
  return getTranslator(getLocale())(key, vars)
}

export function txRaw(key) {
  return getTranslator(getLocale()).raw(key)
}

export function txLines(key) {
  const val = txRaw(key)
  return Array.isArray(val) ? val : []
}

export function getFileDescription(filename) {
  const k = fileI18nKey(filename)
  return tx(`files.${k}.description`) || ''
}

export function getFileContent(filename) {
  const k = fileI18nKey(filename)
  const content = txLines(`files.${k}.content`)
  return content.length ? content : null
}

export function getCodexEntry(id) {
  const meta = txRaw(`codex.entries.${id}`)
  if (!meta) return null
  return {
    name: meta.name,
    description: meta.description,
    nextHint: meta.nextHint,
    rarity: meta.rarity,
  }
}

export function localeDateFormat() {
  return getLocale() === 'fr' ? 'fr-FR' : 'en-US'
}
