import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ToastContainer from '../../../ux/components/ToastContainer.vue'
import { toastState, showToast, removeToast } from '../../../ux/core/toast.js'

describe('ToastContainer.vue', () => {
  it('renders toasts from toastState', async () => {
    toastState.toasts = []
    showToast('Test message', 'info')

    const wrapper = mount(ToastContainer)
    expect(wrapper.text()).toContain('Test message')

    // Cleanup
    toastState.toasts = []
  })

  it('removes toast on click', async () => {
    toastState.toasts = []
    showToast('Click me', 'info')

    const wrapper = mount(ToastContainer)
    await wrapper.find('.toast').trigger('click')

    expect(toastState.toasts.length).toBe(0)
  })
})
