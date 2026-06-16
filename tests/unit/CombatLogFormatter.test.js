globalThis.localStorage = {
    getItem() { return null; },
    setItem() {},
    removeItem() {},
    clear() {}
};

import test from 'node:test';
import assert from 'node:assert';
import { CombatLogFormatter } from '../../js/engine/shared/combat/CombatLogFormatter.js';

// Minimal i18n mock that supports param replacement
const mockI18n = {
    t(key, params = {}) {
        const dict = {
            combat_log_attack: '{attacker} attacks {target} for {damage} damage!',
            combat_log_miss: '{attacker} missed {target}!',
            combat_log_heal: '{attacker} heals {target} for {amount} HP!',
            combat_log_vamp: '{actor} drains {amount} HP through vampirism.',
            combat_log_regen: '{target} regenerates {amount} HP.',
            combat_log_poison: '{target} takes {damage} poison damage!',
            combat_log_burn: '{target} takes {damage} burn damage!',
            combat_log_status_expired: "{target}'s {effect} wore off.",
            combat_log_target_defeated: '{target} was defeated!',
            combat_log_stamina_regen: '{actor} regenerates {amount} stamina',
            combat_log_victory: 'Victory! Enemies defeated!',
            combat_log_defeat: 'Defeat... The party has fallen...',
            combat_log_stun_skip: '{actor} is stunned and skips their turn!',
            combat_log_sleep_skip: '{actor} is asleep and skips their turn!',
            combat_log_magic_tier_up: "{actor}'s magic tier increased from {fromTier} to {toTier}!",
            combat_log_evolved: "{actor}'s {family} evolved to Tier {tier}!",
            heroes_info_family_power_strike: 'Power Strike',
            combat_log_use_consumable: '{attacker} used {item} on {target}, restoring {amount} {stat}.',
            item_tiny_hp_potion: 'Tiny HP Potion'
        };
        let text = dict[key] || key;
        Object.keys(params).forEach(p => {
            text = text.replace(`{${p}}`, params[p]);
        });
        return text;
    }
};

test('CombatLogFormatter: DAMAGE event', () => {
    const fmt = new CombatLogFormatter(mockI18n);
    const event = {
        type: 'DAMAGE',
        actorName: 'Arthur',
        targetName: 'Goblin',
        amount: 15,
        isMiss: false,
        isCrit: false
    };
    assert.strictEqual(fmt.format(event), 'Arthur attacks Goblin for 15 damage!');
});

test('CombatLogFormatter: DAMAGE miss', () => {
    const fmt = new CombatLogFormatter(mockI18n);
    const event = {
        type: 'DAMAGE',
        actorName: 'Arthur',
        targetName: 'Goblin',
        isMiss: true
    };
    assert.strictEqual(fmt.format(event), 'Arthur missed Goblin!');
});

test('CombatLogFormatter: DAMAGE crit + defeated', () => {
    const fmt = new CombatLogFormatter(mockI18n);
    const event = {
        type: 'DAMAGE',
        actorName: 'Arthur',
        targetName: 'Goblin',
        amount: 42,
        isMiss: false,
        isCrit: true,
        targetDefeated: true
    };
    assert.strictEqual(fmt.format(event), '💥 Arthur attacks Goblin for 42 damage! Goblin was defeated!');
});

test('CombatLogFormatter: HEAL event', () => {
    const fmt = new CombatLogFormatter(mockI18n);
    const event = {
        type: 'HEAL',
        actorName: 'Mira',
        targetName: 'Arthur',
        amount: 25
    };
    assert.strictEqual(fmt.format(event), 'Mira heals Arthur for 25 HP!');
});

test('CombatLogFormatter: VAMP event', () => {
    const fmt = new CombatLogFormatter(mockI18n);
    const event = {
        type: 'VAMP',
        actorName: 'Arthur',
        amount: 8
    };
    assert.strictEqual(fmt.format(event), 'Arthur drains 8 HP through vampirism.');
});

test('CombatLogFormatter: TRAIT_REGEN event', () => {
    const fmt = new CombatLogFormatter(mockI18n);
    const event = {
        type: 'TRAIT_REGEN',
        targetName: 'Arthur',
        amount: 5
    };
    assert.strictEqual(fmt.format(event), 'Arthur regenerates 5 HP.');
});

test('CombatLogFormatter: STATUS_TICK poison', () => {
    const fmt = new CombatLogFormatter(mockI18n);
    const event = {
        type: 'STATUS_TICK',
        effectType: 'poison',
        damage: 3,
        targetName: 'Goblin'
    };
    assert.strictEqual(fmt.format(event), 'Goblin takes 3 poison damage!');
});

