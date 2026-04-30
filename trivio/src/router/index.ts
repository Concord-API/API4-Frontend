import LoginPage from "@/features/auth/pages/LoginPage.vue";
import { createRouter, createWebHistory } from "vue-router";
import type { UserRole } from "@/shared/composables/useAuth";

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiresGuest?: boolean
    roles?: UserRole[]
    breadcrumb?: string
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      component: LoginPage,
      meta: { requiresGuest: true },
    },
    {
      path: "/dashboard",
      meta: { requiresAuth: true, breadcrumb: 'dashboard' },
      component: () => import('@/shared/components/layout/DashboardLayout.vue'),
      children: [
        {
          path: '',
          name: 'dashboard-home',
          component: () => import('@/features/dashboard/pages/HomePage.vue')
        },
        {
          path: 'carteira',
          name: 'dashboard-carteira',
          meta: { breadcrumb: 'contratos', roles: ['manager'] },
          component: () => import('@/features/dashboard/pages/CarteirePage.vue')
        },
        {
          path: 'clientes',
          name: 'dashboard-clientes',
          meta: { breadcrumb: 'clientes', roles: ['manager'] },
          component: () => import('@/features/dashboard/pages/ClientesPage.vue')
        },
        {
          path: 'equipamentos',
          name: 'dashboard-equipamentos',
          meta: { breadcrumb: 'equipamentos' },
          component: () => import('@/features/dashboard/pages/EquipamentosPage.vue')
        },
        {
          path: 'manutencoes',
          name: 'dashboard-manutencoes',
          meta: { breadcrumb: 'manutencoes' },
          component: () => import('@/features/dashboard/pages/ManutencoesPage.vue')
        },
        {
          path: 'tecnicos',
          name: 'dashboard-tecnicos',
          meta: { breadcrumb: 'tecnicos', roles: ['manager'] },
          component: () => import('@/features/dashboard/pages/EquipePage.vue')
        },
        {
          path: 'contratos',
          name: 'dashboard-contratos',
          meta: { breadcrumb: 'contratos', roles: ['manager'] },
          component: () => import('@/features/dashboard/pages/ContratosPage.vue')
        },
        {
          path: 'requisitos',
          name: 'dashboard-requisitos',
          meta: { breadcrumb: 'requisitos', roles: ['manager'] },
          component: () => import('@/features/dashboard/pages/RequisitosPage.vue')
        },
        {
          path: 'locais',
          name: 'dashboard-locais',
          meta: { breadcrumb: 'locais', roles: ['technician'] },
          component: () => import('@/features/dashboard/pages/LocaisAtendimentoPage.vue')
        },
        {
          path: 'historico',
          name: 'dashboard-historico',
          meta: { breadcrumb: 'historico', roles: ['technician'] },
          component: () => import('@/features/dashboard/pages/HomePage.vue')
        },
        {
          path: 'minha-agenda',
          name: 'dashboard-tecnico-agenda',
          meta: { breadcrumb: 'minha agenda', roles: ['technician'] },
          component: () => import('@/features/dashboard/pages/AgendaTecnicoPage.vue')
        },
        {
          path: 'agenda',
          name: 'dashboard-agenda',
          meta: { breadcrumb: 'agenda' },
          component: () => import('@/features/dashboard/pages/AgendaPage.vue')
        }
      ]
    }
  ],
});

router.beforeEach((to) => {
  const raw = localStorage.getItem('trivio_session')
  const session = raw ? JSON.parse(raw) as { user?: { role?: UserRole } } : null
  const hasSession = !!session
  const userRole = session?.user?.role ?? null

  if (to.meta.requiresAuth && !hasSession) {
    return { path: '/' }
  }

  if (to.meta.requiresGuest && hasSession) {
    if (userRole === 'technician') return { name: 'dashboard-tecnico-agenda' }
    return { path: '/dashboard' }
  }

  if (to.name === 'dashboard-home' && userRole === 'technician') {
    return { name: 'dashboard-tecnico-agenda' }
  }

  if (to.meta.roles && userRole && !to.meta.roles.includes(userRole)) {
    if (userRole === 'technician') return { name: 'dashboard-tecnico-agenda' }
    return { path: '/dashboard' }
  }
})

export default router;
