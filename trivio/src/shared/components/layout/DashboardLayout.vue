<script setup lang="ts">
import { SidebarProvider } from '@/shared/components/ui/sidebar'
import AppSidebar from '@/shared/components/layout/AppSidebar.vue'
import TopHeader from '@/shared/components/layout/TopHeader.vue'
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <main class="relative flex h-svh min-h-0 w-full min-w-0 flex-col bg-background">
      <TopHeader />
      <div class="mx-auto min-h-0 w-full min-w-0 flex-1 overflow-x-hidden px-4 py-5 sm:px-6 sm:py-7 md:px-8 md:py-8 xl:px-12 xl:py-10">
        <RouterView />
      </div>
    </main>
  </SidebarProvider>
</template>
