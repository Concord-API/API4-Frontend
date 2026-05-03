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
  border-right: 1px solid var(--nd-border) !important;
}

.nd-sidebar-header {
  height: 48px;
  padding: 0 24px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  border-bottom: 1px solid var(--nd-border);
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
  padding: 4px 0 0;
}

.nd-sidebar-group {
  padding: 8px 0 4px;
}

.nd-menu {
  gap: 2px;
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
  gap: 14px;
  padding: 13px 24px 13px 21px;
  min-height: 48px;
  text-decoration: none;
  color: var(--nd-text-secondary);
  border-left: 3px solid transparent;
  transition: color 150ms ease-out, border-color 150ms ease-out, background 150ms ease-out;
  width: 100%;
}

.nd-nav-link:hover {
  color: var(--nd-text-primary);
  background: rgba(128, 128, 128, 0.06);
}

.nd-nav-link--active {
  color: var(--nd-text-display) !important;
  border-left-color: var(--nd-sidebar-active-color) !important;
  background: linear-gradient(90deg, var(--nd-sidebar-active-bg-start) 0%, var(--nd-sidebar-active-bg-mid) 50%, transparent 100%);
}

.nd-nav-link--active .nd-nav-icon {
  color: var(--nd-sidebar-active-color);
}

.nd-nav-icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  stroke-width: 1.5;
}

.nd-nav-label {
  font-family: 'Montserrat', sans-serif;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.02em;
  line-height: 1.2;
}

.nd-sidebar-footer {
  border-top: 1px solid var(--nd-border);
  padding: 20px 24px;
}

.nd-user-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nd-user-avatar {
  width: 34px;
  height: 34px;
  border: 1px solid var(--nd-border-visible);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Montserrat', sans-serif;
  font-size: 13px;
  color: var(--nd-text-disabled);
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
  font-family: 'Montserrat', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: var(--nd-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.nd-user-email {
  font-family: 'Montserrat', sans-serif;
  font-size: 11px;
  color: var(--nd-text-disabled);
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
  color: var(--nd-text-disabled);
  padding: 4px;
  display: flex;
  align-items: center;
  transition: color 150ms ease-out;
  flex-shrink: 0;
}

.nd-logout-btn:hover {
  color: #D71921;
}
</style>
