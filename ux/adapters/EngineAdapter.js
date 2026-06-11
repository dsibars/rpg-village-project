import { showToast } from '../core/toast.js'
import { getPresentationById } from '../../js/engine/shared/data/PresentationCatalog.js'

/**
 * Generates a success feedback toast message for adapter actions.
 * Keeps the dispatch function clean and centralizes user feedback text.
 */
function getSuccessToast(i18n, domain, action, payload, data) {
  if (!i18n) return null

  switch (true) {
    case domain === 'hero' && action === 'recruit': {
      const hero = data?.hero
      const cost = data?.cost
      if (hero) {
        return i18n.t('heroes_uxelm_recruit_success') + ' ' + hero.name + '! (-' + cost + 'g)'
      }
      return null
    }

    case domain === 'hero' && action === 'useConsumable': {
      const { hero, amountRestored, type } = data || {}
      if (hero) {
        const statLabel = type === 'HEAL_HP'
          ? i18n.t('shared_uxelm_stat_hp')
          : i18n.t('shared_uxelm_stat_mp')
        return i18n.t('shared_uxelm_toast_consumable_used', { hero: hero.name, amount: amountRestored, stat: statLabel })
      }
      return null
    }

    case domain === 'gambit' && action === 'suggestPreset': {
      const count = data?.addedCount || 0
      const presetName = i18n.t(data?.presetId)
      return i18n.t('shared_uxelm_toast_preset_applied', { preset: presetName, count })
    }

    case domain === 'shop' && action === 'sellItem': {
      return i18n.t('shared_uxelm_toast_gold_earned', { amount: data?.goldEarned })
    }

    case domain === 'shop' && action === 'sellResource': {
      const resName = i18n.t(payload?.resourceId)
      return i18n.t('shared_uxelm_toast_resource_sold', {
        amount: data?.goldEarned,
        count: data?.sold,
        resource: resName
      })
    }

    case domain === 'inventory' && action === 'cookMeal': {
      return i18n.t('inventory_uxelm_cooked') + ' ' + i18n.t(payload?.recipeId)
    }

    case domain === 'inventory' && action === 'consumeMeal': {
      return i18n.t('inventory_uxelm_fed') + ' ' + data?.fedCount + ' ' + i18n.t('heroes_uxelm_heroes')
    }

    case (domain === 'inventory' || domain === 'hero') && action === 'useGlyphTablet': {
      const glyphId = data?.glyphId
      const hero = data?.hero
      if (hero && glyphId) {
        const transGlyph = i18n.t('magic_circle_info_' + glyphId)
        return i18n.t('shared_uxelm_toast_glyph_learned', { hero: hero.name, glyph: transGlyph })
      }
      return null
    }

    case domain === 'daily' && action === 'pickObjectives': {
      return i18n.t('daily_uxelm_toast_picked')
    }

    case domain === 'daily' && action === 'claimReward': {
      const reward = data?.reward
      if (reward) {
        const parts = []
        if (reward.gold) parts.push(`${reward.gold}g`)
        if (reward.material_wood) parts.push(`${reward.material_wood} wood`)
        if (reward.material_stone) parts.push(`${reward.material_stone} stone`)
        if (reward.material_iron) parts.push(`${reward.material_iron} iron`)
        return i18n.t('daily_uxelm_toast_reward_claimed', { rewards: parts.join(', ') })
      }
      return null
    }

    default:
      return null
  }
}

