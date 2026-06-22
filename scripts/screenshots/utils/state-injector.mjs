/**
 * Game state manipulation via page.evaluate().
 *
 * The app exposes `window.__ENGINE__` in ux/main.js.
 */

const ENGINE_EXPR = 'window.__ENGINE__'

export async function injectHero(page, heroOptions) {
  return page.evaluate(
    ({ opts }) => {
      const e = window.__ENGINE__
      if (!e?.heroService?.add) return false

      const heroData = { ...opts, origin: opts.origin || opts.class || 'origin_warrior' }
      e.heroService.add(heroData)
      if (e.heroService.saveAll) e.heroService.saveAll()
      return true
    },
    { opts: heroOptions }
  )
}

export async function injectBattle(page, battleOptions) {
  return page.evaluate(
    ({ opts }) => {
      const e = window.__ENGINE__
      if (!e?.battleService) return false

      const heroes = []
      for (const heroId of opts.heroes || []) {
        let h = e.heroService.get(heroId)
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
    },
    { opts: battleOptions }
  )
}

export async function addInventoryItem(page, item) {
  return page.evaluate(
    ({ itemOpts }) => {
      const e = window.__ENGINE__
      if (!e?.inventoryService) return false

      const isEquipment = itemOpts.inventoryType === 'equipment' || itemOpts.type === 'equipment'
      if (isEquipment) {
        if (e.inventoryService.addEquipment) {
          // Strip the inventory routing key so Equipment gets the real type
          const { inventoryType, ...equipmentData } = itemOpts
          e.inventoryService.addEquipment(equipmentData, Infinity)
        }
      } else {
        if (e.inventoryService.addItem) {
          e.inventoryService.addItem(itemOpts.id, itemOpts.quantity || 1, Infinity)
        }
      }
      if (e.inventoryService.save) e.inventoryService.save()
      return true
    },
    { itemOpts: item }
  )
}

export async function triggerNextDay(page) {
  return page.evaluate(() => {
    const e = window.__ENGINE__
    if (!e?.nextDay) return false
    e.nextDay()
    return true
  })
}

export async function setStorageFull(page, ratio = 0.95) {
  return page.evaluate(
    ({ r }) => {
      const e = window.__ENGINE__
      if (!e?.inventoryService) return false

      const max = e.villageService?.getMaxStorage?.() || 100
      const target = Math.floor(max * r)
      const current = e.inventoryService.getTotalStorageUsed?.() || 0

      if (current < target) {
        const toAdd = target - current
        if (e.inventoryService.addItem) {
          e.inventoryService.addItem('material_wood', toAdd, Infinity)
        }
      }
      if (e.inventoryService.save) e.inventoryService.save()
      return true
    },
    { r: ratio }
  )
}

export async function refreshUI(page) {
  await page.evaluate(() => {
    if (typeof window.__REFRESH_UI__ === 'function') {
      window.__REFRESH_UI__()
    } else {
      const e = window.__ENGINE__
      if (e?.update) {
        e.update()
      }
    }
    return true
  })

  // Allow Vue to process the reactive update.
  await page.waitForTimeout(300)
}
