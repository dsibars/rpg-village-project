import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EmptyState from '../../../ux/components/EmptyState.vue'

describe('EmptyState.vue', () => {
  it('renders title and message', () => {
    const wrapper = mount(EmptyState, {
      props: { icon: '\u{1F50D}', title: 'No Items', message: 'Your inventory is empty.' }
    })
    expect(wrapper.text()).toContain('No Items')
    expect(wrapper.text()).toContain('Your inventory is empty.')
  })

  it('shows action button when actionLabel provided', () => {
    const wrapper = mount(EmptyState, {
      props: { title: 'No Heroes', actionLabel: 'Recruit' }
    })
    expect(wrapper.findComponent({ name: 'Button' }).exists()).toBe(true)
  })

  it('emits action on button click', async () => {
    const wrapper = mount(EmptyState, {
      props: { title: 'No Heroes', actionLabel: 'Recruit' }
    })
    await wrapper.findComponent({ name: 'Button' }).vm.$emit('click')
    expect(wrapper.emitted('action')).toBeTruthy()
  })
})
