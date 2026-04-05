<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import sidebarLogoLight from '@/assets/trivio branco.svg'
import { useAuth } from '@/shared/composables/useAuth'
import { useNavigation } from '@/shared/composables/useNavigation'
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
const router = useRouter()

function handleLogout() {
  logout()
  router.push('/')
}

const sidebarLogoSrc = sidebarLogoLight

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
        <p class="nd-group-label">{{ group.title }}</p>
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
  background: #0a0a0a;
  border-right: 1px solid #1f1f1f;
}

.nd-sidebar-header {
  padding: 28px 24px 24px;
  border-bottom: 1px solid #1f1f1f;
}

.nd-sidebar-logo {
  display: block;
  width: 120px;
  height: auto;
}

.nd-sidebar-content {
  padding: 8px 0 0;
}

.nd-sidebar-group {
  padding: 20px 0 8px;
}

.nd-group-label {
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #444444;
  padding: 0 24px 12px;
  margin: 0;
  line-height: 1.2;
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
  color: #555555;
  border-left: 3px solid transparent;
  transition: color 150ms ease-out, border-color 150ms ease-out, background 150ms ease-out;
  width: 100%;
}

.nd-nav-link:hover {
  color: #999999;
  background: rgba(255, 255, 255, 0.03);
}

.nd-nav-link--active {
  color: #ffffff !important;
  border-left-color: #b9f11b !important;
  background: linear-gradient(90deg, rgba(185, 241, 27, 0.12) 0%, rgba(185, 241, 27, 0.03) 50%, transparent 100%);
}

.nd-nav-link--active .nd-nav-icon {
  color: #b9f11b;
}

.nd-nav-icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  stroke-width: 1.5;
}

.nd-nav-label {
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  font-weight: 400;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  line-height: 1.2;
}

.nd-sidebar-footer {
  border-top: 1px solid #1f1f1f;
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
  border: 1px solid #333333;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  color: #888888;
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
  font-family: 'Space Grotesk', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #cccccc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.nd-user-email {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  color: #444444;
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
  color: #444444;
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
