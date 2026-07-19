import { WEAPON_FAMILIES, ARMOR_ARCHETYPES, MATERIAL_TIERS } from '../../../../js/engine/shared/data/EquipmentData.js';

// ───────────────────────────────────────────────────────────────────────────
// Equipment Scenario Generator
//
// Generates a parametric matrix covering:
//   weapon_family × material × armor_archetype
//
// Coverage per test matrix (Section 4.2):
//   E.1  Weapon scaling        — family × material
//   E.2  Weapon speed trade-offs — dagger vs broadsword vs battle_axe
//   E.3  Armor mitigation      — plate vs leather vs robes
//   E.4  Equipment affixes     — vampire (lifesteal) vs phoenix (survive death)
//   E.5  Enemy equipment       — naked vs equipped same template
//   E.6  Level requirements    — hero Lv1 with Lv5 mythril weapon (knownFailure)
// ───────────────────────────────────────────────────────────────────────────

const WEAPON_FAMILIES_LIST = ['dagger', 'broadsword', 'battle_axe'];
const MATERIALS_LIST = ['wooden', 'iron', 'steel'];
const ARMOR_ARCHETYPES_LIST = ['plate', 'leather', 'robes'];

// ───────────────────────────────────────────────────────────────────────────
// Party builders
// ───────────────────────────────────────────────────────────────────────────

function createEquippedHero(weaponFamily, material, armorArchetype, options = {}) {
  const { name, level = 5, affixes = [], extraEquipment = [] } = options;

  const equipment = [
    `weapon:${material}:${weaponFamily}`,
    `armor:${material}:${armorArchetype}:body`,
    ...extraEquipment
  ];

  // If affixes requested, we need full object form (string shorthand doesn't support affixes)
  const equipArray = equipment.map(desc => {
    if (typeof desc === 'string') {
      const parts = desc.split(':');
      if (parts[0] === 'weapon') {
        return { slot: 'leftHand', type: 'weapon', material: parts[1], family: parts[2], level: 0, affixes: [...affixes] };
      }
      if (parts[0] === 'armor') {
        return { slot: parts[3], type: 'armor', material: parts[1], archetype: parts[2], slot: parts[3], level: 0 };
      }
    }
    return desc;
  });

  return {
    origin: 'origin_warrior',
    level,
    name: name || `Warrior ${weaponFamily}/${material}/${armorArchetype}`,
    stats: {
      baseMaxHp: 80,
      baseMaxMp: 20,
      baseStrength: 15,
      baseSpeed: 8,
      baseDefense: 8,
      baseMagicPower: 4
    },
    equipment: equipArray,
    skills: ['single_strike'],
    gambits: [
      {
        id: 'gambit_always_attack',
        conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
        action: { type: 'skill', payload: 'single_strike' },
        target: 'lowest_hp_enemy',
        enabled: true
      }
    ]
  };
}

