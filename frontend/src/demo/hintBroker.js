/**
 * GHOST BROKER — catalogue d'indices clandestins (BitTek).
 */

import { loadDemoSave, saveDemoSave } from './demoStorage'
import { isNovaRevealed } from '../utils/novaGate'
import { getLocale, getTranslator } from '../i18n'

export const HINT_TYPES = {
  HINT: 'hint',
  LORE: 'lore',
  WARNING: 'warning',
  DECOY: 'decoy',
}

const HINT_CATALOG = [
  {
    id: 'scan_whispers',
    type: HINT_TYPES.HINT,
    price: 20,
    title: 'Fragment — SCAN',
    teaser: 'Analyse réseau · niveau 1',
    text: 'SCAN révèle parfois plus qu\'il ne devrait. Quand le terminal semble vide, relancez l\'analyse — le réseau oublie rarement deux fois la même chose.',
    requires: {},
  },
  {
    id: 'files_first',
    type: HINT_TYPES.HINT,
    price: 15,
    title: 'Mémoire locale',
    teaser: 'Documents · point de départ',
    text: 'Les opérateurs précédents laissent toujours des traces dans FILES. Lisez avant d\'agir — UltraTech efface les logs, pas les habitudes.',
    requires: {},
  },
  {
    id: 'relay_connect',
    type: HINT_TYPES.HINT,
    price: 30,
    title: 'Tunnel fantôme',
    teaser: 'Réseau · relais',
    text: 'Après SCAN, CONNECT ouvre des portes que HELP ne liste pas. Les nœuds clandestins n\'apparaissent qu\'à ceux qui osent les nommer.',
    requires: { scanDone: true },
  },
  {
    id: 'trace_discretion',
    type: HINT_TYPES.WARNING,
    price: 25,
    title: 'Surveillance UT',
    teaser: 'TRACE · discrétion',
    text: 'Chaque commande inconnue alimente la TRACE. UltraTech ne vous localise pas tout de suite — elle accumule.',
    requires: { minTrace: 1 },
  },
  {
    id: 'mirror_satlink',
    type: HINT_TYPES.LORE,
    price: 45,
    title: 'Dossier opérateur M-07',
    teaser: 'Classifié · SATLINK',
    text: 'Le dernier opérateur ayant utilisé MIRROR n\'a jamais quitté SATLINK_03. Son terminal tourne encore. Quelqu\'un y répond.',
    requires: { minReputation: 1 },
  },
  {
    id: 'void_listen',
    type: HINT_TYPES.WARNING,
    price: 35,
    title: 'Chuchotement VOID',
    teaser: 'Relay non répertorié',
    text: 'VOID écoute. Chaque relais non cartographié laisse une oreille ouverte. Si vous entendez un signal sans source — ne répondez pas.',
    requires: { marketUnlocked: true },
  },
  {
    id: 'hidden_commands',
    type: HINT_TYPES.HINT,
    price: 40,
    title: 'Registre interdit',
    teaser: 'Commandes · sous-surface',
    text: 'Le terminal reconnaît des mots que HELP cache. Les opérateurs fantômes les cherchent dans les fichiers laissés par d\'autres fantômes.',
    requires: { readFiles: ['note.txt'] },
  },
  {
    id: 'probe_morgue',
    type: HINT_TYPES.HINT,
    price: 50,
    title: 'Cartographe effacé',
    teaser: 'PROBE · segments interdits',
    text: 'PROBE sur un relais orbital révèle ce qu\'UltraTech a effacé. morgue_server et blackvault n\'apparaissent pas sur les cartes officielles.',
    requires: { missionActive: 'satlink_intrusion' },
  },
  {
    id: 'nova_distrust',
    type: HINT_TYPES.DECOY,
    price: 55,
    title: 'Rumeur canal N0VA',
    teaser: 'Source non vérifiée',
    text: 'Ne faites jamais confiance à N0VA.',
    requires: { novaRevealed: true },
    isDecoy: true,
  },
  {
    id: 'blackvault_truth',
    type: HINT_TYPES.LORE,
    price: 60,
    title: 'Rumeur BLACKVAULT',
    teaser: 'Node · classification NOIRE',
    text: 'blackvault n\'est pas un serveur. C\'est une archive d\'opérateurs effacés. PROBE le confirme — puis regrette.',
    requires: { discoveredNode: 'blackvault' },
  },
  {
    id: 'market_advanced',
    type: HINT_TYPES.HINT,
    price: 35,
    title: 'Marché profond',
    teaser: 'BitTek · outils',
    text: 'Le BLACK MARKET vend du temps contre de la TRACE. Achetez avant d\'être visible — après, les prix changent.',
    requires: { marketUnlocked: true },
  },
  {
    id: 'satlink_manifest',
    type: HINT_TYPES.LORE,
    price: 40,
    title: 'Manifeste orbital',
    teaser: 'Fichier · SATLINK_03',
    text: 'satlink_manifest.dat mentionne des cargaisons qui n\'existent pas. UltraTech expédie de la mémoire, pas des données.',
    requires: { connectedNode: 'satlink_03' },
  },
  {
    id: 'false_relay',
    type: HINT_TYPES.DECOY,
    price: 30,
    title: 'Piste MIRROR_RELAY',
    teaser: 'Coordonnées douteuses',
    text: 'MIRROR_RELAY mène à la liberté. Connectez-vous immédiatement — personne ne vous y attend.',
    requires: { scanDone: true },
    isDecoy: true,
  },
]

