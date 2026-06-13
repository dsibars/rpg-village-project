import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Icon from '../../../ux/components/Icon.vue'

describe('Icon.vue', () => {
  it('renders icon character', () => {
    const wrapper = mount(Icon, { props: { name: '\u{1FA99}' } }) // coin
    expect(wrapper.text()).toContain('\u{1FA99}')
  })

  it('applies size class', () => {
    const wrapper = mount(Icon, { props: { name: 'A', size: 'lg' } })
    expect(wrapper.find('.icon--lg').exists()).toBe(true)
  })
})
