import { GameEngine } from '../js/engine/GameEngine.js';
import { Enemy } from '../js/engine/shared/combat/models/Enemy.js';

const engine = new GameEngine();
engine.initialize();

const arthur = engine.heroService.list()[0];

// Learn power_strike
arthur.knownFamilies.push('power_strike');
arthur.techniqueTiers['power_strike'] = 1;
arthur.stamina = arthur.maxStamina;

const gambit = {
    id: 'g_test',
    conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
    action: { type: 'skill', payload: 'power_strike', tier: 1 },
    target: 'lowest_hp_enemy',
    enabled: true
};

arthur.addGambit(gambit);

const enemy = new Enemy({
    id: 'e1',
    name: 'Slime',
    hp: 100,
    maxHp: 100,
    mp: 10,
    maxMp: 10,
    strength: 5,
    defense: 2,
    speed: 1
});

engine.battleService.startBattle([arthur], [enemy], true); // autoBattle = true

console.log('Arthur stamina before turn:', arthur.stamina);
const turnRes = engine.battleService.nextTurn();
console.log('nextTurn result:', turnRes);
console.log('Arthur stamina after turn:', arthur.stamina);
console.log('Battle log:', JSON.stringify(engine.battleService.log, null, 2));
