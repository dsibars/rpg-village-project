# Buildings Data

This registry defines the costs, construction times, and bonuses for all village infrastructure.

| Building ID | Level | Gold Cost | Materials Cost | Days to Build | Bonus |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Housing** | | | | | |
| `housing` | 1 | 0 | - | 0 | Max Pop: 2 |
| `housing` | 2 | 150 | 40 Wood, 10 Stone | 4 | Max Pop: 5 |
| `housing` | 3 | 300 | 90 Wood, 45 Stone | 6 | Max Pop: 10 |
| **Logistics** | | | | | |
| `warehouse` | 1 | 0 | - | 0 | Max Storage: 200 |
| `warehouse` | 2 | 120 | 50 Wood, 30 Stone | 4 | Max Storage: 500 |
| **Production** | | | | | |
| `farm` | 1 | 30 | 10 Wood | 1 | Daily Food: +4 `food_raw_grain` |
| `farm` | 2 | 80 | 30 Wood, 10 Stone | 3 | Daily Food: +8 `food_raw_grain` |
| **Exploration** | | | | | |
| `explorer_guild`| 1 | 300 | 200 Wood, 100 Stone | 4 | Unlock Advanced Expeditions |
| `explorer_guild`| 2 | 800 | 400 Wood, 200 Iron | 7 | Unlock Tier 3 Maps |
| **Combat** | | | | | |
| `blacksmith` | 1 | 150 | 50 Wood, 30 Stone | 3 | Unlock Forge & Tier 2 Gear |
| `training_grounds`| 1 | 300 | 150 Stone, 50 Iron | 5 | +5% passive EXP/day for idle heroes |
| **Magic** | | | | | |
| `witchs_hut` | 1 | 200 | 80 Wood, 30 Stone | 2 | 1 reading per hero per day (progress hints) |
| `arcane_sanctum` | 1 | 500 | 100 Wood, 50 Stone | 3 | Unlock Glyph Academy (1 teaching slot) |
| `arcane_sanctum` | 2 | 1500 | 200 Wood, 100 Stone | 5 | 2 students/slot, +20% learning speed |
| `arcane_sanctum` | 3 | 3000 | 400 Wood, 200 Stone | 7 | 2 teaching slots, +40% speed |
| `arcane_sanctum` | 4 | 6000 | 800 Wood, 400 Stone | 10 | 3 students/slot, +60% speed |
| **Health & Recovery** | | | | | |
| `infirmary` | 1 | 150 | 100 Wood | 3 | Daily Heal: +10% amount, +1 Hero |
| `infirmary` | 2 | 400 | 200 Wood, 100 Stone | 5 | Daily Heal: +20% amount, +1 Hero |
| `infirmary` | 3 | 800 | 300 Wood, 200 Stone | 7 | Daily Heal: +30% amount, +1 Hero |
| **Social & Recruitment** | | | | | |
| `tavern` | 1 | 200 | 100 Wood, 50 Stone | 3 | Unlock Hero Recruitment (gold-based)
