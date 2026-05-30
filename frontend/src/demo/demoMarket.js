/**
 * Black Market simulé pour le mode démo.
 */

import { loadDemoSave, saveDemoSave } from './demoStorage'
import { toPublicState } from './demoState'
import { getLocale, getTranslator } from '../i18n'
import { tx } from '../i18n/helpers'
import {
  canBuyMissionLimitedItem,
  recordMissionLimitedPurchase,
  reduceTrace,
} from '../systems/traceRecovery'
import { applyMarketPurchaseInfluence, isMorseRareCatalogUnlocked } from '../systems/CharacterInfluence'

export const DEMO_MARKET_ITEMS = [
  {
    id: 'firewall_jetable', name: 'Firewall Jetable', price: 40, rarity: 'common',
    description: 'Barrière réseau éphémère.', effect: 'Réduit la TRACE de 15 pts.',
    type: 'consumable', effect_type: 'reduce_trace', effect_value: 15, can_buy: true,
  },
  {
    id: 'trace_cleaner', name: 'Trace Cleaner', price: 90, rarity: 'uncommon',
    description: 'Effaceur de signature réseau.', effect: 'Réduit la TRACE de 20 pts.',
    type: 'consumable', effect_type: 'reduce_trace', effect_value: 20, can_buy: true,
    perMissionLimit: true,
  },
  {
    id: 'signal_scrubber', name: 'Signal Scrubber', price: 150, rarity: 'rare',
    description: 'Outil clandestin — effaceur profond.', effect: 'Réduit la TRACE de 25 pts.',
    type: 'consumable', effect_type: 'reduce_trace', effect_value: 25, can_buy: true,
    influenceCatalog: true,
  },
  {
    id: 'proxy_fantome', name: 'Proxy Fantôme', price: 70, rarity: 'uncommon',
    description: 'Relais anonyme instable.', effect: 'Réduit la TRACE de 25 pts.',
    type: 'consumable', effect_type: 'reduce_trace', effect_value: 25, can_buy: true,
  },
  {
    id: 'brouilleur_nova', name: 'Brouilleur N0VA', price: 100, rarity: 'rare',
    description: 'Atténue les signaux de traçage.', effect: '2 traces réduites de moitié.',
    type: 'consumable', effect_type: 'trace_halved', effect_value: 2, can_buy: true,
  },
  {
    id: 'prog_netscan', name: 'NetScan v2.1', price: 60, rarity: 'common', isProgram: true,
    programId: 'netscan', description: 'Analyseur réseau portable.',
    effect: 'Télécharge netscan.exe', type: 'program', can_buy: true,
  },
  {
    id: 'prog_trace_wiper', name: 'Trace Wiper Pro', price: 120, rarity: 'common', isProgram: true,
    programId: 'trace_wiper', description: 'Effaceur de signatures.',
    effect: 'Télécharge trace_wiper.exe', type: 'program', can_buy: true,
  },
  {
    id: 'spoof_identite', name: 'Spoof d\'identité', price: 140, rarity: 'rare',
    description: 'Masque temporaire la signature opérateur.', effect: 'Réduit la TRACE de 20 pts.',
    type: 'consumable', effect_type: 'reduce_trace', effect_value: 20, can_buy: true,
  },
  {
    id: 'pack_firewall_basique', name: 'Pack Firewall Basique', price: 180, rarity: 'legendary',
    description: 'Suite défensive permanente.', effect: 'Passif -5% TRACE permanent.',
    type: 'passive', effect_type: 'passive_reduction', effect_value: 5, can_buy: true,
  },
]

