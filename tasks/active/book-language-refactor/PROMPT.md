# Book Language Refactor Task

## Goal
Rewrite all Book-related translation texts across 5 languages to reflect the chronicler's voice, and add the writer revelation milestone system.

## Background
Read `docs/BOOK_DESIGN.md` first to understand the concept. The Book is a villager's personal journal — not a polished chronicle. The writer has two modes:
- **History Events**: Careful, literary, artistic (serif tone)
- **Village Updates**: Quick, practical, hurried (quick scribbles)

## Files to Modify

### Translation Files (5 languages)
- `js/engine/shared/core/i18n/translations/en.js`
- `js/engine/shared/core/i18n/translations/es.js`
- `js/engine/shared/core/i18n/translations/ca.js`
- `js/engine/shared/core/i18n/translations/eu.js`
- `js/engine/shared/core/i18n/translations/gl.js`

### Book Logic
- `js/engine/book/BookService.js` — add writer revelation milestone tracking
- `js/engine/GameEngine.js` — trigger milestone at 10 history events

## Part 1: Rewrite Existing Book Texts

For EACH language, rewrite these keys to match the chronicler's voice:

### History/Chapter Keys (literary, atmospheric)
- `book_chapter_1_title` through `book_chapter_5_title` — keep dramatic but more personal
- `book_chapter_2_event_block` — make it a proper narrative paragraph, not a dry statement
- `book_history_combat_victory` — rewrite as a witnessed account
- `book_history_combat_defeat` — rewrite as a somber witnessing

### Village Update Keys (practical, scribbled, sometimes with personality)
- `book_village_updates_title` — maybe keep as header but could be more personal
- `book_update_village_founded` — "They drove the first stake at dawn..."
- `book_update_food_consumed` — quick note about food
- `book_update_villager_joined` — welcoming but brief
- `book_update_hero_rested` — "{hero} slept. The infirmary creaked in the wind."
- `book_update_hero_trained` — quick observation
- `book_update_hero_scouted` — excited note about discovery
- `book_update_hero_crafted` — practical observation
- `book_update_hero_socialized` — warm, personal note
- `book_update_building_completed` — celebratory but brief
- `book_update_region_unlocked` — awestruck note
- `book_update_expedition_started` — quick log entry
- `book_update_expedition_completed` — relieved note
- `book_update_combat_victory` — terse but excited
- `book_update_combat_defeat` — worried, somber
- `book_update_hero_recruited` — welcoming note
- `book_update_market_rotation` — practical note
- `book_update_raid_defended` — relieved, excited
- `book_update_raid_lost` — worried, urgent
- `book_update_quiet_day` — "Nothing stirred. Even the wind held its breath."

### Milestone Keys (celebratory, personal, sometimes with doodles implied)
- `book_milestone_first_victory` — "FIRST VICTORY!!!" (excited, big)
- `book_milestone_first_boss` — "We defeated the boss!"
- `book_milestone_first_region` — "First region explored!"
- `book_milestone_first_building` — "First building complete!"
- `book_milestone_first_spell` — "First spell composed!"
- `book_milestone_first_academy` — "First academy session!"
- `book_milestone_first_body_inscription` — "First body inscription!"

For non-English languages, maintain the same voice/tone but translated appropriately. Preserve template placeholders like `{hero}`, `{amount}`, `{day}`, etc.

## Part 2: Add Writer Revelation Milestone

### New Translation Keys (add to all 5 languages)
```
book_milestone_writer_revelation: "The Chronicler's Confession"
book_milestone_writer_revelation_text: "I noticed that with these dangers, I may not be always present, so I'm leaving notes for the next owner of this tiny journal I've been keeping to document the beautiful image Arthur is creating from scratch... maybe in the future, when the village becomes a big city, someone will take these notes and write a proper history book of how our village became great."

book_milestone_writer_note_12: "The raids are getting closer. I write by candlelight now. If something happens to me, find this journal in the tavern — I keep it under the counter."
book_milestone_writer_note_14: "Twelve pages. The village has grown so much. I never thought I'd see a blacksmith's forge here. Arthur doesn't know I watch, but I think he suspects."
```

Translate these appropriately for each language.

### Logic Changes

In `js/engine/book/BookService.js`:
1. Track total history events added (history blocks from `history_event` and `chapter_history_event` categories)
2. When the 10th history block is added, automatically inject a `milestone` section with the writer revelation
3. When the 12th and 14th history blocks are added, inject additional notes

In `js/engine/GameEngine.js`:
- The writer revelation should trigger automatically when BookService adds the 10th history block

### Implementation Hint
In `BookService.addSection()`, after processing a history event section, count the total history blocks ever added. When crossing thresholds (10, 12, 14), inject the milestone:

```javascript
// After adding history blocks, check for writer revelation
if (category === BOOK_SECTION_CATEGORIES.HISTORY_EVENT || 
    category === BOOK_SECTION_CATEGORIES.CHAPTER_HISTORY_EVENT) {
    this._totalHistoryBlocks += (section.blocks?.length || 1);
    this._checkWriterRevelation();
}
```

## Part 3: UI Keys (keep mostly as-is, but add writer flavor)
- `book_uxelm_title` — "The Book" or maybe "The Chronicler's Journal" (keep as "The Book" for now, the UI label should stay recognizable)
- `book_uxelm_milestone` — keep as "Milestone" but could be "Mark" or "Note"

## Output
Write progress to `STATUS.md` and final summary to `OUTPUT.md`. List all files modified and keys changed.
