<script setup lang="ts">
import { onMounted, provide, readonly, shallowRef, watch } from 'vue'
import { themeActionsKey, themeModeKey, type ThemeMode } from '@/shared/composables/useTheme'

const STORAGE_KEY = 'trivio-theme'
const theme = shallowRef<ThemeMode>('light')

function getStoredTheme(): ThemeMode | null {
  if (typeof window === 'undefined') {
    return null
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEY)
  return storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : null
}

function getSystemTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(mode: ThemeMode) {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.classList.toggle('dark', mode === 'dark')
  document.documentElement.style.colorScheme = mode
}

function setTheme(mode: ThemeMode) {
  theme.value = mode
}

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}

provide(themeModeKey, readonly(theme))
provide(themeActionsKey, {
  setTheme,
  toggleTheme,
})

onMounted(() => {
  theme.value = getStoredTheme() ?? getSystemTheme()
})

watch(
  theme,
  (mode) => {
    applyTheme(mode)

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, mode)
    }
  },
  { immediate: true },
)
</script>

<template>
  <slot />
</template>
