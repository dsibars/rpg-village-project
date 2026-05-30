/**
 * Region Registry
 * Each file exports one region configuration including:
 *   - procedural generation parameters (branching, stages, enemies, baseLevel)
 *   - bossPool for the region
 *   - storyMissions array with requirements, rewards, and stages
 *
 * To add a new region, create a file in this directory and import it below.
 */
import { reg_greenfields } from './reg_greenfields.js';
import { reg_tiny_cave } from './reg_tiny_cave.js';
import { reg_calmed_beach } from './reg_calmed_beach.js';
import { reg_dark_forest } from './reg_dark_forest.js';
import { reg_goblin_camp } from './reg_goblin_camp.js';
import { reg_mystic_ruins } from './reg_mystic_ruins.js';
import { reg_frozen_peaks } from './reg_frozen_peaks.js';
import { reg_whispering_forest } from './reg_whispering_forest.js';
import { reg_murky_swamp } from './reg_murky_swamp.js';
import { reg_forgotten_ruins } from './reg_forgotten_ruins.js';
import { reg_iron_peaks } from './reg_iron_peaks.js';
import { reg_ancient_library } from './reg_ancient_library.js';

export const REGION_REGISTRY = {
    reg_greenfields,
    reg_tiny_cave,
    reg_calmed_beach,
    reg_dark_forest,
    reg_goblin_camp,
    reg_mystic_ruins,
    reg_frozen_peaks,
    reg_whispering_forest,
    reg_murky_swamp,
    reg_forgotten_ruins,
    reg_iron_peaks,
    reg_ancient_library
};

/**
 * Flatten all story missions across all regions into a single lookup map.
 */
export const STORY_MISSION_INDEX = Object.values(REGION_REGISTRY).reduce((acc, region) => {
    if (region.storyMissions) {
        region.storyMissions.forEach(m => { acc[m.id] = m; });
    }
    return acc;
}, {});
