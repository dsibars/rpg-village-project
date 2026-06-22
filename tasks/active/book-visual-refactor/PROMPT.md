# Book Visual Refactor Task

## Goal
Transform the Book UI from a glassmorphism game panel into a real "villager's journal" — paper, ink, and hand-drawn borders.

## Background
Read `docs/BOOK_DESIGN.md` first. The Book is a personal journal kept by a villager who watches Arthur's village grow. The visual design should reflect this: sometimes careful illustrations, sometimes hurried scribbles, always personal.

## Files to Modify

### Primary Files
- `ux/features/book/BookView.vue` — main book container, pages, spine
- `ux/features/book/BookPcs.vue` — individual content sections (history, updates, milestones)

### Global CSS (if needed)
- Check if parchment texture/background images need to be added to `public/` or `assets/`
- May need to add Google Fonts or font files to the project

## Design Direction

### Overall Metaphor
A leather-bound journal opened on a wooden table. Pages are aged parchment, not flat panels. The binding is visible at the center gutter.

### Color Palette Shift
From: Dark green glassmorphism panels with bright borders
To: Warm parchment tones, ink blacks, subtle sepia

| Element | Current | Target |
|---------|---------|--------|
| Page background | `var(--bg-card)` dark green | `#f4e4bc` parchment or subtle texture |
| Text color | `var(--text-primary)` white | `#2c1810` dark brown ink |
| Borders | `var(--glass-border)` bright green | `rgba(44, 24, 16, 0.15)` faint ink lines |
| Accent | `var(--color-primary)` green | `#8b4513` saddle brown / `#a0522d` sienna |

### Typography

**History Blocks (literary):**
- Font: Serif — `Crimson Text`, `Merriweather`, or `Cinzel` (elegant, book-like)
- Size: 0.95rem, line-height 1.7
- Style: Italic for narrative passages, but readable
- Letter-spacing: slight, airy

**Village Updates (scribbled):**
- Font: Slightly rough/handwritten — `Caveat`, `Kalam`, or `Patrick Hand`
- Size: 0.9rem, line-height 1.5
- Style: More compact, quick, sometimes slightly tilted

**Chapter Titles:**
- Font: Display serif — `Cinzel` or `Playfair Display`
- Size: 1.8rem, centered
- Style: Bold, with a small flourish or decorative underline

**Milestones:**
- Font: Same as chapter titles but slightly smaller
- Color: `#8b4513` sienna or gold accent
- Style: Celebratory, maybe slightly larger text, with a hand-drawn trophy icon instead of emoji

### Page Design

**Left/Right Pages:**
- Background: Parchment texture (can be CSS-generated noise + subtle gradient, or a small repeating image)
- Edges: Slightly darker at the outer edges (ink bleed effect), clean at the gutter
- Corner: Very subtle fold or dog-ear on some pages (not all — just the current spread)
- Page number: Small, bottom corner, faded ink color, serif font

**Gutter/Spine:**
- Current: Thin gradient line
- Target: A visible book spine — dark brown leather texture, maybe with a subtle gold line, and a shadow that suggests the pages are curving into the binding
- Add a slight shadow where pages meet the spine (pages appear to curve inward)

**Progress Bar:**
- Current: Green bar with "1 / 2" text
- Target: Small, elegant indicator. Maybe a thin line of ink dots or a page-riffle metaphor. Keep it minimal — the Book shouldn't feel like a progress UI.

### Content Section Styling (BookPcs.vue)

**History Block:**
- Remove: Green left border, glassmorphism panel
- Add: Subtle left border in ink color (1px), maybe a slight indent
- Image: Frame with a hand-drawn border (sketchy rectangle), slight rotation (1-2deg) to feel natural
- Caption: Small, italic, slightly faded

**Village Update Title:**
- Remove: Calendar icon, all-caps "DAY 1 — VILLAGE UPDATES"
- Add: A small ink drawing of a calendar or date marker, text in handwritten font
- Style: "Day 1" in slightly larger text, "Village Notes" in smaller, both in the same hand

**Village Update Bullet:**
- Remove: Round bullet points
- Add: Small dashes or hand-drawn checkmarks, or just indentation with a slight lead-in
- Style: Compact, quick, like a list in a journal

**Milestone:**
- Remove: Yellow/gold box with emoji trophy
- Add: A large hand-drawn trophy or star in the margin, the text is bigger and celebratory
- Background: Maybe a very subtle highlight (like a watercolor wash behind the text), not a solid box
- Style: The writer got excited and wrote bigger

**Chapter Title:**
- Remove: Green text, standard heading
- Add: Large, centered, with a decorative flourish underneath (a small drawing of a line with leaves or stars)
- Background: The page might have a very subtle vignette around the title

### Header Design

**Book Header (Previous / Title / Next):**
- Remove: Glassmorphism bar with buttons
- Add: A simpler navigation — maybe just arrow glyphs (← →) in ink color, or subtle page-edge tabs
- The title "THE BOOK" could be embossed on the leather spine, not a text label
- Keep it minimal — the focus should be on the pages, not the UI chrome

### Animation & Interaction

- **Page turn**: When navigating spreads, a subtle page-flip animation (or just a fade with a slight slide)
- **Ink fade-in**: Content sections appear with a slight ink-bleed animation rather than a generic fade
- **Hover states**: Minimal — the Book shouldn't feel like a modern UI

## Implementation Notes

### CSS-Only Parchment Texture
If you don't want to add image files, use CSS:
```css
.parchment-background {
  background: 
    linear-gradient(135deg, #f4e4bc 0%, #e8d5a3 100%),
    url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E");
}
```

### Font Loading
You can use Google Fonts via `@import` in the CSS or load them in `index.html`. Choose fonts that are available on Google Fonts:
- `Crimson Text` or `Merriweather` for body
- `Cinzel` or `Playfair Display` for titles
- `Caveat` or `Kalam` for handwritten notes

### Ink Border Effect
```css
.ink-border {
  border: 1px solid rgba(44, 24, 16, 0.2);
  box-shadow: 
    0 0 0 1px rgba(44, 24, 16, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.05);
}
```

## Constraints
- Keep it performant — don't use heavy image textures if possible, use CSS gradients and noise
- Keep it accessible — maintain contrast ratios, don't make text too light or too fancy
- Keep it responsive — the mobile view should still work, maybe switch to single-page scrolling on small screens
- Don't break existing functionality — pagination, auto-open, mark-read should all still work

## Output
Write progress to `STATUS.md` and final summary to `OUTPUT.md`. Include before/after screenshots if possible.
