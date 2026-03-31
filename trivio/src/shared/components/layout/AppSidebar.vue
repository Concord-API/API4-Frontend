<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/shared/composables/useAuth'
import { useNavigation } from '@/shared/composables/useNavigation'
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar
} from '@/shared/components/ui/sidebar'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import BrandLogo from '@/shared/components/branding/BrandLogo.vue'
import { BadgeCheck, Bell, ChevronsUpDown, CreditCard, LogOut, Sparkles } from 'lucide-vue-next'

const { currentUser, logout } = useAuth()
const { menuGroups } = useNavigation()
const router = useRouter()
const { isMobile } = useSidebar()

function handleLogout() {
  logout()
  router.push('/')
}

const userDisplay = computed(() => {
  return {
    name: currentUser.value?.email?.split('@')[0] || 'Usuário',
    email: currentUser.value?.email || '',
    avatar: '', 
    initials: (currentUser.value?.email?.charAt(0) || 'U').toUpperCase()
  }
})
</script>

<template>
  <Sidebar>
    <SidebarHeader class="p-6 pb-2">
      <BrandLogo size="compact" />
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup v-for="group in menuGroups" :key="group.title">
        <SidebarGroupLabel class="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {{ group.title }}
        </SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem v-for="item in group.items" :key="item.id">
            <SidebarMenuButton as-child>
              <RouterLink :to="item.route" exact-active-class="bg-[#b9f11b] text-black font-semibold shadow-sm">
                <component :is="item.icon" />
                <span>{{ item.title }}</span>
              </RouterLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <SidebarMenuButton
                size="lg"
                class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-sidebar-accent"
              >
                <Avatar class="h-8 w-8 rounded-lg">
                  <AvatarImage :src="userDisplay.avatar" :alt="userDisplay.name" />
                  <AvatarFallback class="rounded-lg bg-background text-foreground">
                    {{ userDisplay.initials }}
                  </AvatarFallback>
                </Avatar>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-medium">{{ userDisplay.name }}</span>
                  <span class="truncate text-xs">{{ userDisplay.email }}</span>
                </div>
                <ChevronsUpDown class="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              class="w-(--reka-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              :side="isMobile ? 'bottom' : 'right'"
              align="end"
              :side-offset="4"
            >
              <DropdownMenuLabel class="p-0 font-normal">
                <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar class="h-8 w-8 rounded-lg">
                    <AvatarImage :src="userDisplay.avatar" :alt="userDisplay.name" />
                    <AvatarFallback class="rounded-lg bg-background text-foreground">
                      {{ userDisplay.initials }}
                    </AvatarFallback>
                  </Avatar>
                  <div class="grid flex-1 text-left text-sm leading-tight">
                    <span class="truncate font-semibold">{{ userDisplay.name }}</span>
                    <span class="truncate text-xs">{{ userDisplay.email }}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="handleLogout" class="cursor-pointer">
                <LogOut class="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  </Sidebar>
</template>
