# The Book — Design Document

## The Concept

The Book is not a game manual. It is not a polished chronicle. It is **a villager's personal journal** — notes taken by someone who watches Arthur's village grow from nothing, who draws what they see, who scribbles quick updates when they're busy, and who sometimes writes beautiful passages when they're moved.

The player begins the game seeing the Book fill up. They don't know who is writing it. Later, they will meet the writer — and everything they've read will suddenly have a face.

This is a **relationship built through interface**. The player doesn't know it yet, but they are reading someone's diary.

## The Writer's Voice

The writer has a **dual mode**:

### Mode A: The Chronicler (History Events)
- Careful, deliberate, artistic
- Uses full sentences, literary prose
- Illustrates with drawings — valley sketches, character portraits, dramatic moments
- Takes pride in their work
- Writes in present tense, as if witnessing: *"They found it at dawn. A valley hidden between three peaks, where the river ran silver and the trees grew thick as walls."*

### Mode B: The Scribe (Village Updates)
- Quick, practical, hurried
- Notes facts, bullet points, sometimes messy
- Different "handwriting" — slightly rougher, more compact
- May leave notes in margins: *"Ran out of ink — will finish this drawing tomorrow"*
- Sometimes worried: *"The raids are getting worse. I need to write faster."*

## The Reveal

At **10 history events unlocked**, the writer reveals themselves with a milestone:

> *"I noticed that with these dangers, I may not be always present, so I'm leaving notes for the next owner of this tiny journal I've been keeping to document the beautiful image Arthur is creating from scratch... maybe in the future, when the village becomes a big city, someone will take these notes and write a proper history book of how our village became great."*

Additional writer notes appear at **12 and 14 history events** — small parallel narratives that continue their story.

## Content Types

| Type | Tone | Visual Style |
|------|------|-------------|
| History Block | Literary, atmospheric | Careful ink, serif font, illustrations |
| Village Update Title | Practical, brief | Quick handwriting, smaller, slightly messy |
| Village Update Bullet | Factual, direct | Compact, bullet points, scrawled |
| Milestone | Celebratory, personal | BIG letters, excited doodles, exclamation marks |
| Chapter Title | Dramatic, proud | Display type, centered, maybe a flourish |

## Implementation Notes

### CSS Direction
- **Pages**: Parchment texture background, not flat green panels
- **Typography**: 
  - History blocks: Serif font (Crimson Text, Merriweather, or similar)
  - Village updates: Slightly rougher sans-serif or handwritten-style
  - Chapter titles: Large, display type, centered
- **Borders**: Hand-drawn ink borders instead of CSS `border-radius` panels
- **Gutter**: Book spine shadow, physical page feel
- **Page numbers**: Small, at bottom corners, slightly faded
- **Ink effects**: Subtle ink bleed at page edges, occasional coffee stains or ink splatters

### Translation Keys

All book-related keys should follow the chronicler's voice:
- `book_chapter_*_title`: Dramatic, literary
- `book_update_*`: Practical, factual, sometimes with personality
- `book_milestone_*`: Celebratory, personal
- `book_writer_revelation_*`: Revealing, intimate, the writer's voice emerging

### Example Tone Shifts

**Before (generic):**
> "A new village has been founded in the valley."

**After (chronicler's voice):**
> "They drove the first stake at dawn. By midday, three walls stood. I drew the valley from the ridge — the river runs silver there."

**Before (generic):**
> "The day passed quietly."

**After (scribe's quick note):**
> "Nothing stirred. Even the wind held its breath."

## Future Additions

- Marginalia: Small doodles, question marks, notes about characters
- The writer's own story: They mention their family, their fears, their hopes
- The reveal quest: A specific event where the player meets the writer
- The writer's handwriting changes: Nervous during raids, excited during celebrations, tired when overworked
