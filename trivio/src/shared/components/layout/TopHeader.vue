<script setup lang="ts">
import { SidebarTrigger } from '@/shared/components/ui/sidebar'
import ThemeToggleButton from '@/shared/components/theme/ThemeToggleButton.vue'
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()

const pageTitle = computed(() => {
  const pathInfo = route.path.split('/')
  const lastSegment = pathInfo[pathInfo.length - 1]
  if (!lastSegment || lastSegment === 'dashboard') return 'Visão Geral'
  
  return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
})
</script>

<template>
  <header class="flex h-16 shrink-0 items-center justify-between border-b px-4 bg-background">
    <div class="flex items-center gap-2">
      <SidebarTrigger />
      <div class="w-px h-6 bg-border mx-2"></div>
      <h2 class="text-sm font-semibold tracking-tight">{{ pageTitle }}</h2>
    </div>

    <div class="flex items-center gap-4">
      <ThemeToggleButton />
    </div>
  </header>
</template>
