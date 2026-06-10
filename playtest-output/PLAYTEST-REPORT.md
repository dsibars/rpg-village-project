# Playtest Report — RPG Village (1920×1080)
**Date:** 2026-06-11
**Viewport:** 1920×1080
**Branch:** feat/improvements
**Playtest Duration:** ~7 in-game days (Prologue → Day 7)

---

## Summary

The game is visually clean and functional at 1920×1080. No critical bugs were found during this playthrough. However, several **presentation issues**, **empty states**, and **mechanic clarity problems** were identified that could confuse new players or make the first two chapters feel flat.

**Issues Found: 5 categories, 12 specific items**

---

## 1. 🎨 Presentation / UI Issues

### 1.1 Developer Tools Visible in Settings (⚠️ Production Issue)
**Screenshot:** `25_settings_page.png`

The Settings page prominently shows:
- **"⚡ ACTIVATE DEVELOPER CHEAT"** — grants 10k gold, materials, XP
- **"🪄 MAGIC CIRCLE SIMULATOR"** — testing tool with a level 25 dummy hero

**Impact:** These are debug/testing tools visible in what appears to be a production build. Players can accidentally click them and break their progression.

**Recommendation:** Hide these behind a debug flag or require a konami-code-style activation. At minimum, move them to a collapsed "Debug Tools" section.

---

### 1.2 Adventure Page — Empty State Confusion
**Screenshot:** `12_adventure_page.png`

The Explore tab shows:
- "Greenfields" with "0 clears" and "1 path"
- A large empty grid area with only a purple cursor dot

**Impact:** New players see an empty map and don't know what to do. The "1 path" text suggests something should be visible but isn't.

**Recommendation:** Add a prominent hint like:
> "Complete the tutorial expedition to unlock the map. Visit Town → Buildings to construct required structures."

Or show the first tutorial node pre-highlighted with a bouncing arrow.

---

### 1.3 Hero Detail — "0 Tabs" Detected by Script
**Screenshot:** `10_hero_detail.png`

The playtest script found `0 tabs` in the hero detail panel, but visually the panel shows sections (Stats, Skills, etc.).

**Impact:** The tab structure might not use proper `.tab-btn` classes, making automated testing harder. Could also indicate the tabs are implemented as something else (accordion? sections?).

**Recommendation:** Ensure hero detail tabs use consistent `.tab-btn` classes for testability and accessibility. Check if they should be keyboard-navigable.

---

### 1.4 Town Buildings — Empty Right Panel
**Screenshot:** `16_town_buildings.png`

The Buildings tab shows a list of 10 buildings on the left, but the right panel is always empty until a building is clicked.

**Impact:** Wasted screen space. The right panel could show a default building (Town Hall) or a welcome message with building categories.

**Recommendation:** Auto-select the first unlocked building (Town Hall) or show a "Welcome to your village — select a building to manage it" helper card.

---

## 2. 📜 Gameplay / Mechanic Issues

### 2.1 No Tutorial Objectives on Day 1–7
**Screenshot:** `26_final_village.png`

The DAILY OBJECTIVES panel consistently shows: **"No objectives today."**

**Impact:** New players have no guidance. They don't know what to build, who to recruit, or where to explore. The first two chapters should drip-feed objectives to teach mechanics.

**Recommendation:** Add tutorial objectives for the first ~10 days:
- Day 1: "Build a Farm to produce food"
- Day 2: "Assign Arthur to the Training Grounds"
- Day 3: "Complete your first expedition in Greenfields"
- Day 4: "Build the Explorer Guild"
- etc.

---

### 2.2 Daily Report vs. Expedition Result — Confusion
**Screenshot:** `21_expedition_result.png`

Clicking "Next Day" showed a modal titled **"Daily Report - Day 6"** with only "2 Food Consumed". No expedition result was visible even though the script detected one.

**Impact:** If an expedition completed, the player should see the result (rewards, XP, new discoveries). If no expedition was active, the daily report should explain what happened (e.g., "No expeditions in progress").

**Recommendation:** 
- Ensure expedition results are shown before the daily report, or combine them into one summary modal.
- If no expeditions are active, show a friendly message: "A quiet day in the village. Arthur rested and recovered 2 HP."

---

### 2.3 Chronicle Shows 1/9 Progress but No Clear Path
**Screenshot:** `24_chronicle_tab.png`

The Chronicle shows Chapter 1 at 1/9 progress with multiple locked entries. The requirements are listed but not all are actionable early (e.g., "Recruit a hero with: Arcane Initiate" is a rare random occurrence).

**Impact:** Players see a lot of ??? and feel overwhelmed or stuck.

