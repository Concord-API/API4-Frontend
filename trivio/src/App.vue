<script setup lang="ts">
import ThemeProvider from '@/shared/providers/ThemeProvider.vue'
import { Toaster } from '@/shared/components/ui/sonner'
</script>

<template>
  <ThemeProvider>
    <router-view />
    <Toaster position="top-right" rich-colors />
  </ThemeProvider>
</template>
