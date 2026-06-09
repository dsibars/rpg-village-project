import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ResourceBar from '../../../ux/components/ResourceBar.vue'

describe('ResourceBar.vue', () => {
  it('renders all resources', () => {
    const wrapper = mount(ResourceBar, {
      props: { gold: 500, wood: 200, population: 8, maxPopulation: 12 }
    })
    expect(wrapper.text()).toContain('500')
    expect(wrapper.text()).toContain('200')
    expect(wrapper.text()).toContain('8 / 12')
  })

  it('renders Icon components', () => {
    const wrapper = mount(ResourceBar, {
      props: { gold: 100, wood: 50, population: 4, maxPopulation: 10 }
    })
    expect(wrapper.findAllComponents({ name: 'Icon' }).length).toBe(3)
  })
})
