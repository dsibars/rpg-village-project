/**
 * DayResolutionService — orchestrates the full daily tick: mission board,
 * village production, expeditions, academy, inscription, hero recovery,
 * fatigue, events, training, tavern recruit, raids, Book/Chronicle records,
 * presentation triggers, and unlock checks.
 *
 * Extracted from GameEngine so the facade stays a facade. The logic here is
 * a verbatim move of the former GameEngine.nextDay(); engine-coupled side
 * effects (tutorial events, presentations, unlock state) arrive via `hooks`.
 */
export class DayResolutionService {
    constructor({
        villageService,
        heroService,
        expeditionService,
        calendarService,
        academyService,
        missionSeedService,
        dailyObjectivesService,
        dailyHeroActionsService,
        villageEventsService,
        bookService,
        chronicleService,
        unlockService,
        presentationService,
        i18n,
        hooks
    }) {
        this.villageService = villageService;
        this.heroService = heroService;
        this.expeditionService = expeditionService;
        this.calendarService = calendarService;
        this.academyService = academyService;
        this.missionSeedService = missionSeedService;
        this.dailyObjectivesService = dailyObjectivesService;
        this.dailyHeroActionsService = dailyHeroActionsService;
        this.villageEventsService = villageEventsService;
        this.bookService = bookService;
        this.chronicleService = chronicleService;
        this.unlockService = unlockService;
        this.presentationService = presentationService;
        this.i18n = i18n;
        // { reportTutorialEvent, processPresentationTriggers, persistPresentationState,
        //   evaluateChapterMilestones, buildUnlockState }
        this.hooks = hooks;
    }