export function getDemoMarket() {
  const save = loadDemoSave()
  const ownedPassive = save.traceReductionPassive >= 5
  const items = DEMO_MARKET_ITEMS.filter((item) => {
    if (item.influenceCatalog && !isMorseRareCatalogUnlocked(save)) return false
    return true
  }).map((item) => {
    const missionLimited = item.perMissionLimit && !canBuyMissionLimitedItem(save, item.id)
    const ownedPassiveItem = item.type === 'passive' && ownedPassive
    return {
      ...item,
      name: item.id === 'brouilleur_nova' && !save.novaIntroSeen
        ? 'Brouilleur de signal'
        : item.name,
      can_buy: !ownedPassiveItem && !missionLimited,
      mission_limit_reached: missionLimited,
      owned_passive: ownedPassiveItem,
    }
  })
  return {
    unlocked: save.marketUnlocked,
    advancedUnlocked: save.marketAdvancedUnlocked,
    bittek: save.player.bittek,
    items,
  }
}

export function buyDemoItem(itemId) {
  const save = loadDemoSave()
  const item = DEMO_MARKET_ITEMS.find((i) => i.id === itemId)
  const tr = getTranslator(getLocale())
  if (!item) throw new Error(tr('errors.marketNotFound'))
  if (item.perMissionLimit && !canBuyMissionLimitedItem(save, itemId)) {
    throw new Error(tr('errors.marketMissionLimit'))
  }
  if (save.player.bittek < item.price) throw new Error(tr('errors.marketInsufficient'))

  save.player.bittek -= item.price

  if (item.type === 'program') {
    const existing = save.programInventory.find((e) => e.programId === item.programId)
    if (existing) existing.quantity += 1
    else save.programInventory.push({ programId: item.programId, quantity: 1 })
  } else if (item.type === 'passive') {
    save.traceReductionPassive += item.effect_value
  } else {
    const inv = save.inventory.find((e) => e.itemId === itemId)
    if (inv) inv.quantity += 1
    else save.inventory.push({ itemId, quantity: 1 })
  }

  if (item.perMissionLimit) recordMissionLimitedPurchase(save, itemId)

  saveDemoSave(save)
  const influenceLines = applyMarketPurchaseInfluence(save, item.price)
  if (influenceLines.length) {
    save.events_log = save.events_log || []
    influenceLines.forEach((line) => save.events_log.push(line))
    saveDemoSave(save)
  }
  const itemName = tr(`market.items.${itemId}.name`) || item.name
  return {
    message: tr('errors.marketPurchase', { name: itemName, price: item.price }),
    state: toPublicState(save),
    inventory: getDemoInventory(),
    output: influenceLines,
  }
}

export function getDemoInventory() {
  const save = loadDemoSave()
  const inventory = save.inventory.map((entry) => {
    const meta = DEMO_MARKET_ITEMS.find((i) => i.id === entry.itemId) || {}
    return {
      itemId: entry.itemId,
      quantity: entry.quantity,
      name: meta.name || entry.itemId,
      description: meta.description || '',
      effect: meta.effect || '',
      rarity: meta.rarity || 'common',
    }
  })
  return {
    inventory,
    activeEffects: save.activeEffects,
    traceReductionPassive: save.traceReductionPassive,
  }
}

export function useDemoItem(itemId) {
  const save = loadDemoSave()
  const inv = save.inventory.find((e) => e.itemId === itemId)
  const tr = getTranslator(getLocale())
  if (!inv) throw new Error(tr('errors.marketNotInInventory'))

  const item = DEMO_MARKET_ITEMS.find((i) => i.id === itemId)
  if (!item) throw new Error(tr('errors.marketNotFound'))

  const output = [tx('inventory.demoUse', { name: item.name })]

  if (item.effect_type === 'reduce_trace') {
    const result = reduceTrace(save, item.effect_value)
    output.push(...result.output)
  } else if (item.effect_type === 'trace_halved') {
    save.activeEffects.push({ type: 'trace_halved', usesLeft: item.effect_value, label: item.name })
    output.push(tx('inventory.jammerActive', { count: item.effect_value }))
  }

  if (inv.quantity <= 1) {
    save.inventory = save.inventory.filter((e) => e.itemId !== itemId)
  } else {
    inv.quantity -= 1
  }

  saveDemoSave(save)
  return {
    message: output[output.length - 1],
    output,
    state: toPublicState(save),
    inventory: getDemoInventory(),
  }
}
