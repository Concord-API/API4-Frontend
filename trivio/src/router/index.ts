import LoginPage from "@/features/auth/pages/LoginPage.vue";
import { createRouter, createWebHistory } from "vue-router";

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
          path: 'clientes',
          name: 'dashboard-clientes',
          meta: { breadcrumb: 'clientes' },
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
          meta: { breadcrumb: 'tecnicos' },
          component: () => import('@/features/dashboard/pages/TecnicosPage.vue')
        },
        {
          path: 'contratos',
          name: 'dashboard-contratos',
          meta: { breadcrumb: 'contratos' },
          component: () => import('@/features/dashboard/pages/ContratosPage.vue')
        },
        {
          path: 'requisitos',
          name: 'dashboard-requisitos',
          meta: { breadcrumb: 'requisitos' },
          component: () => import('@/features/dashboard/pages/RequisitosPage.vue')
        },
        {
          path: 'locais',
          name: 'dashboard-locais',
          meta: { breadcrumb: 'locais' },
          component: () => import('@/features/dashboard/pages/HomePage.vue')
        },
        {
          path: 'historico',
          name: 'dashboard-historico',
          meta: { breadcrumb: 'historico' },
          component: () => import('@/features/dashboard/pages/HomePage.vue')
        }
      ]
    }
  ],
});

router.beforeEach((to) => {
  const hasSession = !!localStorage.getItem('trivio_session')

  if (to.meta.requiresAuth && !hasSession) {
    return { path: '/' }
  }

  if (to.meta.requiresGuest && hasSession) {
    return { path: '/dashboard' }
  }
})

export default router;