    resolve() {
        const villageState = this.villageService.getState();

        // Mission Board: unlock checks, slot fill, and daily reroll reset
        const buildingLevels = villageState.infrastructure || {};
        this.missionSeedService.checkUnlocks(villageState.day, buildingLevels);
        this.missionSeedService.fillSlots(this.missionSeedService.getBoardSlots());
        this.missionSeedService.resetRerollForNewDay();

        // Legacy daily objectives (still available for fallback UI)
        this.dailyObjectivesService.generateForDay(villageState.day);

        const seasonEffects = this.calendarService.getSeasonEffects(villageState.day);
        const villageReport = this.villageService.nextDay(seasonEffects);

        // Trigger Point 2: Building Completion
        if (villageReport.completed && villageReport.completed.length > 0) {
            for (const buildingId of villageReport.completed) {
                // Report tutorial event for building construction
                this.hooks.reportTutorialEvent({ event: 'building_constructed', buildingId });
                const level = this.villageService.getState().infrastructure[buildingId] || 1;
                this.hooks.processPresentationTriggers({
                    type: 'building_complete',
                    buildingId,
                    level
                });
                // Book + Chronicle: building completed
                const currentDay = this.villageService.getState().day;
                const bookResult = this.bookService.addSection({
                    id: `building_${buildingId}_${level}_${currentDay}`,
                    category: 'village_updates',
                    day: currentDay,
                    entries: [
                        { key: 'book_update_building_completed', values: { building: this.i18n.t('village_info_building_' + buildingId) }, weight: 1 }
                    ],
                    metadata: { buildingId, level }
                });
                if (bookResult) {
                    this.chronicleService.unlockEntry(`building_${buildingId}_${level}`, villageState.day, {
                        pageSectionId: bookResult.pageSectionId,
                        pageNumber: bookResult.pages[0] || 1,
                        chapterNumber: bookResult.chapterNumber
                    });
                }
            }
            this.hooks.persistPresentationState();
        }

        // Check for region unlocks based on buildings (e.g., Explorer Guild)
        this.expeditionService.checkRegionUnlocks();

        const expeditionResult = this.expeditionService.processDay();

        // --- Academy Teaching Phase ---
        const academyCompleted = this.academyService.processDay();

        // --- Body Inscription Phase ---
        const inscriptionCompleted = [];
        this.heroService.list().forEach(hero => {
            if (hero.processBodyInscriptionDay && hero.processBodyInscriptionDay()) {
                inscriptionCompleted.push(hero.name);
            }
        });
        if (inscriptionCompleted.length > 0) {
            this.heroService.saveAll();
        }

        // --- Hero Recovery Phase ---
        const infirmaryLevel = this.villageService.getState().infrastructure.infirmary || 0;
        const baseHealAmount = 2; // Flat HP all idle heroes recover daily
        const infirmaryHealPercentage = 0.20 + (infirmaryLevel * 0.10);
        const maxHeroesWithBonus = 1 + Math.floor(infirmaryLevel / 2);

        const heroesNeedingHeal = this.heroService.list().filter(h => h.hp >= 0 && h.hp < h.maxHp && this.expeditionService.getHeroActivity(h.id).type === 'idle');
        // Sort by lowest hp percentage first (infirmary prioritises most injured)
        heroesNeedingHeal.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));

        const healedLog = [];

        // Base heal: all idle injured heroes recover 2 HP
        heroesNeedingHeal.forEach(hero => {
            const actualBaseHeal = Math.min(baseHealAmount, hero.maxHp - hero.hp);
            hero.hp += actualBaseHeal;
        });

        // Infirmary bonus: % heal on top for heroes within slot limit (only if infirmary exists)
        if (infirmaryLevel > 0) {
            const heroesWithBonus = heroesNeedingHeal.slice(0, maxHeroesWithBonus);
            const heroesBaseOnly = heroesNeedingHeal.slice(maxHeroesWithBonus);

            heroesWithBonus.forEach(hero => {
                const bonusAmount = Math.floor(hero.maxHp * infirmaryHealPercentage);
                const actualBonus = Math.min(bonusAmount, hero.maxHp - hero.hp);
                hero.hp += actualBonus;
                healedLog.push({ heroName: hero.name, amount: baseHealAmount + actualBonus });
            });

            heroesBaseOnly.forEach(hero => {
                healedLog.push({ heroName: hero.name, amount: baseHealAmount });
            });
        } else {
            // No infirmary: log all heals as base-only
            heroesNeedingHeal.forEach(hero => {
                healedLog.push({ heroName: hero.name, amount: baseHealAmount });
            });
        }

        // Restore full stamina for all idle heroes at the village
        const idleHeroes = this.heroService.list().filter(h => h.hp >= 0 && this.expeditionService.getHeroActivity(h.id).type === 'idle');
        idleHeroes.forEach(hero => {
            if (hero.maxStamina > 0) {
                hero.stamina = hero.maxStamina;
            }
        });

        // --- Fatigue Recovery ---
        // Idle heroes recover 15 fatigue per day
        // Heroes on expedition recover 5 fatigue per day (resting in camp)
        const allHeroes = this.heroService.list();
        allHeroes.forEach(hero => {
            const activity = this.expeditionService.getHeroActivity(hero.id);
            const recoveryRate = activity.type === 'idle' ? 15 : 5;
            hero.recoverFatigue(recoveryRate);
        });

        // Persist recovery changes (HP, stamina, fatigue)
        this.heroService.saveAll();

        // --- Village Random Events ---
        const eventResult = this.villageEventsService.processDay(
            villageState.day,
            this.villageService.getState(),
            this.heroService.list()
        );
        if (eventResult) {
            // Apply resource effects (events that mutate heroes directly
            // already do so inside their apply()).
            if (eventResult.goldChange) {
                this.villageService.state.gold = Math.max(0, this.villageService.state.gold + eventResult.goldChange);
                this.villageService.save();
            }
            if (eventResult.grainBonus) {
                this.villageService.addItemToInventory('food_raw_grain', eventResult.grainBonus);
            }
            if (eventResult.grainPenalty) {
                this.villageService.inventoryService.useConsumable('food_raw_grain', Math.abs(eventResult.grainPenalty));
            }

            // Book + Chronicle: village event
            const bookValues = {};
            if (eventResult.goldChange !== undefined) bookValues.amount = Math.abs(eventResult.goldChange);
            if (eventResult.grainBonus !== undefined) bookValues.amount = eventResult.grainBonus;
            if (eventResult.grainPenalty !== undefined) bookValues.amount = Math.abs(eventResult.grainPenalty);
            if (eventResult.xpGiven !== undefined) bookValues.amount = eventResult.xpGiven;
            if (eventResult.heroesHealed !== undefined) bookValues.count = eventResult.heroesHealed;
            if (eventResult.heroName !== undefined) bookValues.hero = eventResult.heroName;

            const bookResult = this.bookService.addSection({
                id: `village_event_${eventResult.id}_${villageState.day}`,
                category: 'village_updates',
                day: villageState.day,
                entries: [
                    { key: `book_event_${eventResult.id}`, values: bookValues, weight: 1 }
                ],
                metadata: { eventId: eventResult.id }
            });
            if (bookResult) {
                this.chronicleService.unlockEntry(`event_${eventResult.id}`, villageState.day, {
                    pageSectionId: bookResult.pageSectionId,
                    pageNumber: bookResult.pages[0] || 1,
                    chapterNumber: bookResult.chapterNumber
                });
            }
        }

        // --- Hero Daily Actions Resolution ---
        const actionLog = this.dailyHeroActionsService.processActions(villageState.day);
        // Note: actionLog entries are pushed to bookEntries below in the village_updates block

        // --- Training Grounds Passive XP ---
        const trainingGroundsLevel = this.villageService.getState().infrastructure.training_grounds || 0;
        const xpGainRate = 0.05 * trainingGroundsLevel; // +5% per level
        const xpLog = [];

        if (xpGainRate > 0) {
            const idleHeroes = this.heroService.list().filter(h => h.hp >= 0 && this.expeditionService.getHeroActivity(h.id).type === 'idle');
            idleHeroes.forEach(hero => {
                const expNeeded = hero.getExpToNextLevel();
                const xpGain = Math.max(1, Math.floor(expNeeded * xpGainRate));
                const preLevel = hero.level;
                hero.addExperience(xpGain);
                if (hero.level > preLevel) {
                    xpLog.push({ heroName: hero.name, leveledUp: true, xpGain });
                } else {
                    xpLog.push({ heroName: hero.name, leveledUp: false, xpGain });
                }
            });
            if (idleHeroes.length > 0) {
                this.heroService.saveAll();
            }
        }

        // --- Tavern Auto-Recruit (must happen BEFORE village-updates block) ---
        let tavernRecruitHero = null;
        if (villageReport.tavernRecruit && villageReport.tavernRecruit.ready) {
            const heroResult = this.heroService.generateRandomHero();
            if (heroResult.success) {
                tavernRecruitHero = heroResult.data;
                this.missionSeedService.trackProgress('recruit', 'hero', 1);
            }
        }

        // --- Calendar & Defense Events ---
        this.calendarService.generateEvents(villageState.day);
        let raidResult = null;
        const todayEvent = this.calendarService.getUpcomingEvents(villageState.day)
            .find(e => e.day === villageState.day && e.type === 'raid');
        if (todayEvent) {
            raidResult = this.calendarService.resolveRaid(villageState.day);
            // Trigger: first successful raid defense (at least 1 defender present)
            if (raidResult && raidResult.isVictory && raidResult.defenders && raidResult.defenders.length > 0 && !this.presentationService.isSeen('pres_first_raid_victory')) {
                this.hooks.processPresentationTriggers({ type: 'first_event', eventId: 'first_raid_victory' });
            }
        }

        // --- Book: Record Village Updates ---
        const bookEntries = [];
        if (villageReport.consumed > 0) {
            bookEntries.push({ key: 'book_update_food_consumed', values: { amount: villageReport.consumed }, weight: 1 });
        }
        if (villageReport.growth > 0) {
            bookEntries.push({ key: 'book_update_villager_joined', values: { amount: villageReport.growth }, weight: 1 });
        }
        if (villageReport.completed && villageReport.completed.length > 0) {
            for (const buildingId of villageReport.completed) {
                bookEntries.push({ key: 'book_update_building_completed', values: { building: this.i18n.t('village_info_building_' + buildingId) }, weight: 1 });
            }
        }
        if (raidResult) {
            if (raidResult.isVictory) {
                bookEntries.push({ key: 'book_update_raid_defended', values: {}, weight: 1 });
            } else {
                bookEntries.push({ key: 'book_update_raid_lost', values: {}, weight: 1 });
            }
        }
        if (eventResult) {
            // Event-specific entries could be added here
        }
        if (actionLog && actionLog.length > 0) {
            actionLog.forEach(log => {
                if (log.success) {
                    switch (log.action) {
                        case 'rest':
                            bookEntries.push({ key: 'book_update_hero_rested', values: { hero: log.heroName, hp: log.result?.hpRecovered || 0 }, weight: 1 });
                            break;
                        case 'train':
                            bookEntries.push({ key: 'book_update_hero_trained', values: { hero: log.heroName, xp: log.result?.xpGained || 0 }, weight: 1 });
                            break;
                        case 'scout':
                            bookEntries.push({ key: 'book_update_hero_scouted', values: { hero: log.heroName, region: log.result?.regionName || 'unknown' }, weight: 1 });
                            break;
                        case 'craft':
                            bookEntries.push({ key: 'book_update_hero_crafted', values: { hero: log.heroName, item: log.result?.item || 'item' }, weight: 1 });
                            break;
                        case 'socialize':
                            bookEntries.push({ key: 'book_update_hero_socialized', values: { hero: log.heroName }, weight: 1 });
                            break;
                    }
                }
            });
        }
        if (expeditionResult.success && expeditionResult.data) {
            const expData = expeditionResult.data;
            if (expData.status === 'completed') {
                bookEntries.push({ key: 'book_update_expedition_completed', values: { region: expData.expName || 'unknown' }, weight: 1 });
            } else if (expData.status === 'battle_started') {
                bookEntries.push({ key: 'book_update_expedition_started', values: { region: expData.expName || 'unknown' }, weight: 1 });
            }
        }
        if (tavernRecruitHero) {
            bookEntries.push({ key: 'book_update_hero_recruited', values: { hero: tavernRecruitHero.name }, weight: 1 });
        }
        if (bookEntries.length === 0) {
            bookEntries.push({ key: 'book_update_quiet_day', values: {}, weight: 1 });
        }

        const updatedDay = this.villageService.getState().day;
        this.bookService.addSection({
            id: `village_day_${updatedDay}`,
            category: 'village_updates',
            day: updatedDay,
            entries: bookEntries
        });

        // --- Track expedition completions and enemy defeats for daily objectives
        // NOTE: These are tracked in resolveBattle() when the battle is actually resolved.
        // The expeditionResult from processDay only returns status='battle_started'.

        // Trigger Point 5: First Hero Reaches Level 5
        const hasLevel5EventFired = this.presentationService.isSeen('pres_discipline');
        if (!hasLevel5EventFired) {
            const anyHeroAtLevel5 = this.heroService.list().some(h => h.level >= 5);
            if (anyHeroAtLevel5) {
                this.hooks.processPresentationTriggers({ type: 'first_event', eventId: 'first_hero_level_5' });
            }
        }

        // Trigger Point 7: Chapter Milestones
        const chapter1Milestones = this.hooks.evaluateChapterMilestones(1);
        if (chapter1Milestones.met >= 3) {
            this.hooks.processPresentationTriggers({
                type: 'chapter_milestones',
                chapter: 1,
                met: chapter1Milestones.met
            });
        }
        const chapter2Milestones = this.hooks.evaluateChapterMilestones(2);
        if (chapter2Milestones.met >= 3) {
            this.hooks.processPresentationTriggers({
                type: 'chapter_milestones',
                chapter: 2,
                met: chapter2Milestones.met
            });
        }
        this.hooks.persistPresentationState();

        // Tick meal buffs after any combat
        this.heroService.tickAllMealBuffs();

        // ─── Expedition narrative queue ───
        const pendingNarratives = this.expeditionService.getPendingNarratives();
        for (const n of pendingNarratives) {
            this.expeditionService.consumePendingNarratives();
        }

        // ─── Unlock Check: evaluate narrative and codex unlocks after all resolution ───
        const unlockState = this.hooks.buildUnlockState();
        const newNarratives = this.unlockService.checkAllUnlocks(unlockState);
        const newCodexFeatures = this.unlockService.checkNewCodexFeatures(unlockState);

        if (newNarratives.length > 0) {
            this.unlockService.markAllAsShown(newNarratives, villageState.day);
        }

        return {
            villageReport,
            expedition: expeditionResult.success ? expeditionResult.data : null,
            recovery: healedLog,
            training: xpLog,
            actions: actionLog,
            raid: raidResult,
            tavernRecruit: tavernRecruitHero,
            villageEvent: eventResult,
            newNarratives,
            newCodexFeatures
        };
    }
}
