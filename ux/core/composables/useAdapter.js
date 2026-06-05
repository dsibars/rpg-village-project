import { inject } from 'vue'

export function useAdapter() {
  const adapter = inject('adapter')
  if (!adapter) {
    throw new Error('useAdapter() called outside of app with adapter provider')
  }
  return {
    dispatch: (domain, action, payload) => adapter.dispatch(domain, action, payload)
  }
}
