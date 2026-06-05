import { inject } from 'vue'

export function useAdapter() {
  const adapter = inject('adapter')
  if (!adapter) {
    return {
      dispatch: () => ({ success: false, error: 'adapter_not_provided' })
    }
  }
  return {
    dispatch: (domain, action, payload) => adapter.dispatch(domain, action, payload)
  }
}