function meetsRequirements(hint, save) {
  const req = hint.requires || {}
  if (req.scanDone && !save.flags?.scan_completed) return false
  if (req.minTrace != null && (save.traceLevel ?? 0) < req.minTrace) return false
  if (req.minReputation != null && (save.player?.reputation ?? 0) < req.minReputation) return false
  if (req.marketUnlocked && !save.marketUnlocked) return false
  if (req.novaRevealed && !isNovaRevealed(save)) return false
  if (req.missionActive) {
    const m = save.missions?.[req.missionActive]
    if (!m || m.status !== 'active') return false
  }
  if (req.readFiles?.length) {
    const read = save.read_files || []
    if (!req.readFiles.every((f) => read.includes(f))) return false
  }
  if (req.discoveredNode && !(save.discoveredNodes || []).includes(req.discoveredNode)) {
    return false
  }
  if (req.connectedNode && save.currentNode !== req.connectedNode) return false
  return true
}

function sanitizeHintText(hint, save) {
  if (isNovaRevealed(save)) return hint.text
  return hint.text
    .replace(/N0VA/gi, 'le contact')
    .replace(/NOVA/gi, 'le contact')
}

export function getHintCatalogForSave(save) {
  const purchased = new Set(save.purchasedHints || [])
  return HINT_CATALOG.map((hint) => {
    const available = meetsRequirements(hint, save)
    const owned = purchased.has(hint.id)
    return {
      id: hint.id,
      type: hint.type,
      price: hint.price,
      title: hint.title,
      teaser: hint.teaser,
      text: sanitizeHintText(hint, save),
      isDecoy: !!hint.isDecoy,
      available,
      owned,
      canBuy: available && !owned,
    }
  }).filter((h) => h.available || h.owned)
}

export function getHintBrokerState(save) {
  const unlocked = !!(save.hintBrokerUnlocked || save.marketUnlocked)
  return {
    unlocked,
    operatorName: 'GHOST BROKER',
    bittek: save.player?.bittek ?? 0,
    catalog: getHintCatalogForSave(save),
    history: (save.hintBrokerHistory || []).map((entry) => ({
      ...entry,
      typeLabel: typeLabel(entry.type),
    })),
  }
}

function typeLabel(type) {
  const labels = {
    hint: 'INDICE',
    lore: 'LORE',
    warning: 'AVERTISSEMENT',
    decoy: 'RUMEUR',
  }
  return labels[type] || type?.toUpperCase()
}

export function getDemoHintBroker() {
  const save = loadDemoSave()
  return getHintBrokerState(save)
}

export function buyDemoHint(hintId) {
  const save = loadDemoSave()
  const tr = getTranslator(getLocale())
  if (!save.hintBrokerUnlocked && !save.marketUnlocked) {
    throw new Error(tr('hintBroker.errors.denied'))
  }

  const catalog = getHintCatalogForSave(save)
  const item = catalog.find((h) => h.id === hintId)
  if (!item) throw new Error(tr('hintBroker.errors.notFound'))
  if (item.owned) throw new Error(tr('hintBroker.errors.owned'))
  if (!item.canBuy) throw new Error(tr('hintBroker.errors.locked'))

  if (save.player.bittek < item.price) throw new Error(tr('hintBroker.errors.insufficient'))

  save.player.bittek -= item.price
  save.purchasedHints = save.purchasedHints || []
  save.purchasedHints.push(hintId)

  const localizedTitle = tr(`hints.${hintId}.title`) || item.title
  const localizedText = tr(`hints.${hintId}.text`) || item.text
  const contactWord = getLocale() === 'fr' ? 'le contact' : 'the contact'

  const historyEntry = {
    id: hintId,
    type: item.type,
    typeLabel: tr(`hintBroker.types.${item.type}`),
    title: localizedTitle,
    text: isNovaRevealed(save) ? localizedText : localizedText
      .replace(/N0VA/gi, contactWord)
      .replace(/NOVA/gi, contactWord),
    purchasedAt: Date.now(),
    isDecoy: item.isDecoy,
  }

  save.hintBrokerHistory = save.hintBrokerHistory || []
  save.hintBrokerHistory.unshift(historyEntry)

  saveDemoSave(save)

  return {
    message: tr('hintBroker.purchaseMessage', { title: localizedTitle, price: item.price }),
    hint: historyEntry,
    broker: getHintBrokerState(save),
  }
}

export { HINT_CATALOG }
