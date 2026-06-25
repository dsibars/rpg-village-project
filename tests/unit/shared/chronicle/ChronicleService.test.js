import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'
import { ChronicleService } from '../../../../js/engine/shared/chronicle/ChronicleService.js'

function createService() {
  const cs = new ChronicleService()
  cs.state = cs._createEmptyState()
  return cs
}

describe('ChronicleService', () => {
  describe('Catalog Registration', () => {
    it('registers an entry with all fields', () => {
      const cs = createService()
      const entry = cs.registerEntry({
        id: 'test_entry',
        labelKey: 'chronicle_test',
        requirementKey: 'chronicle_req_test',
        category: 'combat'
      })
      assert.strictEqual(entry.id, 'test_entry')
      assert.strictEqual(entry.labelKey, 'chronicle_test')
      assert.strictEqual(entry.status, 'locked')
      assert.strictEqual(entry.category, 'combat')
    })

    it('registration is idempotent', () => {
      const cs = createService()
      cs.registerEntry({ id: 'dup', labelKey: 'a', category: 'test' })
      cs.registerEntry({ id: 'dup', labelKey: 'b', category: 'other' })
      const entries = cs.getEntries()
      assert.strictEqual(entries.length, 1)
      assert.strictEqual(entries[0].labelKey, 'a')
    })

    it('registerEntriesFromCatalog bulk registers', () => {
      const cs = createService()
      cs.registerEntriesFromCatalog([
        { id: 'a', labelKey: 'la', category: 'test' },
        { id: 'b', labelKey: 'lb', category: 'test' }
      ])
      assert.strictEqual(cs.getEntries().length, 2)
    })
  })

  describe('unlockEntry', () => {
    it('unlocks an entry and records book link', () => {
      const cs = createService()
      cs.registerEntry({ id: 'hero_1', labelKey: 'chronicle_hero', category: 'hero' })
      const result = cs.unlockEntry('hero_1', 5, { pageSectionId: 's1', pageNumber: 3, chapterNumber: 1 })
      assert.strictEqual(result.status, 'unlocked')
      assert.strictEqual(result.dayUnlocked, 5)
      assert.strictEqual(result.bookLink.pageNumber, 3)
    })

    it('is idempotent — second unlock returns same entry without error', () => {
      const cs = createService()
      cs.registerEntry({ id: 'hero_1', labelKey: 'chronicle_hero', category: 'hero' })
      cs.unlockEntry('hero_1', 5)
      const result = cs.unlockEntry('hero_1', 10)
      assert.strictEqual(result.status, 'unlocked')
      assert.strictEqual(result.dayUnlocked, 5)
    })

    it('auto-registers unknown entries with fallback keys', () => {
      const cs = createService()
      const result = cs.unlockEntry('building_farm_1', 3)
      assert.ok(result)
      assert.strictEqual(result.status, 'unlocked')
      assert.strictEqual(result.labelKey, 'chronicle_building_farm_1')
      assert.strictEqual(result.requirementKey, 'chronicle_req_building_farm_1')
      assert.strictEqual(result.category, 'unlock')
    })

    it('returns null for null/undefined id', () => {
      const cs = createService()
      assert.strictEqual(cs.unlockEntry(null, 1), null)
      assert.strictEqual(cs.unlockEntry(undefined, 1), null)
      assert.strictEqual(cs.unlockEntry('', 1), null)
    })
  })

  describe('getEntries filtering', () => {
    it('filters by status', () => {
      const cs = createService()
      cs.registerEntry({ id: 'a', labelKey: 'la', category: 'test' })
      cs.registerEntry({ id: 'b', labelKey: 'lb', category: 'test' })
      cs.unlockEntry('a', 1)
      const unlocked = cs.getEntries({ status: 'unlocked' })
      assert.strictEqual(unlocked.length, 1)
      assert.strictEqual(unlocked[0].id, 'a')
    })

    it('filters by category', () => {
      const cs = createService()
      cs.registerEntry({ id: 'a', labelKey: 'la', category: 'combat' })
      cs.registerEntry({ id: 'b', labelKey: 'lb', category: 'village' })
      assert.strictEqual(cs.getEntries({ category: 'combat' }).length, 1)
    })

    it('filters by day range', () => {
      const cs = createService()
      cs.registerEntry({ id: 'a', labelKey: 'la', category: 'test' })
      cs.registerEntry({ id: 'b', labelKey: 'lb', category: 'test' })
      cs.unlockEntry('a', 5)
      cs.unlockEntry('b', 10)
      const result = cs.getEntries({ status: 'unlocked', dayMin: 6 })
      assert.strictEqual(result.length, 1)
      assert.strictEqual(result[0].id, 'b')
    })

    it('respects limit', () => {
      const cs = createService()
      for (let i = 0; i < 5; i++) {
        cs.registerEntry({ id: `e${i}`, labelKey: `l${i}`, category: 'test' })
        cs.unlockEntry(`e${i}`, i + 1)
      }
      assert.strictEqual(cs.getEntries({ limit: 2 }).length, 2)
    })
  })

  describe('Migration', () => {
    it('migrates old-format state to empty catalog', () => {
      const cs = createService()
      cs.state = { entries: [{ id: 'old', title: 'Old Entry', day: 1 }], milestones: [] }
      const result = cs._loadState()
      assert.strictEqual(result.catalog.length, 0)
      assert.ok(result.milestones instanceof Set)
    })

    it('preserves new-format state on load', () => {
      const cs = createService()
      cs.state = {
        catalog: [{ id: 'a', labelKey: 'la', requirementKey: 'ra', category: 'test', status: 'unlocked', dayUnlocked: 3 }],
        milestones: new Set(['m1'])
      }
      const entries = cs.getEntries({ status: 'unlocked' })
      assert.strictEqual(entries.length, 1)
      assert.strictEqual(entries[0].dayUnlocked, 3)
    })
  })

  describe('Milestones', () => {
    it('records and checks milestones', () => {
      const cs = createService()
      assert.strictEqual(cs.hasMilestone('m1'), false)
      cs.recordMilestone('m1')
      assert.strictEqual(cs.hasMilestone('m1'), true)
    })

    it('milestones are deduplicated', () => {
      const cs = createService()
      cs.recordMilestone('m1')
      cs.recordMilestone('m1')
      assert.strictEqual(cs.state.milestones.size, 1)
    })
  })

  describe('getStats', () => {
    it('returns correct statistics', () => {
      const cs = createService()
      cs.registerEntry({ id: 'a', labelKey: 'la', category: 'test' })
      cs.registerEntry({ id: 'b', labelKey: 'lb', category: 'test' })
      cs.unlockEntry('a', 1)
      cs.recordMilestone('m1')
      const stats = cs.getStats()
      assert.strictEqual(stats.totalEntries, 2)
      assert.strictEqual(stats.byStatus.unlocked, 1)
      assert.strictEqual(stats.byStatus.locked, 1)
      assert.strictEqual(stats.milestones.length, 1)
    })
  })

  describe('setPending', () => {
    it('sets status to pending', () => {
      const cs = createService()
      cs.registerEntry({ id: 'a', labelKey: 'la', category: 'test' })
      cs.setPending('a')
      assert.strictEqual(cs.getEntries({ status: 'pending' }).length, 1)
    })
  })

  describe('updateBookLink', () => {
    it('updates book link on existing entry', () => {
      const cs = createService()
      cs.registerEntry({ id: 'a', labelKey: 'la', category: 'test' })
      cs.unlockEntry('a', 1)
      cs.updateBookLink('a', { pageNumber: 5 })
      const entry = cs.getEntries({ status: 'unlocked' })[0]
      assert.strictEqual(entry.bookLink.pageNumber, 5)
    })
  })
})
