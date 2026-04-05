<script setup lang="ts">
import { provide, readonly, shallowRef, watch } from 'vue'
import { themeActionsKey, themeModeKey, type ThemeMode } from '@/shared/composables/useTheme'

const STORAGE_KEY = 'trivio-theme'

function resolveInitialTheme(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Inicializa com o valor correto de imediato — sem flash
const theme = shallowRef<ThemeMode>(resolveInitialTheme())

function applyTheme(mode: ThemeMode) {
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
provide(themeActionsKey, { setTheme, toggleTheme })

watch(theme, (mode) => {
  applyTheme(mode)
  localStorage.setItem(STORAGE_KEY, mode)
}, { immediate: true })
</script>

<template>
  <slot />
</template>
