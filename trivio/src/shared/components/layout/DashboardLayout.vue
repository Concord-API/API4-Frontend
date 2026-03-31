<script setup lang="ts">
import { SidebarProvider } from '@/shared/components/ui/sidebar'
import AppSidebar from '@/shared/components/layout/AppSidebar.vue'
import TopHeader from '@/shared/components/layout/TopHeader.vue'
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <main class="w-full relative flex flex-col min-h-svh bg-background">
      <TopHeader />
      <div class="flex-1 w-full mx-auto p-4 md:p-6 lg:p-8">
        <RouterView />
      </div>
    </main>
  </SidebarProvider>
</template>
