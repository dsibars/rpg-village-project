/**
 * BookContentGenerator tests — Combat pattern detection
 */
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { BookContentGenerator } from '../../../js/engine/book/BookContentGenerator.js';

describe('BookContentGenerator', () => {
    let generator;

    beforeEach(() => {
        generator = new BookContentGenerator();
    });

    describe('Victory patterns', () => {
        test('first victory — returns first victory key when presentation has not seen it', () => {
            const combatLog = {
                isVictory: true,
                heroes: ['Arthur'],
                enemies: ['Slime'],
                enemyDetails: [{ isElite: false, isBoss: false }],
                summary: [{ heroId: 'h1', heroName: 'Arthur', hpLost: 0 }]
            };
            const heroes = [{ id: 'h1', name: 'Arthur', hp: 100, maxHp: 100 }];
            const presentationService = { isSeen: (id) => id !== 'pres_first_victory' };

            const result = generator.generateCombatEntry(combatLog, heroes, presentationService);
            assert.strictEqual(result.textKey, 'book_history_combat_victory_first');
        });

        test('boss defeated — returns boss key when enemy is boss', () => {
            const combatLog = {
                isVictory: true,
                heroes: ['Arthur'],
                enemies: ['Goblin King'],
                enemyDetails: [{ isElite: false, isBoss: true }],
                summary: [{ heroId: 'h1', heroName: 'Arthur', hpLost: 10 }]
            };
            const heroes = [{ id: 'h1', name: 'Arthur', hp: 90, maxHp: 100 }];
            const presentationService = { isSeen: () => true };

            const result = generator.generateCombatEntry(combatLog, heroes, presentationService);
            assert.strictEqual(result.textKey, 'book_history_combat_victory_boss');
        });

        test('elite hunt — returns elite key when enemy is elite and no boss', () => {
            const combatLog = {
                isVictory: true,
                heroes: ['Arthur'],
                enemies: ['Fierce Slime'],
                enemyDetails: [{ isElite: true, isBoss: false }],
                summary: [{ heroId: 'h1', heroName: 'Arthur', hpLost: 5 }]
            };
            const heroes = [{ id: 'h1', name: 'Arthur', hp: 95, maxHp: 100 }];
            const presentationService = { isSeen: () => true };

            const result = generator.generateCombatEntry(combatLog, heroes, presentationService);
            assert.strictEqual(result.textKey, 'book_history_combat_victory_elite');
        });

        test('flawless victory — returns flawless when no hero took damage', () => {
            const combatLog = {
                isVictory: true,
                heroes: ['Arthur', 'Morgana'],
                enemies: ['Slime', 'Bat'],
                enemyDetails: [{ isElite: false, isBoss: false }, { isElite: false, isBoss: false }],
                summary: [
                    { heroId: 'h1', heroName: 'Arthur', hpLost: 0 },
                    { heroId: 'h2', heroName: 'Morgana', hpLost: 0 }
                ]
            };
            const heroes = [
                { id: 'h1', name: 'Arthur', hp: 100, maxHp: 100 },
                { id: 'h2', name: 'Morgana', hp: 100, maxHp: 100 }
            ];
            const presentationService = { isSeen: () => true };

            const result = generator.generateCombatEntry(combatLog, heroes, presentationService);
            assert.strictEqual(result.textKey, 'book_history_combat_victory_flawless');
        });

        test('overwhelming victory — returns overwhelming when 2x+ enemies vs heroes', () => {
            const combatLog = {
                isVictory: true,
                heroes: ['Arthur'],
                enemies: ['Slime', 'Bat', 'Slime', 'Bat'],
                enemyDetails: [
                    { isElite: false, isBoss: false },
                    { isElite: false, isBoss: false },
                    { isElite: false, isBoss: false },
                    { isElite: false, isBoss: false }
                ],
                summary: [{ heroId: 'h1', heroName: 'Arthur', hpLost: 10 }]
            };
            const heroes = [{ id: 'h1', name: 'Arthur', hp: 90, maxHp: 100 }];
            const presentationService = { isSeen: () => true };

            const result = generator.generateCombatEntry(combatLog, heroes, presentationService);
            assert.strictEqual(result.textKey, 'book_history_combat_victory_overwhelming');
        });

        test('close call victory — returns close call when any hero below 25% HP', () => {
            const combatLog = {
                isVictory: true,
                heroes: ['Arthur', 'Morgana'],
                enemies: ['Slime'],
                enemyDetails: [{ isElite: false, isBoss: false }],
                summary: [
                    { heroId: 'h1', heroName: 'Arthur', hpLost: 80 },
                    { heroId: 'h2', heroName: 'Morgana', hpLost: 10 }
                ]
            };
            const heroes = [
                { id: 'h1', name: 'Arthur', hp: 20, maxHp: 100 },
                { id: 'h2', name: 'Morgana', hp: 90, maxHp: 100 }
            ];
            const presentationService = { isSeen: () => true };

            const result = generator.generateCombatEntry(combatLog, heroes, presentationService);
            assert.strictEqual(result.textKey, 'book_history_combat_victory_close');
        });

        test('default victory — falls back to generic victory when no pattern matches', () => {
            const combatLog = {
                isVictory: true,
                heroes: ['Arthur'],
                enemies: ['Slime'],
                enemyDetails: [{ isElite: false, isBoss: false }],
                summary: [{ heroId: 'h1', heroName: 'Arthur', hpLost: 10 }]
            };
            const heroes = [{ id: 'h1', name: 'Arthur', hp: 90, maxHp: 100 }];
            const presentationService = { isSeen: () => true };

            const result = generator.generateCombatEntry(combatLog, heroes, presentationService);
            assert.strictEqual(result.textKey, 'book_history_combat_victory');
        });

        test('boss takes precedence over flawless', () => {
            const combatLog = {
                isVictory: true,
                heroes: ['Arthur'],
                enemies: ['Goblin King'],
                enemyDetails: [{ isElite: false, isBoss: true }],
                summary: [{ heroId: 'h1', heroName: 'Arthur', hpLost: 0 }]
            };
            const heroes = [{ id: 'h1', name: 'Arthur', hp: 100, maxHp: 100 }];
            const presentationService = { isSeen: () => true };

            const result = generator.generateCombatEntry(combatLog, heroes, presentationService);
            assert.strictEqual(result.textKey, 'book_history_combat_victory_boss');
        });

        test('first victory takes precedence over boss', () => {
            const combatLog = {
                isVictory: true,
                heroes: ['Arthur'],
                enemies: ['Goblin King'],
                enemyDetails: [{ isElite: false, isBoss: true }],
                summary: [{ heroId: 'h1', heroName: 'Arthur', hpLost: 0 }]
            };
            const heroes = [{ id: 'h1', name: 'Arthur', hp: 100, maxHp: 100 }];
            const presentationService = { isSeen: (id) => id !== 'pres_first_victory' };

            const result = generator.generateCombatEntry(combatLog, heroes, presentationService);
            assert.strictEqual(result.textKey, 'book_history_combat_victory_first');
        });
    });

    describe('Defeat patterns', () => {
        test('first defeat — returns first defeat key when presentation has not seen it', () => {
            const combatLog = {
                isVictory: false,
                heroes: ['Arthur'],
                enemies: ['Slime'],
                enemyDetails: [{ isElite: false, isBoss: false }],
                summary: [{ heroId: 'h1', heroName: 'Arthur', hpLost: 100 }]
            };
            const heroes = [{ id: 'h1', name: 'Arthur', hp: 0, maxHp: 100 }];
            const presentationService = { isSeen: (id) => id !== 'pres_first_defeat' };

            const result = generator.generateCombatEntry(combatLog, heroes, presentationService);
            assert.strictEqual(result.textKey, 'book_history_combat_defeat_first');
        });

        test('total wipe — returns wipe key when all heroes fell', () => {
            const combatLog = {
                isVictory: false,
                heroes: ['Arthur', 'Morgana'],
                enemies: ['Slime'],
                enemyDetails: [{ isElite: false, isBoss: false }],
                summary: [
                    { heroId: 'h1', heroName: 'Arthur', hpLost: 100 },
                    { heroId: 'h2', heroName: 'Morgana', hpLost: 100 }
                ]
            };
            const heroes = [
                { id: 'h1', name: 'Arthur', hp: 0, maxHp: 100 },
                { id: 'h2', name: 'Morgana', hp: 0, maxHp: 100 }
            ];
            const presentationService = { isSeen: () => true };

            const result = generator.generateCombatEntry(combatLog, heroes, presentationService);
            assert.strictEqual(result.textKey, 'book_history_combat_defeat_wipe');
        });

        test('narrow escape — returns escape key when exactly one hero barely survived', () => {
            const combatLog = {
                isVictory: false,
                heroes: ['Arthur', 'Morgana'],
                enemies: ['Slime'],
                enemyDetails: [{ isElite: false, isBoss: false }],
                summary: [
                    { heroId: 'h1', heroName: 'Arthur', hpLost: 95 },
                    { heroId: 'h2', heroName: 'Morgana', hpLost: 100 }
                ]
            };
            const heroes = [
                { id: 'h1', name: 'Arthur', hp: 5, maxHp: 100 },
                { id: 'h2', name: 'Morgana', hp: 0, maxHp: 100 }
            ];
            const presentationService = { isSeen: () => true };

            const result = generator.generateCombatEntry(combatLog, heroes, presentationService);
            assert.strictEqual(result.textKey, 'book_history_combat_defeat_escape');
        });

        test('close call defeat — returns close call when all heroes survived but lost', () => {
            const combatLog = {
                isVictory: false,
                heroes: ['Arthur', 'Morgana'],
                enemies: ['Slime'],
                enemyDetails: [{ isElite: false, isBoss: false }],
                summary: [
                    { heroId: 'h1', heroName: 'Arthur', hpLost: 20 },
                    { heroId: 'h2', heroName: 'Morgana', hpLost: 30 }
                ]
            };
            const heroes = [
                { id: 'h1', name: 'Arthur', hp: 80, maxHp: 100 },
                { id: 'h2', name: 'Morgana', hp: 70, maxHp: 100 }
            ];
            const presentationService = { isSeen: () => true };

            const result = generator.generateCombatEntry(combatLog, heroes, presentationService);
            assert.strictEqual(result.textKey, 'book_history_combat_defeat_close');
        });

        test('default defeat — falls back to generic defeat when no pattern matches', () => {
            const combatLog = {
                isVictory: false,
                heroes: ['Arthur', 'Morgana'],
                enemies: ['Slime'],
                enemyDetails: [{ isElite: false, isBoss: false }],
                summary: [
                    { heroId: 'h1', heroName: 'Arthur', hpLost: 100 },
                    { heroId: 'h2', heroName: 'Morgana', hpLost: 50 }
                ]
            };
            const heroes = [
                { id: 'h1', name: 'Arthur', hp: 0, maxHp: 100 },
                { id: 'h2', name: 'Morgana', hp: 50, maxHp: 100 }
            ];
            const presentationService = { isSeen: () => true };

            const result = generator.generateCombatEntry(combatLog, heroes, presentationService);
            assert.strictEqual(result.textKey, 'book_history_combat_defeat');
        });

        test('first defeat takes precedence over wipe', () => {
            const combatLog = {
                isVictory: false,
                heroes: ['Arthur'],
                enemies: ['Slime'],
                enemyDetails: [{ isElite: false, isBoss: false }],
                summary: [{ heroId: 'h1', heroName: 'Arthur', hpLost: 100 }]
            };
            const heroes = [{ id: 'h1', name: 'Arthur', hp: 0, maxHp: 100 }];
            const presentationService = { isSeen: (id) => id !== 'pres_first_defeat' };

            const result = generator.generateCombatEntry(combatLog, heroes, presentationService);
            assert.strictEqual(result.textKey, 'book_history_combat_defeat_first');
        });
    });

    describe('Values', () => {
        test('returns hero names, enemy names, and enemy count in values', () => {
            const combatLog = {
                isVictory: true,
                heroes: ['Arthur', 'Morgana'],
                enemies: ['Slime', 'Bat'],
                enemyDetails: [{ isElite: false, isBoss: false }, { isElite: false, isBoss: false }],
                summary: [
                    { heroId: 'h1', heroName: 'Arthur', hpLost: 10 },
                    { heroId: 'h2', heroName: 'Morgana', hpLost: 10 }
                ]
            };
            const heroes = [
                { id: 'h1', name: 'Arthur', hp: 90, maxHp: 100 },
                { id: 'h2', name: 'Morgana', hp: 90, maxHp: 100 }
            ];
            const presentationService = { isSeen: () => true };

            const result = generator.generateCombatEntry(combatLog, heroes, presentationService);
            assert.strictEqual(result.values.heroes, 'Arthur, Morgana');
            assert.strictEqual(result.values.enemies, 'Slime, Bat');
            assert.strictEqual(result.values.enemyCount, 2);
        });

        test('handles string enemy names in combatLog.enemies', () => {
            const combatLog = {
                isVictory: true,
                heroes: ['Arthur'],
                enemies: ['Slime'],
                enemyDetails: [{ isElite: false, isBoss: false }],
                summary: [{ heroId: 'h1', heroName: 'Arthur', hpLost: 0 }]
            };
            const heroes = [{ id: 'h1', name: 'Arthur', hp: 100, maxHp: 100 }];
            const presentationService = { isSeen: () => true };

            const result = generator.generateCombatEntry(combatLog, heroes, presentationService);
            assert.strictEqual(result.values.enemies, 'Slime');
        });
    });

    describe('Edge cases', () => {
        test('handles null combatLog with default victory key', () => {
            const result = generator.generateCombatEntry(null, [], null);
            assert.strictEqual(result.textKey, 'book_history_combat_victory');
        });

        test('handles missing summary with default behavior', () => {
            const combatLog = {
                isVictory: true,
                heroes: ['Arthur'],
                enemies: ['Slime'],
                enemyDetails: [{ isElite: false, isBoss: false }]
                // no summary
            };
            const heroes = [{ id: 'h1', name: 'Arthur', hp: 100, maxHp: 100 }];
            const presentationService = { isSeen: () => true };

            // Without summary, flawless check fails (every returns true on empty, but summary.find returns undefined)
            const result = generator.generateCombatEntry(combatLog, heroes, presentationService);
            assert.strictEqual(result.textKey, 'book_history_combat_victory');
        });

        test('overwhelming requires at least 2x enemies, not just more than heroes', () => {
            const combatLog = {
                isVictory: true,
                heroes: ['Arthur', 'Morgana'],
                enemies: ['Slime', 'Bat', 'Slime'],
                enemyDetails: [
                    { isElite: false, isBoss: false },
                    { isElite: false, isBoss: false },
                    { isElite: false, isBoss: false }
                ],
                summary: [
                    { heroId: 'h1', heroName: 'Arthur', hpLost: 10 },
                    { heroId: 'h2', heroName: 'Morgana', hpLost: 10 }
                ]
            };
            const heroes = [
                { id: 'h1', name: 'Arthur', hp: 90, maxHp: 100 },
                { id: 'h2', name: 'Morgana', hp: 90, maxHp: 100 }
            ];
            const presentationService = { isSeen: () => true };

            // 3 enemies vs 2 heroes = 1.5x, not 2x
            const result = generator.generateCombatEntry(combatLog, heroes, presentationService);
            assert.strictEqual(result.textKey, 'book_history_combat_victory');
        });
    });
});
