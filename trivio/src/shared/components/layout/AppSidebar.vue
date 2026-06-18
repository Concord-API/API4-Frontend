<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import sidebarLogoDark from '@/assets/trivio branco.svg'
import sidebarLogoLight from '@/assets/trivio preto.svg'
import { useAuth } from '@/shared/composables/useAuth'
import { useNavigation } from '@/shared/composables/useNavigation'
import { useTheme } from '@/shared/composables/useTheme'
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/shared/components/ui/sidebar'
import { LogOut } from 'lucide-vue-next'

const { currentUser, logout } = useAuth()
const { menuGroups } = useNavigation()
const { mode: themeMode } = useTheme()
const router = useRouter()

function handleLogout() {
  logout()
  router.push('/')
}

const sidebarLogoSrc = computed(() =>
  themeMode.value === 'dark' ? sidebarLogoDark : sidebarLogoLight
)

const userDisplay = computed(() => ({
  name: currentUser.value?.email?.split('@')[0] || 'Usuário',
  email: currentUser.value?.email || '',
  initials: (currentUser.value?.email?.charAt(0) || 'U').toUpperCase()
}))
</script>

<template>
  <Sidebar class="nd-sidebar">
    <SidebarHeader class="nd-sidebar-header">
      <img :src="sidebarLogoSrc" alt="Trivio" class="nd-sidebar-logo" />
    </SidebarHeader>

    <SidebarContent class="nd-sidebar-content">
      <SidebarGroup v-for="group in menuGroups" :key="group.title" class="nd-sidebar-group">
        <SidebarMenu class="nd-menu">
          <SidebarMenuItem v-for="item in group.items" :key="item.id">
            <SidebarMenuButton as-child class="nd-menu-btn">
              <RouterLink
                :to="item.route"
                class="nd-nav-link"
                exact-active-class="nd-nav-link--active"
              >
                <component :is="item.icon" class="nd-nav-icon" />
                <span class="nd-nav-label">{{ item.title }}</span>
              </RouterLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter class="nd-sidebar-footer">
      <div class="nd-user-row">
        <div class="nd-user-avatar">{{ userDisplay.initials }}</div>
        <div class="nd-user-info">
          <span class="nd-user-name">{{ userDisplay.name }}</span>
          <span class="nd-user-email">{{ userDisplay.email }}</span>
        </div>
        <button class="nd-logout-btn" title="Sair" @click="handleLogout">
          <LogOut :size="14" />
        </button>
      </div>
    </SidebarFooter>
  </Sidebar>
</template>

<style scoped>
:deep([data-sidebar="sidebar"]) {
  background: var(--sidebar) !important;
  border-right: 1px solid var(--sidebar-border) !important;
}

.nd-sidebar-header {
  height: var(--nd-app-header-height);
  padding: 0 18px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  border-bottom: 1px solid var(--sidebar-border);
  flex-shrink: 0;
  gap: 0;
}

.nd-sidebar-logo {
  display: block;
  height: 18px;
  width: auto;
  max-width: 120px;
  object-fit: contain;
}

.nd-sidebar-content {
  padding: 14px 12px;
}

.nd-sidebar-group {
  padding: 4px 0;
}

.nd-menu {
  gap: 4px;
}

:deep(.nd-menu-btn) {
  background: transparent !important;
  border-radius: 0 !important;
  padding: 0 !important;
  height: auto !important;
}

:deep(.nd-menu-btn):hover {
  background: transparent !important;
}

.nd-nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 13px;
  min-height: 42px;
  text-decoration: none;
  color: color-mix(in srgb, var(--sidebar-foreground) 76%, transparent);
  border: 0;
  border-radius: 8px;
  outline: 1px solid transparent;
  outline-offset: -1px;
  transition: color 150ms ease-out, background 150ms ease-out, outline-color 150ms ease-out;
  width: 100%;
}

.nd-nav-link:hover {
  color: var(--sidebar-foreground);
  background: color-mix(in srgb, #5e2bff 14%, transparent);
}

.nd-nav-link--active {
  color: var(--sidebar-foreground) !important;
  background: linear-gradient(90deg, rgba(94, 43, 255, 0.2) 0%, rgba(94, 43, 255, 0.12) 100%);
  box-shadow: none;
}

.nd-nav-link:focus-visible {
  outline-color: color-mix(in srgb, #5e2bff 42%, transparent);
}

.nd-nav-link--active .nd-nav-icon {
  color: #5e2bff;
}

.nd-nav-link--active .nd-nav-label {
  font-weight: 700;
}

.nd-nav-icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  stroke-width: 1.5;
}

.nd-nav-label {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0;
  line-height: 1.2;
}

.nd-sidebar-footer {
  border-top: 1px solid var(--sidebar-border);
  padding: 14px 12px;
}

.nd-user-row {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 0;
  outline: 1px solid color-mix(in srgb, var(--sidebar-border) 82%, transparent);
  outline-offset: -1px;
  border-radius: 8px;
  padding: 10px;
  background: color-mix(in srgb, var(--sidebar-foreground) 4%, transparent);
}

.nd-user-avatar {
  width: 34px;
  height: 34px;
  border: 0;
  background: color-mix(in srgb, var(--sidebar-foreground) 8%, transparent);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: color-mix(in srgb, var(--sidebar-foreground) 72%, transparent);
  flex-shrink: 0;
}

.nd-user-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.nd-user-name {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: var(--sidebar-foreground);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.nd-user-email {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  color: color-mix(in srgb, var(--sidebar-foreground) 52%, transparent);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.02em;
  display: block;
}

.nd-logout-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: color-mix(in srgb, var(--sidebar-foreground) 52%, transparent);
  min-width: 32px;
  min-height: 32px;
  justify-content: center;
  border-radius: 8px;
  display: flex;
  align-items: center;
  transition: color 150ms ease-out, background-color 150ms ease-out;
  flex-shrink: 0;
}

.nd-logout-btn:hover {
  color: var(--sidebar-foreground);
  background: color-mix(in srgb, var(--sidebar-foreground) 8%, transparent);
}

@media (max-width: 640px) {
  .nd-sidebar-header {
    height: var(--nd-app-header-height);
    padding: 0 16px;
  }

  .nd-sidebar-footer {
    padding: 14px 16px;
  }

  .nd-nav-link {
    min-height: 44px;
    padding: 11px 16px 11px 14px;
  }
}
</style>

