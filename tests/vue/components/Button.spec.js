import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from '../../../ux/components/Button.vue'

describe('Button.vue', () => {
  it('renders slot content', () => {
    const wrapper = mount(Button, { slots: { default: 'Click Me' } })
    expect(wrapper.text()).toBe('Click Me')
  })

  it('emits click event', async () => {
    const wrapper = mount(Button, { slots: { default: 'Click' } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('applies variant class', () => {
    const wrapper = mount(Button, { props: { variant: 'danger' } })
    expect(wrapper.find('button').classes()).toContain('btn--danger')
  })

  it('applies size class', () => {
    const wrapper = mount(Button, { props: { size: 'lg' } })
    expect(wrapper.find('button').classes()).toContain('btn--lg')
  })

  it('is disabled when disabled prop is true', () => {
    const wrapper = mount(Button, { props: { disabled: true } })
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('shows spinner when loading', () => {
    const wrapper = mount(Button, { props: { loading: true } })
    expect(wrapper.findComponent({ name: 'LoadingSpinner' }).exists()).toBe(true)
  })
})
