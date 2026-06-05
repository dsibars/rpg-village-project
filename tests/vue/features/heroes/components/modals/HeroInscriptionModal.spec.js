import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { shallowRef } from 'vue'
import HeroInscriptionModal from '../../../../../../ux/features/heroes/components/modals/HeroInscriptionModal.vue'

function mountWithProviders(props) {
  return mount(HeroInscriptionModal, {
    props,
    attachTo: document.body,
    global: {
      provide: {
        gameState: shallowRef({}),
        i18n: { t: (k) => k },
        currentLanguage: { value: 'en' }
      }
    }
  })
}

describe('HeroInscriptionModal', () => {
  const hero = {
    id: 'h1',
    name: 'Elena',
    activity: 'idle',
    knownGlyphs: ['glyph_fire', 'glyph_water', 'glyph_potentiate', 'glyph_focus', 'glyph_multi', 'glyph_pierce', 'glyph_venom'],
    glyphMastery: {
      glyph_fire: { tier: 2 },
      glyph_water: { tier: 1 },
      glyph_potentiate: { tier: 1 },
      glyph_focus: { tier: 1 },
      glyph_multi: { tier: 1 },
      glyph_pierce: { tier: 1 },
      glyph_venom: { tier: 1 }
    }
  }

  it('renders known glyphs', () => {
    const wrapper = mountWithProviders({ hero, open: true })
    expect(wrapper.findAll('.glyph-option').length).toBe(7)
  })

  it('selects glyphs when clicked', async () => {
    const wrapper = mountWithProviders({ hero, open: true })
    await wrapper.findAll('.glyph-option')[0].trigger('click')
    expect(wrapper.findAll('.glyph-chip').length).toBe(1)
  })

  it('removes glyphs when chip clicked', async () => {
    const wrapper = mountWithProviders({ hero, open: true })
    await wrapper.findAll('.glyph-option')[0].trigger('click')
    await wrapper.findAll('.glyph-option')[1].trigger('click')
    expect(wrapper.findAll('.glyph-chip').length).toBe(2)
    await wrapper.find('.glyph-chip').trigger('click')
    expect(wrapper.findAll('.glyph-chip').length).toBe(1)
  })

  it('shows pending banner when inscription is in progress', () => {
    const wrapper = mountWithProviders({ hero: { ...hero, bodyInscriptionDaysRemaining: 3 }, open: true })
    expect(wrapper.find('.pending-banner').exists()).toBe(true)
    expect(wrapper.text()).toContain('heroes_uxelm_inscription_pending')
  })

  it('emits inscribe with 7 glyphs', async () => {
    const wrapper = mountWithProviders({ hero, open: true })
    const options = wrapper.findAll('.glyph-option')
    for (let i = 0; i < 7; i++) {
      await options[i].trigger('click')
    }
    expect(wrapper.findAll('.glyph-chip').length).toBe(7)
    await wrapper.find('.inscription-actions .btn').trigger('click')
    expect(wrapper.emitted('inscribe')).toBeTruthy()
    const payload = wrapper.emitted('inscribe')[0][0]
    expect(payload.glyphIds).toHaveLength(7)
    expect(Object.keys(payload.glyphTiers)).toHaveLength(7)
  })

  it('disables glyph picker when hero is busy', () => {
    const wrapper = mountWithProviders({ hero: { ...hero, activity: 'expedition' }, open: true })
    const options = wrapper.findAll('.glyph-option')
    expect(options[0].attributes('disabled')).toBeDefined()
  })
})
