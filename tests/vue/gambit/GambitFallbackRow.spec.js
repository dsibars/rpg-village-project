import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GambitFallbackRow from '../../../ux/features/gambit/components/GambitFallbackRow.vue'

describe('GambitFallbackRow.vue', () => {
  it('renders fallback label', () => {
    const wrapper = mount(GambitFallbackRow, {
      props: { fallbackAction: 'defend', learnedFamilies: ['power_strike'] },
      global: { provide: { i18n: { t: (k) => k }, currentLanguage: { value: 'en' } } }
    })
    expect(wrapper.text()).toContain('gambit_uxelm_fallback')
  })

  it('emits update on select change', async () => {
    const wrapper = mount(GambitFallbackRow, {
      props: { fallbackAction: 'defend', learnedFamilies: ['power_strike'] },
      global: { provide: { i18n: { t: (k) => k }, currentLanguage: { value: 'en' } } }
    })
    await wrapper.find('select').setValue('power_strike')
    expect(wrapper.emitted('update')).toBeTruthy()
    expect(wrapper.emitted('update')[0]).toEqual(['power_strike'])
  })
})