function createNakedHero(options = {}) {
  const { name, level = 5 } = options;
  return {
    origin: 'origin_warrior',
    level,
    name: name || 'Warrior Naked',
    stats: {
      baseMaxHp: 80,
      baseMaxMp: 20,
      baseStrength: 15,
      baseSpeed: 8,
      baseDefense: 8,
      baseMagicPower: 4
    },
    skills: ['single_strike'],
    gambits: [
      {
        id: 'gambit_always_attack',
        conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
        action: { type: 'skill', payload: 'single_strike' },
        target: 'lowest_hp_enemy',
        enabled: true
      }
    ]
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Encounter builder
// ───────────────────────────────────────────────────────────────────────────

function getEncounter(enemyLevel = 3) {
  return { enemies: [{ id: 'goblin_grunt', count: 1, level: enemyLevel }] };
}

function getEncounterWithEquipment(equipped = false) {
  // Enemy equipment not fully modeled in builder; we use stat multipliers instead
  const entry = { id: 'goblin_grunt', count: 1, level: 3 };
  if (equipped) {
    entry.statMultiplier = 1.3; // simulate equipped enemy being tougher
  }
  return { enemies: [entry] };
}

// ───────────────────────────────────────────────────────────────────────────
// Expected damage helpers
// ───────────────────────────────────────────────────────────────────────────

function expectedMinDamage(weaponFamily, material) {
  // Empirically calibrated from lab runs against goblin_grunt Lv3
  // Dagger: wooden~20, iron~22, steel~25
  // Broadsword: wooden~22, iron~27, steel~30
  // Battle_axe: wooden~23, iron~28, steel~34
  const familyBase = { dagger: 18, broadsword: 20, battle_axe: 21 };
  const materialBonus = { wooden: 0, iron: 4, steel: 8 };
  const base = familyBase[weaponFamily] + materialBonus[material];
  return Math.max(5, Math.floor(base * 0.6)); // 60% floor for variance
}

function expectedMaxDamage(weaponFamily, material) {
  const familyBase = { dagger: 18, broadsword: 20, battle_axe: 21 };
  const materialBonus = { wooden: 0, iron: 4, steel: 8 };
  const base = familyBase[weaponFamily] + materialBonus[material];
  return Math.max(10, Math.floor(base * 2.0)); // generous upper bound
}

// ───────────────────────────────────────────────────────────────────────────
// Generator
// ───────────────────────────────────────────────────────────────────────────

export function generate() {
  const scenarios = [];

  // ── E.1: Weapon scaling (family × material) ───────────────────────────
  for (const weaponFamily of WEAPON_FAMILIES_LIST) {
    for (const material of MATERIALS_LIST) {
      const id = `equip_weapon_${weaponFamily}_${material}`;
      const minDmg = expectedMinDamage(weaponFamily, material);
      const maxDmg = expectedMaxDamage(weaponFamily, material);

      scenarios.push({
        id,
        description: `Weapon scaling: ${weaponFamily} (${material}) vs goblin_grunt`,
        tags: ['equipment', 'weapon', 'scaling', 'generated'],
        iterations: 30,
        party: [createEquippedHero(weaponFamily, material, 'leather')],
        encounter: getEncounter(),
        assertions: [
          { metric: 'damage.autoAttack.avgPerHit', expectedMin: minDmg, expectedMax: maxDmg },
          { metric: 'winRate', expectedMin: 0.8 }
        ]
      });
    }
  }

  // ── E.2: Weapon speed trade-offs ──────────────────────────────────────
  // Compare same hero with dagger / broadsword / battle_axe
  for (const weaponFamily of WEAPON_FAMILIES_LIST) {
    const fam = WEAPON_FAMILIES[weaponFamily];
    scenarios.push({
      id: `equip_speed_tradeoff_${weaponFamily}`,
      description: `Speed trade-off: ${weaponFamily} (spdBonus ${fam.spdBonus}, dmgMult ${fam.dmgMult})`,
      tags: ['equipment', 'weapon', 'speed', 'tradeoff', 'generated'],
      iterations: 30,
      party: [createEquippedHero(weaponFamily, 'iron', 'leather')],
      encounter: { enemies: [{ id: 'goblin_grunt', count: 1, level: 3 }] },
      assertions: [
        { metric: 'winRate', expectedMin: 0.8 }
      ]
    });
  }

  // ── E.3: Armor mitigation ─────────────────────────────────────────────
  for (const armorArchetype of ARMOR_ARCHETYPES_LIST) {
    const arch = ARMOR_ARCHETYPES[armorArchetype];
    // Plate should take less physical damage but be slower
    // Robes should take more physical damage but have magic bonuses
    const expectedDamageTakenMax = armorArchetype === 'plate' ? 50 : (armorArchetype === 'robes' ? 120 : 80);

    scenarios.push({
      id: `equip_armor_${armorArchetype}`,
      description: `Armor mitigation: ${armorArchetype} (defMult ${arch.defMult}, spdPenalty ${arch.spdPenalty})`,
      tags: ['equipment', 'armor', 'mitigation', 'generated'],
      iterations: 30,
      party: [createEquippedHero('broadsword', 'iron', armorArchetype)],
      encounter: { enemies: [{ id: 'goblin_grunt', count: 1, level: 3 }] },
      assertions: [
        { metric: 'winRate', expectedMin: 0.8 }
      ]
    });
  }

  // ── E.4: Equipment affixes ────────────────────────────────────────────
  // Vampire affix: should produce healing via lifesteal
  scenarios.push({
    id: 'equip_affix_vampire',
    description: 'Vampire affix: weapon with vampire should produce lifesteal healing',
    tags: ['equipment', 'affix', 'vampire', 'generated'],
    iterations: 30,
    party: [
      createEquippedHero('broadsword', 'iron', 'leather', {
        name: 'Vampire Warrior',
        affixes: ['vampire']
      })
    ],
    encounter: getEncounter(),
    assertions: [
      { metric: 'healing.total', expectedMin: 1 },
      { metric: 'winRate', expectedMin: 0.8 }
    ]
  });

  // Phoenix affix: should survive lethal blow once
  scenarios.push({
    id: 'equip_affix_phoenix',
    description: 'Phoenix affix: armor with phoenix should allow surviving lethal damage once',
    tags: ['equipment', 'affix', 'phoenix', 'generated'],
    iterations: 30,
    party: [
      createEquippedHero('broadsword', 'iron', 'plate', {
        name: 'Phoenix Warrior',
        affixes: ['phoenix']
      })
    ],
    encounter: { enemies: [{ id: 'goblin_brute', count: 1, level: 5 }] },
    assertions: [
      { metric: 'winRate', expectedMin: 0.3 }
    ]
  });

  // ── E.5: Enemy equipment (naked vs equipped via stat multiplier) ──────
  scenarios.push({
    id: 'equip_enemy_naked',
    description: 'Enemy without equipment (baseline)',
    tags: ['equipment', 'enemy', 'generated'],
    iterations: 30,
    party: [createNakedHero({ name: 'Baseline Warrior' })],
    encounter: getEncounterWithEquipment(false),
    assertions: [
      { metric: 'winRate', expectedMin: 0.8 }
    ]
  });

  scenarios.push({
    id: 'equip_enemy_equipped',
    description: 'Enemy with simulated equipment (higher stats)',
    tags: ['equipment', 'enemy', 'generated'],
    iterations: 30,
    party: [createNakedHero({ name: 'Baseline Warrior' })],
    encounter: getEncounterWithEquipment(true),
    assertions: [
      // Equipped enemy should be harder; win rate may drop but shouldn't be impossible
      { metric: 'winRate', expectedMin: 0.3 }
    ]
  });

  // ── E.6: Level requirements ───────────────────────────────────────────
  scenarios.push({
    id: 'equip_level_req_mythril',
    description: 'Level 1 hero with level-5 mythril weapon (should still equip but may be unbalanced)',
    tags: ['equipment', 'level_req', 'generated'],
    knownFailure: true,
    knownFailureReason: 'Level requirements for equipment are not enforced in builder; this scenario documents the gap.',
    iterations: 20,
    party: [
      createEquippedHero('broadsword', 'mythril', 'leather', { level: 1, name: 'Lowbie Mythril' })
    ],
    encounter: getEncounter(1),
    assertions: [
      { metric: 'damage.autoAttack.avgPerHit', expectedMin: 15 },
      { metric: 'winRate', expectedMin: 0.9 }
    ]
  });

  return scenarios;
}

export default generate;
