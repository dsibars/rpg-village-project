import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HelloWorld from '../../ux/components/HelloWorld.vue'

describe('HelloWorld.vue', () => {
  it('renders greeting message', () => {
    const wrapper = mount(HelloWorld, {
      props: { msg: 'Hello Vue' }
    })
    expect(wrapper.text()).toContain('Hello Vue')
    expect(wrapper.text()).toContain('Vue version: 3.')
  })

  it('increments count on click', async () => {
    const wrapper = mount(HelloWorld, {
      props: { msg: 'Test' }
    })

    expect(wrapper.text()).toContain('Clicked 0 times')

    await wrapper.find('button').trigger('click')

    expect(wrapper.text()).toContain('Clicked 1 times')
  })

  it('accepts msg prop', () => {
    const wrapper = mount(HelloWorld, {
      props: { msg: 'Custom Message' }
    })
    expect(wrapper.find('h2').text()).toBe('Custom Message')
  })
})
