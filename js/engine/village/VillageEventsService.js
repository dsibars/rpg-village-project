import { persistence } from '../shared/core/Persistence.js';

/**
 * VillageEventsService - Random events that occur on day advance.
 * Events affect resources, heroes, or village state. They add flavor
 * and unexpected consequences to village management.
 */
export class VillageEventsService {
    constructor() {
        this.STORAGE_KEY = 'village_events_state';
        this.state = this._loadState();
    }

    load() {
        this.state = this._loadState();
    }

    save() {
        persistence.save(this.STORAGE_KEY, this.state);
    }

    _loadState() {
        const saved = persistence.load(this.STORAGE_KEY);
        if (saved) return saved;
        return {
            eventHistory: [],
            lastEventDay: 0,
            cooldowns: {}
        };
    }

    /**
     * Process a new day. Chance to trigger a random event.
     * Returns the event that fired (or null).
     */
    processDay(villageDay, villageState, heroes) {
        // Events happen ~30% of days, not back-to-back
        const daysSinceLast = villageDay - this.state.lastEventDay;
        if (daysSinceLast < 2) return null;

        const roll = Math.random();
        if (roll > 0.30) return null;

        const event = this._pickEvent(villageDay, villageState, heroes);
        if (!event) return null;

        // Apply the event
        const result = this._applyEvent(event, villageState, heroes);

        // Record it
        this.state.eventHistory.push({
            day: villageDay,
            eventId: event.id,
            title: event.title,
            description: result.description,
            effects: result.effects
        });
        this.state.lastEventDay = villageDay;
        this.save();

        return {
            ...event,
            ...result
        };
    }

    getEventHistory(limit = 50) {
        return this.state.eventHistory.slice(-limit).reverse();
    }

    _pickEvent(villageDay, villageState, heroes) {
        const events = this._getEventPool(villageDay, villageState, heroes);
        if (events.length === 0) return null;

        // Weighted random pick
        const totalWeight = events.reduce((sum, e) => sum + (e.weight || 1), 0);
        let roll = Math.random() * totalWeight;

        for (const event of events) {
            roll -= (event.weight || 1);
            if (roll <= 0) return event;
        }

        return events[events.length - 1];
    }

    _getEventPool(villageDay, villageState, heroes) {
        const infrastructure = villageState.infrastructure || {};
        const heroCount = heroes.length;
        const events = [];

        // Early game events (available from day 1)
        events.push({
            id: 'traveling_merchant',
            title: 'Traveling Merchant',
            description: 'A wandering merchant passes through your village.',
            weight: 2,
            condition: () => true,
            apply: (vState, h) => ({
                goldChange: Math.floor(Math.random() * 50) + 20,
                description: 'A traveling merchant buys some of your surplus goods.+' + (Math.floor(Math.random() * 50) + 20) + ' gold.'
            })
        });

        events.push({
            id: 'wandering_healer',
            title: 'Wandering Healer',
            description: 'A healer offers to treat your wounded heroes.',
            weight: 2,
            condition: () => heroCount > 0 && heroes.some(h => h.hp < h.maxHp),
            apply: (vState, h) => {
                let healedCount = 0;
                h.forEach(hero => {
                    if (hero.hp < hero.maxHp) {
                        hero.hp = Math.min(hero.maxHp, hero.hp + Math.floor(hero.maxHp * 0.3));
                        healedCount++;
                    }
                });
                return {
                    description: `A wandering healer treats ${healedCount} wounded heroes.`,
                    heroesHealed: healedCount
                };
            }
        });

        events.push({
            id: 'training_inspiration',
            title: 'Training Inspiration',
            description: 'Your heroes find renewed motivation.',
            weight: 2,
            condition: () => heroCount > 0,
            apply: (vState, h) => {
                let xpGiven = 0;
                h.forEach(hero => {
                    if (hero.addExperience) {
                        const xp = Math.floor(hero.level * 15);
                        hero.addExperience(xp);
                        xpGiven += xp;
                    }
                });
                return {
                    description: `Your heroes gain inspiration from a training session. +${xpGiven} XP total.`,
                    xpGiven
                };
            }
        });

        // Farm-related events
        if (infrastructure.farm >= 1) {
            events.push({
                id: 'bumper_crop',
                title: 'Bumper Crop',
                description: 'Your farms produce an unexpectedly large harvest.',
                weight: 1.5,
                condition: () => true,
                apply: (vState) => ({
                    description: 'A bumper crop yields extra grain.',
                    grainBonus: 5 + (infrastructure.farm * 3)
                })
            });

            events.push({
                id: 'drought_warning',
                title: 'Drought Warning',
                description: 'Dry weather threatens your crops.',
                weight: 1,
                condition: () => true,
                apply: (vState) => ({
                    description: 'Dry weather reduces crop yields.',
                    grainPenalty: -(2 + infrastructure.farm)
                })
            });
        }

        // Tavern-related events
        if (infrastructure.tavern >= 1) {
            events.push({
                id: 'drunken_brawl',
                title: 'Drunken Brawl',
                description: 'A fight breaks out in the tavern.',
                weight: 1,
                condition: () => heroCount > 0,
                apply: (vState, h) => {
                    const injuredHero = h[Math.floor(Math.random() * h.length)];
                    if (injuredHero) {
                        injuredHero.hp = Math.max(1, injuredHero.hp - 5);
                    }
                    return {
                        description: `A brawl in the tavern leaves ${injuredHero?.name || 'a hero'} slightly injured.`,
                        heroInjured: injuredHero?.id
                    };
                }
            });

            events.push({
                id: 'rumor_heard',
                title: 'Interesting Rumor',
                description: 'A traveler shares valuable information.',
                weight: 1.5,
                condition: () => true,
                apply: (vState) => ({
                    description: 'A traveler shares rumors about hidden resources nearby.',
                    goldChange: Math.floor(Math.random() * 30) + 10
                })
            });
        }

        // Late game events
        if (villageDay >= 30) {
            events.push({
                id: 'monster_attack',
                title: 'Monster Attack',
                description: 'Monsters raid the village outskirts.',
                weight: 1,
                condition: () => true,
                apply: (vState) => ({
                    description: 'A monster attack damages some infrastructure.',
                    goldChange: -(Math.floor(Math.random() * 100) + 50)
                })
            });

            events.push({
                id: 'ancient_discovery',
                title: 'Ancient Discovery',
                description: 'Villagers uncover something strange while digging.',
                weight: 0.8,
                condition: () => true,
                apply: (vState) => ({
                    description: 'Ancient artifacts are discovered, drawing scholarly interest.',
                    goldChange: Math.floor(Math.random() * 150) + 50
                })
            });
        }

        // Filter by conditions
        return events.filter(e => e.condition());
    }

    _applyEvent(event, villageState, heroes) {
        return event.apply(villageState, heroes);
    }
}
