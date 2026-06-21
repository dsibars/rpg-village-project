<template>
  <div class="book-page-wrapper">
    <BookView :book-state="mockBookState" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BookView from './BookView.vue'
import {
  BOOK_SECTION_CATEGORIES,
  PCS_TYPES
} from '../../../js/engine/book/BookSectionCatalog.js'

// Stage 2: Mock data to validate BookView rendering
const mockBookState = computed(() => ({
  chapters: [
    { chapterNumber: 1, startPageNumber: 1, titleKey: 'book_chapter_1_title' },
    { chapterNumber: 2, startPageNumber: 4, titleKey: 'book_chapter_2_title' }
  ],
  pages: [
    // Page 1: Chapter 1 title + history block
    {
      pageNumber: 1,
      chapterNumber: 1,
      remainingBudget: 2,
      pageContentSections: [
        {
          id: 'pcs_1',
          category: BOOK_SECTION_CATEGORIES.CHAPTER_HISTORY_EVENT,
          type: PCS_TYPES.CHAPTER_TITLE,
          textKey: 'Chapter I: The Ashes of the Past',
          values: { chapter: 1 },
          weight: 2,
          read: false
        },
        {
          id: 'pcs_2',
          category: BOOK_SECTION_CATEGORIES.HISTORY_EVENT,
          type: PCS_TYPES.HISTORY_BLOCK,
          textKey: 'In a world consumed by flames, the old kingdom has fallen.',
          values: {},
          weight: 6,
          read: false
        }
      ]
    },
    // Page 2: History block + milestone
    {
      pageNumber: 2,
      chapterNumber: 1,
      remainingBudget: 0,
      pageContentSections: [
        {
          id: 'pcs_3',
          category: BOOK_SECTION_CATEGORIES.HISTORY_EVENT,
          type: PCS_TYPES.HISTORY_BLOCK,
          textKey: 'A scout reported a narrow crevice in the hills.',
          values: {},
          weight: 6,
          read: false
        },
        {
          id: 'pcs_4',
          category: BOOK_SECTION_CATEGORIES.MILESTONE,
          type: PCS_TYPES.MILESTONE,
          textKey: 'First Victory',
          values: {},
          weight: 4,
          read: false
        }
      ]
    },
    // Page 3: Village updates
    {
      pageNumber: 3,
      chapterNumber: 1,
      remainingBudget: 6,
      pageContentSections: [
        {
          id: 'pcs_5',
          category: BOOK_SECTION_CATEGORIES.VILLAGE_UPDATES,
          type: PCS_TYPES.VILLAGE_UPDATE_TITLE,
          textKey: 'Day 5 — Village Updates',
          values: { day: 5 },
          weight: 2,
          read: false
        },
        {
          id: 'pcs_6',
          category: BOOK_SECTION_CATEGORIES.VILLAGE_UPDATES,
          type: PCS_TYPES.VILLAGE_UPDATE_BULLET,
          textKey: '12 food units were consumed.',
          values: { amount: 12 },
          weight: 1,
          read: false
        },
        {
          id: 'pcs_7',
          category: BOOK_SECTION_CATEGORIES.VILLAGE_UPDATES,
          type: PCS_TYPES.VILLAGE_UPDATE_BULLET,
          textKey: 'Arthur rested and recovered 20 HP.',
          values: { hero: 'Arthur', hp: 20 },
          weight: 1,
          read: false
        }
      ]
    },
    // Page 4: Chapter 2 title + history block
    {
      pageNumber: 4,
      chapterNumber: 2,
      remainingBudget: 2,
      pageContentSections: [
        {
          id: 'pcs_8',
          category: BOOK_SECTION_CATEGORIES.CHAPTER_HISTORY_EVENT,
          type: PCS_TYPES.CHAPTER_TITLE,
          textKey: 'Chapter II: The Arcane Age',
          values: { chapter: 2 },
          weight: 2,
          read: false
        },
        {
          id: 'pcs_9',
          category: BOOK_SECTION_CATEGORIES.HISTORY_EVENT,
          type: PCS_TYPES.HISTORY_BLOCK,
          textKey: 'A mage has joined the roster. Arcane Initiates wield devastating magic.',
          values: {},
          weight: 6,
          read: false
        }
      ]
    },
    // Page 5: More village updates
    {
      pageNumber: 5,
      chapterNumber: 2,
      remainingBudget: 5,
      pageContentSections: [
        {
          id: 'pcs_10',
          category: BOOK_SECTION_CATEGORIES.VILLAGE_UPDATES,
          type: PCS_TYPES.VILLAGE_UPDATE_TITLE,
          textKey: 'Day 10 — Village Updates',
          values: { day: 10 },
          weight: 2,
          read: false
        },
        {
          id: 'pcs_11',
          category: BOOK_SECTION_CATEGORIES.VILLAGE_UPDATES,
          type: PCS_TYPES.VILLAGE_UPDATE_BULLET,
          textKey: 'The Tavern construction is complete!',
          values: { building: 'Tavern' },
          weight: 1,
          read: false
        },
        {
          id: 'pcs_12',
          category: BOOK_SECTION_CATEGORIES.VILLAGE_UPDATES,
          type: PCS_TYPES.VILLAGE_UPDATE_BULLET,
          textKey: 'Elara has joined the village!',
          values: { hero: 'Elara' },
          weight: 1,
          read: false
        },
        {
          id: 'pcs_13',
          category: BOOK_SECTION_CATEGORIES.VILLAGE_UPDATES,
          type: PCS_TYPES.VILLAGE_UPDATE_BULLET,
          textKey: 'Victory! The party defeated Goblins.',
          values: { enemies: 'Goblins' },
          weight: 1,
          read: false
        }
      ]
    }
  ],
  pageSections: [],
  lastReadSpread: 1
}))
</script>

<style scoped>
.book-page-wrapper {
  height: 100%;
  overflow: hidden;
}
</style>
