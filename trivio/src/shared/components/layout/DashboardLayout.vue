<script setup lang="ts">
import { SidebarProvider } from '@/shared/components/ui/sidebar'
import AppSidebar from '@/shared/components/layout/AppSidebar.vue'
import TopHeader from '@/shared/components/layout/TopHeader.vue'
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <main class="w-full relative flex flex-col h-svh min-h-0 bg-background">
      <TopHeader />
      <div class="flex-1 min-h-0 w-full mx-auto px-4 py-6 sm:px-8 sm:py-8 md:px-12 md:py-10 lg:px-16 lg:py-12">
        <RouterView />
      </div>
    </main>
  </SidebarProvider>
</template>
