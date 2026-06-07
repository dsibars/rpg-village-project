/**
 * Game state manipulation via page.evaluate().
 *
 * v1 exposes `window.engine` natively.
 * v2 exposes `window.__ENGINE__` after the patch in ux/main.js.
 *
 * CRITICAL: v2 service APIs differ from v1. This module abstracts those
 * differences so flows can remain version-agnostic.
 */

export function getEngineScript(version) {
  return version === 'v1' ? 'window.engine' : 'window.__ENGINE__'
}

export async function injectHero(page, version, heroOptions) {
  const engineExpr = getEngineScript(version)
  return page.evaluate(
    ({ engineExpr, opts, isV2 }) => {
      const getEngine = new Function(`return ${engineExpr}`)
      const e = getEngine()
      if (!e?.heroService?.add) return false

      // v2 uses 'origin' (e.g. 'origin_warrior'); v1 may use 'class'
      const heroData = isV2
        ? { ...opts, origin: opts.origin || opts.class || 'origin_warrior' }
        : opts

      e.heroService.add(heroData)
      if (e.heroService.saveAll) e.heroService.saveAll()
      return true
    },
    { engineExpr, opts: heroOptions, isV2: version === 'v2' }
  )
}

export async function injectBattle(page, version, battleOptions) {
  const engineExpr = getEngineScript(version)
  return page.evaluate(
    ({ engineExpr, opts, isV2 }) => {
      const getEngine = new Function(`return ${engineExpr}`)
      const e = getEngine()
      if (!e?.battleService) return false

      if (isV2) {
        // v2: build proper Hero / Enemy instances and call startBattle
        const heroes = []
        for (const heroId of opts.heroes || []) {
          let h = e.heroService.get(heroId)
          // Fallback: find by name if ID lookup fails
          if (!h && e.heroService.heroes) {
            h = e.heroService.heroes.find(hero => hero.name === heroId || hero.id === heroId)
          }
          if (h) heroes.push(h)
        }
        if (heroes.length === 0) return false

        const enemies = []
        for (const en of opts.enemies || []) {
          const count = en.count || 1
          for (let i = 0; i < count; i++) {
            if (e.expeditionService?._createEnemy) {
              enemies.push(e.expeditionService._createEnemy(en.id, false, en.level || 1))
            } else {
              // Manual fallback if _createEnemy is unavailable
              const templates = e.expeditionService?.getEnemyTemplates?.() || {}
              const t = templates[en.id] || templates['slime_green'] || { name: 'Slime', maxHp: 20, strength: 5, speed: 3, defense: 2, type: 'slime', skills: { basic_attack: 0 } }
              enemies.push({
                id: crypto.randomUUID(),
                templateId: en.id,
                name: t.name,
                type: t.type || 'slime',
                level: en.level || 1,
                maxHp: t.maxHp || 20,
                hp: t.maxHp || 20,
                maxMp: t.maxMp || 5,
                mp: t.maxMp || 5,
                strength: t.strength || 5,
                speed: t.speed || 3,
                defense: t.defense || 2,
                magicPower: t.magicPower || 1,
                element: t.element || 'neutral',
                skills: t.skills || { basic_attack: 0 },
                isBoss: false,
                isElite: false,
                eliteTier: 0,
                statusEffects: [],
                toJSON() { return { ...this } }
              })
            }
          }
        }

        e.battleService.startBattle(heroes, enemies, false)
        return true
      }

      // v1
      if (e.battleService.start) {
        e.battleService.start(opts)
      }
      return true
    },
    { engineExpr, opts: battleOptions, isV2: version === 'v2' }
  )
}

export async function addInventoryItem(page, version, item) {
  const engineExpr = getEngineScript(version)
  return page.evaluate(
    ({ engineExpr, itemOpts, isV2 }) => {
      const getEngine = new Function(`return ${engineExpr}`)
      const e = getEngine()
      if (!e?.inventoryService) return false

      if (itemOpts.type === 'equipment') {
        if (e.inventoryService.addEquipment) {
          // v2 signature: addEquipment(item, maxStorage)
          e.inventoryService.addEquipment(itemOpts, Infinity)
        }
      } else {
        // v2 signature: addItem(id, count, maxStorage)
        if (isV2 && e.inventoryService.addItem) {
          e.inventoryService.addItem(itemOpts.id, itemOpts.quantity || 1, Infinity)
        } else if (e.inventoryService.addItem) {
          e.inventoryService.addItem(itemOpts.id, itemOpts.quantity || 1)
        }
      }
      if (e.inventoryService.save) e.inventoryService.save()
      return true
    },
    { engineExpr, itemOpts: item, isV2: version === 'v2' }
  )
}

export async function triggerNextDay(page, version) {
  const engineExpr = getEngineScript(version)
  return page.evaluate(({ engineExpr }) => {
    const getEngine = new Function(`return ${engineExpr}`)
    const e = getEngine()
    if (!e?.nextDay) return false
    e.nextDay()
    return true
  }, { engineExpr })
}

export async function setStorageFull(page, version, ratio = 0.95) {
  const engineExpr = getEngineScript(version)
  return page.evaluate(
    ({ engineExpr, r, isV2 }) => {
      const getEngine = new Function(`return ${engineExpr}`)
      const e = getEngine()
      if (!e?.inventoryService) return false

      const max = e.villageService?.getMaxStorage?.() || 100
      const target = Math.floor(max * r)
      const current = e.inventoryService.getTotalStorageUsed?.() || 0

      if (current < target) {
        const toAdd = target - current
        if (isV2 && e.inventoryService.addItem) {
          e.inventoryService.addItem('material_wood', toAdd, Infinity)
        } else if (e.inventoryService.addItem) {
          e.inventoryService.addItem('material_wood', toAdd)
        }
      }
      if (e.inventoryService.save) e.inventoryService.save()
      return true
    },
    { engineExpr, r: ratio, isV2: version === 'v2' }
  )
}

export async function refreshUI(page, version) {
  const engineExpr = getEngineScript(version)
  await page.evaluate(({ engineExpr, isV1 }) => {
    const getEngine = new Function(`return ${engineExpr}`)
    const e = getEngine()
    if (isV1 && window.ui?.update) {
      window.ui.update(e.update())
      return true
    }
    if (e?.update) {
      e.update()
    }
    return true
  }, { engineExpr, isV1: version === 'v1' })

  // v2's game loop runs every 100 ms; give it time to pick up mutations.
  if (version === 'v2') {
    await page.waitForTimeout(400)
  }
}
