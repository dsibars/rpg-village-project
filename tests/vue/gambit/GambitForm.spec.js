import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GambitForm from '../../../ux/features/gambit/components/GambitForm.vue'

const mockHero = {
  knownFamilies: ['basic_attack', 'power_strike'],
  techniqueTiers: { basic_attack: 3, power_strike: 2 },
  spellCodex: ['fireball', 'heal']
}

describe('GambitForm.vue', () => {
  it('renders form fields', () => {
    const wrapper = mount(GambitForm, {
      props: { hero: mockHero, disabled: false },
      global: { provide: { i18n: { t: (k) => k }, currentLanguage: { value: 'en' } } }
    })
    expect(wrapper.findAll('select').length).toBeGreaterThanOrEqual(3)
  })

  it('shows tier select for technique actions', async () => {
    const wrapper = mount(GambitForm, {
      props: { hero: mockHero, disabled: false },
      global: { provide: { i18n: { t: (k) => k }, currentLanguage: { value: 'en' } } }
    })
    await wrapper.findAll('select')[1].setValue('tech:power_strike')
    expect(wrapper.findAll('select').length).toBe(4)
  })

  it('emits add with correct data', async () => {
    const wrapper = mount(GambitForm, {
      props: { hero: mockHero, disabled: false },
      global: { provide: { i18n: { t: (k) => k }, currentLanguage: { value: 'en' } } }
    })
    await wrapper.findAll('select')[0].setValue('SELF_HP_LT_50')
    await wrapper.findAll('select')[1].setValue('tech:power_strike')
    await wrapper.find('.btn-add').trigger('click')
    expect(wrapper.emitted('add')).toBeTruthy()
    const data = wrapper.emitted('add')[0][0]
    expect(data.conditionRaw).toBe('SELF_HP_LT_50')
    expect(data.actionRaw).toBe('tech:power_strike')
  })

  it('disables add button when disabled prop is true', () => {
    const wrapper = mount(GambitForm, {
      props: { hero: mockHero, disabled: true },
      global: { provide: { i18n: { t: (k) => k }, currentLanguage: { value: 'en' } } }
    })
    expect(wrapper.find('.btn-add').attributes('disabled')).toBeDefined()
  })
})