test('CombatLogFormatter: STATUS_TICK burn', () => {
    const fmt = new CombatLogFormatter(mockI18n);
    const event = {
        type: 'STATUS_TICK',
        effectType: 'burn',
        damage: 4,
        targetName: 'Arthur'
    };
    assert.strictEqual(fmt.format(event), 'Arthur takes 4 burn damage!');
});

test('CombatLogFormatter: STATUS_TICK unknown effect', () => {
    const fmt = new CombatLogFormatter(mockI18n);
    const event = {
        type: 'STATUS_TICK',
        effectType: 'frost',
        damage: 2,
        targetName: 'Arthur'
    };
    assert.strictEqual(fmt.format(event), 'Arthur takes 2 frost damage.');
});

test('CombatLogFormatter: STATUS_EXPIRED event', () => {
    const fmt = new CombatLogFormatter(mockI18n);
    const event = {
        type: 'STATUS_EXPIRED',
        effectType: 'haste',
        targetName: 'Arthur'
    };
    assert.strictEqual(fmt.format(event), "Arthur's haste wore off.");
});

test('CombatLogFormatter: USE_CONSUMABLE event', () => {
    const fmt = new CombatLogFormatter(mockI18n);
    const event = {
        type: 'USE_CONSUMABLE',
        actorName: 'Arthur',
        targetName: 'Arthur',
        consumableId: 'item_tiny_hp_potion',
        healType: 'HEAL_HP',
        amount: 20
    };
    assert.strictEqual(fmt.format(event), 'Arthur used Tiny HP Potion on Arthur, restoring 20 HP.');
});

test('CombatLogFormatter: unknown event type fallback', () => {
    const fmt = new CombatLogFormatter(mockI18n);
    const event = { type: 'MYSTERY', foo: 'bar' };
    assert.strictEqual(fmt.format(event), '[MYSTERY] {"type":"MYSTERY","foo":"bar"}');
});

test('CombatLogFormatter: STAMINA_REGEN event', () => {
    const fmt = new CombatLogFormatter(mockI18n);
    const event = {
        type: 'STAMINA_REGEN',
        actorName: 'Arthur',
        amount: 15
    };
    assert.strictEqual(fmt.format(event), 'Arthur regenerates 15 stamina');
});

test('CombatLogFormatter: VICTORY event', () => {
    const fmt = new CombatLogFormatter(mockI18n);
    const event = { type: 'VICTORY' };
    assert.strictEqual(fmt.format(event), 'Victory! Enemies defeated!');
});

test('CombatLogFormatter: DEFEAT event', () => {
    const fmt = new CombatLogFormatter(mockI18n);
    const event = { type: 'DEFEAT' };
    assert.strictEqual(fmt.format(event), 'Defeat... The party has fallen...');
});

test('CombatLogFormatter: STUN_SKIP event', () => {
    const fmt = new CombatLogFormatter(mockI18n);
    const event = {
        type: 'STUN_SKIP',
        actorName: 'Arthur'
    };
    assert.strictEqual(fmt.format(event), 'Arthur is stunned and skips their turn!');
});

test('CombatLogFormatter: SLEEP_SKIP event', () => {
    const fmt = new CombatLogFormatter(mockI18n);
    const event = {
        type: 'SLEEP_SKIP',
        actorName: 'Arthur'
    };
    assert.strictEqual(fmt.format(event), 'Arthur is asleep and skips their turn!');
});

test('CombatLogFormatter: MAGIC_TIER_UP event', () => {
    const fmt = new CombatLogFormatter(mockI18n);
    const event = {
        type: 'MAGIC_TIER_UP',
        actorName: 'Arthur',
        fromTier: 1,
        toTier: 2
    };
    assert.strictEqual(fmt.format(event), "Arthur's magic tier increased from 1 to 2!");
});

test('CombatLogFormatter: TECHNIQUE_EVOLVED event', () => {
    const fmt = new CombatLogFormatter(mockI18n);
    const event = {
        type: 'TECHNIQUE_EVOLVED',
        actorName: 'Arthur',
        family: 'power_strike',
        tier: 2
    };
    assert.strictEqual(fmt.format(event), "Arthur's Power Strike evolved to Tier 2!");
});

test('CombatLogFormatter: non-object input fallback', () => {
    const fmt = new CombatLogFormatter(mockI18n);
    assert.strictEqual(fmt.format(null), 'null');
    assert.strictEqual(fmt.format('raw string'), 'raw string');
    assert.strictEqual(fmt.format(42), '42');
});
