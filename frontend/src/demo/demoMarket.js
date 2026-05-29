/**
 * Black Market simulé pour le mode démo.
 */

import { loadDemoSave, saveDemoSave } from './demoStorage'
import { toPublicState } from './demoState'

export const DEMO_MARKET_ITEMS = [
  {
    id: 'firewall_jetable', name: 'Firewall Jetable', price: 30, rarity: 'common',
    description: 'Barrière réseau éphémère.', effect: 'Réduit la TRACE de 15 pts.',
    type: 'consumable', effect_type: 'reduce_trace', effect_value: 15, can_buy: true,
  },
  {
    id: 'proxy_fantome', name: 'Proxy Fantôme', price: 50, rarity: 'uncommon',
    description: 'Relais anonyme instable.', effect: 'Réduit la TRACE de 25 pts.',
    type: 'consumable', effect_type: 'reduce_trace', effect_value: 25, can_buy: true,
  },
  {
    id: 'brouilleur_nova', name: 'Brouilleur N0VA', price: 75, rarity: 'rare',
    description: 'Atténue les signaux de traçage.', effect: '2 traces réduites de moitié.',
    type: 'consumable', effect_type: 'trace_halved', effect_value: 2, can_buy: true,
  },
  {
    id: 'prog_netscan', name: 'NetScan v2.1', price: 35, rarity: 'common', isProgram: true,
    programId: 'netscan', description: 'Analyseur réseau portable.',
    effect: 'Télécharge netscan.exe', type: 'program', can_buy: true,
  },
  {
    id: 'prog_trace_wiper', name: 'Trace Wiper Pro', price: 40, rarity: 'common', isProgram: true,
    programId: 'trace_wiper', description: 'Effaceur de signatures.',
    effect: 'Télécharge trace_wiper.exe', type: 'program', can_buy: true,
  },
  {
    id: 'pack_firewall_basique', name: 'Pack Firewall Basique', price: 120, rarity: 'legendary',
    description: 'Suite défensive permanente.', effect: 'Passif -5% TRACE permanent.',
    type: 'passive', effect_type: 'passive_reduction', effect_value: 5, can_buy: true,
  },
]

export function getDemoMarket() {
  const save = loadDemoSave()
  const ownedPassive = save.traceReductionPassive >= 5
  const items = DEMO_MARKET_ITEMS.map((item) => ({
    ...item,
    name: item.id === 'brouilleur_nova' && !save.novaIntroSeen
      ? 'Brouilleur de signal'
      : item.name,
    can_buy: item.type === 'passive' && ownedPassive ? false : true,
    owned_passive: item.type === 'passive' && ownedPassive,
  }))
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
  if (!item) throw new Error('Objet introuvable')
  if (save.player.bittek < item.price) throw new Error('BitTek insuffisant')

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

  saveDemoSave(save)
  return {
    message: `[DEMO MARKET] Achat : ${item.name} (-${item.price} BitTek)`,
    state: toPublicState(save),
    inventory: getDemoInventory(),
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
  if (!inv) throw new Error('Objet absent de l\'inventaire')

  const item = DEMO_MARKET_ITEMS.find((i) => i.id === itemId)
  if (!item) throw new Error('Objet introuvable')

  const output = [`[DEMO INV] Utilisation : ${item.name}`]

  if (item.effect_type === 'reduce_trace') {
    const old = save.traceLevel
    save.traceLevel = Math.max(0, save.traceLevel - item.effect_value)
    output.push(`[INV] TRACE : ${old}% → ${save.traceLevel}%`)
  } else if (item.effect_type === 'trace_halved') {
    save.activeEffects.push({ type: 'trace_halved', usesLeft: item.effect_value, label: item.name })
    output.push(`[INV] Brouilleur actif — ${item.effect_value} charges`)
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