const ACTION_MAP = {
  hero: {
    recruit: (engine) => engine.recruitHero(),
    increaseStat: (engine, p) => engine.increaseHeroStat(p.heroId, p.statId),
    learnFamily: (engine, p) => engine.learnHeroFamily(p.heroId, p.familyId),
    equipItem: (engine, p) => engine.equipHeroItem(p.heroId, p.slot, p.equipmentId),
    unequipItem: (engine, p) => engine.unequipHeroItem(p.heroId, p.slot),
    useConsumable: (engine, p) => engine.useHeroConsumable(p.heroId, p.consumableId),
    inscribeBodyCircle: (engine, p) => engine.inscribeHeroBodyCircle(p.heroId, p.glyphIds, p.glyphTiers),
    inscribeSpell: (engine, p) => engine.inscribeHeroSpell(p.heroId, p.spell),
    eraseBodyCircle: (engine, p) => engine.eraseHeroBodyCircle(p.heroId),
    useGlyphTablet: (engine, p) => engine.useGlyphTablet(p.heroId, p.tabletId),
    assignDefense: (engine, p) => engine.assignDefense(p.heroId),
    unassignDefense: (engine, p) => engine.unassignDefense(p.heroId),
    evaluateTitles: (engine, p) => engine.evaluateHeroTitles(p.heroId)
  },
  gambit: {
    addGambit: (engine, p) => engine.addHeroGambit(p.heroId, p.gambit),
    removeGambit: (engine, p) => engine.removeHeroGambit(p.heroId, p.gambitId),
    toggleGambit: (engine, p) => engine.toggleHeroGambit(p.heroId, p.gambitId),
    moveGambit: (engine, p) => engine.moveHeroGambit(p.heroId, p.gambitId, p.direction),
    updateFallbackAction: (engine, p) => engine.updateHeroFallbackAction(p.heroId, p.action),
    testGambits: (engine, p) => engine.testHeroGambits(p.heroId, p.enemies),
    suggestPreset: (engine, p) => engine.suggestHeroGambitPreset(p.heroId)
  },
  village: {
    setWorkerRole: (engine, p) => engine.setWorkerRole(p.role, p.delta),
    assignDefense: (engine, p) => engine.assignDefense(p.heroId),
    unassignDefense: (engine, p) => engine.unassignDefense(p.heroId)
  },
  buildings: {
    startProject: (engine, p) => engine.startProject(p.buildingId, p.targetLevel, p.costGold, p.costMaterials, p.duration)
  },
  explore: {
    assignExpedition: (engine, p) => engine.assignExpedition(p.expId, p.heroIds),
    retireExpedition: (engine, p) => engine.retireExpedition(p.expId)
  },
  shop: {
    buyItem: (engine, p) => engine.buyItem(p.itemData, p.costGold),
    sellItem: (engine, p) => engine.sellItem(p.itemId, p.itemType, p.sellPrice),
    sellResource: (engine, p) => engine.sellResource(p.resourceId, p.quantity)
  },
  inventory: {
    cookMeal: (engine, p) => engine.cookMeal(p.recipeId),
    consumeMeal: (engine, p) => engine.consumeMeal(p.mealId),
    useGlyphTablet: (engine, p) => engine.useGlyphTablet(p.heroId, p.tabletId)
  },
  forge: {
    refineItem: (engine, p) => engine.refineEquipment(p.itemId)
  },
  daily: {
    pickObjectives: (engine, p) => engine.dailyObjectivesService.pickObjectives(p.objectiveIds),
    claimReward: (engine, p) => engine.dailyObjectivesService.claimReward(p.objectiveId)
  },
  combat: {
    nextTurn: (engine) => engine.nextBattleTurn(),
    executeAction: (engine, p) => engine.executeBattleAction(p.skillId, p.targetIndex, p.tier),
    executeSpell: (engine, p) => engine.executeBattleSpell(p.spellIndex, p.targetIndex),
    useConsumable: (engine, p) => engine.useBattleConsumable(p.consumableId, p.targetId),
    defend: (engine, p) => engine.heroDefend(p.heroId),
    skip: (engine) => engine.skipBattle(),
    toggleAuto: (engine) => engine.toggleAutoBattle()
  },
  settings: {
    devCheatActivate: (engine) => engine.activateDeveloperCheat(),
    wipeSlot: (engine) => engine.wipeCurrentSlot(),
    wipeAll: (engine) => engine.wipeAllSlots(),
    getCurrentSlotIndex: (engine) => ({ success: true, data: { index: engine.getCurrentSlotIndex() || 0 } })
  },
  presentation: {
    getNext: (engine) => {
      const ps = engine?.presentationService
      if (!ps) return { success: false, error: 'no_presentation_service' }
      const id = ps.popNextPresentation()
      if (!id) return { success: false, error: 'no_pending_presentations' }
      const pres = getPresentationById(id)
      return { success: true, data: { id, presentation: pres } }
    },
    hasPending: (engine) => {
      const ps = engine?.presentationService
      return { success: true, data: ps?.hasPendingPresentations?.() || false }
    },
    markAsSeen: (engine, p) => {
      const ps = engine?.presentationService
      if (!ps) return { success: false, error: 'no_presentation_service' }
      const day = engine?.villageService?.getState?.()?.day ?? null
      ps.markAsSeen(p.presentationId, day)
      engine?._persistPresentationState?.()
      return { success: true }
    },
    replay: (engine, p) => {
      const ps = engine?.presentationService
      if (!ps) return { success: false, error: 'no_presentation_service' }
      const pres = ps.replayPresentation(p.presentationId)
      return { success: !!pres, data: pres }
    }
  }
}

export function createEngineAdapter(engine, gameStateRef) {
  return {
    dispatch(domain, action, payload) {
      const handler = ACTION_MAP[domain]?.[action]
      if (!handler) {
        console.error(`Unknown action: ${domain}.${action}`)
        return { success: false, error: 'action_unknown' }
      }

      let result
      try {
        result = handler(engine, payload)
      } catch (err) {
        console.error(`Engine error on ${domain}.${action}:`, err)
        return { success: false, error: 'engine_error' }
      }

      // Engine methods return either a Result object or raw data
      // Normalize to { success, error } shape
      const normalized = result && typeof result.success === 'boolean'
        ? result
        : { success: true, data: result }

      if (!normalized.success) {
        const message = engine.i18n?.t(normalized.error) || normalized.error || 'Action failed'
        showToast(message, 'error')
      } else {
        const toastMessage = getSuccessToast(engine.i18n, domain, action, payload, normalized.data)
        if (toastMessage) {
          showToast(toastMessage, 'success')
        }
      }

      // Force a state snapshot after the action.
      // engine.update() is non-idempotent (see architecture doc §6.3), but this is correct here:
      // the action just mutated engine state, and we need Vue to see the change
      // immediately (not wait for the next 100ms loop tick).
      if (gameStateRef) {
        gameStateRef.value = engine.update()
      }

      return normalized
    }
  }
}
