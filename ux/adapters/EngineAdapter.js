import { showToast } from '../core/toast.js'
import { getPresentationById } from '../../js/engine/shared/data/PresentationCatalog.js'

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
  settings: {
    devCheatActivate: (engine) => engine.activateDeveloperCheat()
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
      }

      // Force a state snapshot after the action — matches legacy forceUpdate() behavior.
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
