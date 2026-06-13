import { inject } from 'vue'

export function useI18n() {
  const i18n = inject('i18n')
  const currentLanguage = inject('currentLanguage', null)

  if (!i18n) {
    // Fallback for isolated testing
    return {
      t: (key) => key,
      setLanguage: () => {},
      currentLanguage: { value: 'en' }
    }
  }

  return {
    t: (key, params) => {
      currentLanguage?.value // establish reactive dependency
      return i18n.t(key, params)
    },
    setLanguage: (lang) => {
      i18n.setLanguage(lang)
      if (currentLanguage) currentLanguage.value = lang
    },
    currentLanguage
  }
}
