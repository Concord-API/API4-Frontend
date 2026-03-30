<script setup lang="ts">
import ThemeProvider from '@/shared/providers/ThemeProvider.vue'
</script>

<template>
  <ThemeProvider>
    <router-view />
  </ThemeProvider>
</template>