**Recommendation:** 
- Highlight the next 1–2 achievable milestones with a glow/border.
- Gray out milestones that are currently impossible (e.g., require buildings not yet unlocked).
- Add a tooltip: "Complete the tutorial expedition to unlock the next story mission."

---

## 3. 🔧 Scrolling / Layout Issues

### 3.1 No Scrollbars Detected (✅ Good)
At 1920×1080, all pages fit within the viewport without scrolling. The main layouts are:
- Village: 3-column grid (buildings | management | status)
- Heroes: 2-column (list | detail)
- Adventure: 2-column (sidebar | map)
- Town: 2-column (list | detail)

**Verdict:** Layout is clean. No unnecessary scrolling.

---

## 4. 🐛 Potential Bugs / Edge Cases

### 4.1 Expedition Result Modal Not Captured Properly
The playtest script detected an expedition result modal, but the screenshot showed a daily report. This suggests either:
- The modal appeared and was immediately replaced by the daily report
- The modal didn't actually contain expedition results
- A timing issue in the script

**Recommendation:** Investigate the modal sequencing. Expedition results should persist until dismissed, and daily reports should appear after.

---

### 4.2 Save Slot Screen — All 10 Slots Empty
**Screenshot:** `01_save_slots.png`

All 10 slots show "EMPTY" with "Start New Game". This is fine for a fresh game, but for returning players, the lack of "Continue" or "Load" buttons on filled slots could be confusing.

**Note:** This was tested with a fresh browser state (no localStorage). Not a bug, but worth noting for the save/load UX flow.

---

## 5. ✨ Quality of Life Improvements

### 5.1 Hero Origin Badge — Already Implemented ✅
The hero card shows the origin badge (e.g., "Warrior"). This is good and was recently added.

### 5.2 HP/STA on Hero List — Already Implemented ✅
Arthur shows HP/STA in the list view. Good addition.

### 5.3 Threat & Defense Hub Hint — Already Implemented ✅
The hint text is present. Good for new players.

### 5.4 Missing: Building Cost Previews
When viewing a locked building, the player doesn't see the cost or unlock requirements in the list view. They must click each building to see details.

**Recommendation:** Show a small cost preview in the building list (e.g., "150g, 100 wood" under "Farm — Not Built").

### 5.5 Missing: Resource Production Rates
The village main screen shows resource counts but not production/consumption rates (e.g., "+5 food/day, -2 food/day").

**Recommendation:** Add small +/- indicators next to resource counts to show net flow.

### 5.6 Missing: Hero Assignment Preview
In the village management panel, assigning workers to roles (Builder, Farmer, Miner, Scout) doesn't show a preview of the effect.

**Recommendation:** Add tooltips: "Builders reduce construction time by 20% per worker."

---

## Priority Rankings

| Priority | Issue | Category |
|----------|-------|----------|
| 🔴 **Critical** | Hide Developer Cheat buttons in production | Production / UI |
| 🟡 **High** | Add tutorial objectives for first 7–10 days | Gameplay |
| 🟡 **High** | Fix expedition result modal sequencing | Bug |
| 🟢 **Medium** | Improve adventure empty state with hint | UI / UX |
| 🟢 **Medium** | Auto-select first building in Town tab | UI / UX |
| 🟢 **Medium** | Highlight next achievable chronicle milestone | UI / UX |
| 🔵 **Low** | Add building cost previews in list | QoL |
| 🔵 **Low** | Add resource production rate indicators | QoL |
| 🔵 **Low** | Add worker assignment tooltips | QoL |

---

## Appendix: Screenshots Captured

| File | Description |
|------|-------------|
| `01_save_slots.png` | Save slot selection screen (10 empty slots) |
| `02_after_slot_click.png` | After clicking "New Game" |
| `03_intro_page_1.png` | Prologue screen 1 |
| `04_after_prologue.png` | Post-prologue village view |
| `05_village_main.png` | Village main screen (Day 5) |
| `06_daily_report_day1.png` | Daily report modal |
| `08_heroes_page.png` | Heroes list with Arthur |
| `10_hero_detail.png` | Arthur's detail panel |
| `11_hero_tabs_checked.png` | Hero tabs cycled |
| `12_adventure_page.png` | Adventure Explore tab (empty map) |
| `15_town_page.png` | Town page overview |
| `16_town_buildings.png` | Town Buildings tab |
| `18_town_shop.png` | Town Shop tab (locked) |
| `19_town_inventory.png` | Town Inventory tab |
| `20_after_next_day.png` | After clicking "Next Day" |
| `21_expedition_result.png` | Expedition/Daily result modal |
| `24_chronicle_tab.png` | Chronicle tab (1/9 progress) |
| `25_settings_page.png` | Settings page with dev tools |
| `26_final_village.png` | Final village view (Day 7) |

---

*Report generated by playtest script at 1920×1080 resolution.*
