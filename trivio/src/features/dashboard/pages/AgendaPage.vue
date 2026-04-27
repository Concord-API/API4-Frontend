<script setup lang="ts">
import Calendario from '@/features/dashboard/components/Calendario.vue'
</script>

<template>
  <div class="nd-page">
    <Calendario />
  </div>
</template>

<style scoped>
.nd-page {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 100%;
}
</style>
