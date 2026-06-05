import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LoadingSpinner from '../../../ux/components/LoadingSpinner.vue'

describe('LoadingSpinner.vue', () => {
  it('renders with default size', () => {
    const wrapper = mount(LoadingSpinner)
    expect(wrapper.find('.spinner--md').exists()).toBe(true)
  })

  it('applies size class', () => {
    const wrapper = mount(LoadingSpinner, { props: { size: 'lg' } })
    expect(wrapper.find('.spinner--lg').exists()).toBe(true)
  })
})
