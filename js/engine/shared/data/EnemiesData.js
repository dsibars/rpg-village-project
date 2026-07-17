/**
 * Enemy Templates — single source of truth for enemy base stats.
 * Mirrors docs/shared/combat/enemies_data.md. Keep both in sync.
 *
 * Consumed by: ExpeditionService (expedition battles), CalendarService (raid power),
 * RegionValidator (enemy reference validation).
 */
export const ENEMY_TEMPLATES = {
    // Tier 1 (Forest & Meadows)
    slime_green: { name: 'Green Slime', type: 'beast', maxHp: 20, strength: 3, defense: 2, speed: 2, element: 'neutral' },
    slime_fire: { name: 'Fire Slime', type: 'beast', maxHp: 30, strength: 5, defense: 3, speed: 3, element: 'fire' },
    slime_earth: { name: 'Earth Slime', type: 'beast', maxHp: 25, strength: 4, defense: 4, speed: 1, element: 'earth' },
    wild_boar: { name: 'Wild Boar', type: 'beast', maxHp: 40, strength: 6, defense: 4, speed: 4, element: 'neutral' },
    rabbit_horned: { name: 'Horned Rabbit', type: 'beast', maxHp: 15, strength: 3, defense: 1, speed: 5, element: 'neutral' },
    goblin_scout: { name: 'Goblin Scout', type: 'humanoid', maxHp: 25, strength: 4, defense: 2, speed: 6, element: 'neutral' },
    goblin_grunt: { name: 'Goblin Grunt', type: 'humanoid', maxHp: 35, strength: 5, defense: 4, speed: 2, element: 'neutral' },
    // Tier 2 (Caves & Coast)
    bat_small: { name: 'Small Bat', type: 'beast', maxHp: 22, strength: 4, defense: 2, speed: 7, element: 'neutral' },
    spider_minor: { name: 'Minor Spider', type: 'beast', maxHp: 28, strength: 5, defense: 3, speed: 4, element: 'neutral' },
    crab_shell: { name: 'Shell Crab', type: 'beast', maxHp: 35, strength: 5, defense: 5, speed: 2, element: 'neutral' },
    water_spirit_minor: { name: 'Minor Water Spirit', type: 'elemental', maxHp: 25, strength: 4, defense: 2, speed: 5, element: 'water' },
    murloc_shore: { name: 'Shore Murloc', type: 'humanoid', maxHp: 30, strength: 5, defense: 3, speed: 4, element: 'water' },
    // Tier 3 (Forest & Camps)
    goblin_brute: { name: 'Goblin Brute', type: 'humanoid', maxHp: 55, strength: 7, defense: 5, speed: 1, element: 'neutral' },
    goblin_shaman: { name: 'Goblin Shaman', type: 'humanoid', maxHp: 40, strength: 5, defense: 3, speed: 5, element: 'storm' },
    goblin_slinger: { name: 'Goblin Slinger', type: 'humanoid', maxHp: 28, strength: 5, defense: 2, speed: 5, element: 'neutral' },
    skeleton_warrior: { name: 'Skeleton Warrior', type: 'undead', maxHp: 35, strength: 5, defense: 3, speed: 3, element: 'neutral' },
    skeleton_archer: { name: 'Skeleton Archer', type: 'undead', maxHp: 30, strength: 7, defense: 2, speed: 5, element: 'neutral' },
    ghost_wisp: { name: 'Ghost Wisp', type: 'undead', maxHp: 20, strength: 3, defense: 1, speed: 8, element: 'wind' },
    wolf_alpha: { name: 'Alpha Wolf', type: 'beast', maxHp: 50, strength: 7, defense: 4, speed: 5, element: 'neutral' },
    zombie_rotter: { name: 'Rotting Zombie', type: 'undead', maxHp: 45, strength: 5, defense: 3, speed: 1, element: 'neutral' },
    // Tier 4 (Ruins, Peaks & Library)
    ice_elemental: { name: 'Ice Elemental', type: 'elemental', maxHp: 45, strength: 6, defense: 5, speed: 2, element: 'water' },
    young_drake: { name: 'Young Drake', type: 'dragon', maxHp: 70, strength: 8, defense: 6, speed: 4, element: 'fire' },
    frost_wolf: { name: 'Frost Wolf', type: 'beast', maxHp: 55, strength: 8, defense: 5, speed: 6, element: 'water' },
    cultist_acolyte: { name: 'Cultist Acolyte', type: 'humanoid', maxHp: 35, strength: 4, defense: 3, speed: 4, element: 'fire' },
    stone_golem: { name: 'Stone Golem', type: 'elemental', maxHp: 90, strength: 9, defense: 10, speed: 1, element: 'earth' },
    orc_grunt: { name: 'Orc Grunt', type: 'humanoid', maxHp: 65, strength: 8, defense: 6, speed: 2, element: 'neutral' },
    orc_shaman: { name: 'Orc Shaman', type: 'humanoid', maxHp: 45, strength: 6, defense: 3, speed: 4, element: 'fire' },
    rock_golem: { name: 'Rock Golem', type: 'elemental', maxHp: 75, strength: 8, defense: 8, speed: 1, element: 'earth' },
    harpy_scout: { name: 'Harpy Scout', type: 'beast', maxHp: 35, strength: 6, defense: 2, speed: 8, element: 'wind' },
    // Bosses
    goblin_king: { name: 'Goblin King', type: 'humanoid', maxHp: 120, strength: 10, defense: 6, speed: 4, element: 'neutral', isBoss: true },
    lich_apprentice: { name: 'Lich Apprentice', type: 'undead', maxHp: 180, strength: 25, defense: 8, speed: 5, element: 'storm', isBoss: true },
    mountain_troll: { name: 'Mountain Troll', type: 'beast', maxHp: 400, strength: 30, defense: 15, speed: 2, element: 'neutral', isBoss: true }
};
