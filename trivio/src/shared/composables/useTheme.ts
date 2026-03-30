import { inject, type InjectionKey, type ShallowRef } from 'vue'

export type ThemeMode = 'light' | 'dark'

export interface ThemeActions {
  setTheme: (mode: ThemeMode) => void
  toggleTheme: () => void
}

export const themeModeKey: InjectionKey<Readonly<ShallowRef<ThemeMode>>> = Symbol('theme-mode')
export const themeActionsKey: InjectionKey<ThemeActions> = Symbol('theme-actions')

export function useTheme() {
  const mode = inject(themeModeKey)
  const actions = inject(themeActionsKey)

  if (!mode || !actions) {
    throw new Error('useTheme must be used within ThemeProvider.')
  }

  return {
    mode,
    ...actions,
  }
}
