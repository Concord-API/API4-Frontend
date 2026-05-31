<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MaintenanceNotificationsBell from '@/shared/components/notifications/MaintenanceNotificationsBell.vue'
import ThemeToggleButton from '@/shared/components/theme/ThemeToggleButton.vue'
import { SidebarTrigger } from '@/shared/components/ui/sidebar'

const route = useRoute()

const breadcrumb = computed(() =>
  route.matched
    .map((record) => record.meta.breadcrumb)
    .filter((segment): segment is string => typeof segment === 'string' && segment.length > 0)
    .join(' / ')
    .toUpperCase()
)
</script>

<template>
  <header class="nd-header">
    <div class="nd-header-left">
      <SidebarTrigger class="nd-trigger" />
      <div class="nd-divider" />
      <span class="nd-breadcrumb">{{ breadcrumb }}</span>
    </div>
    <div class="nd-header-right">
      <MaintenanceNotificationsBell />
      <ThemeToggleButton />
    </div>
  </header>
</template>

<style scoped>
.nd-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  background: var(--nd-bg);
  border-bottom: 1px solid var(--nd-border);
  flex-shrink: 0;
}

.nd-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nd-divider {
  width: 1px;
  height: 14px;
  background: var(--nd-border-visible);
}

.nd-breadcrumb {
  font-family: 'Montserrat', sans-serif;
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.02em;
  color: var(--nd-text-secondary);
}

.nd-header-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

:deep(.nd-trigger) {
  color: var(--nd-text-disabled);
  background: transparent !important;
  border: none;
  box-shadow: none;
}

:deep(.nd-trigger):hover {
  color: var(--nd-text-primary);
  background: transparent !important;
}
</style>
