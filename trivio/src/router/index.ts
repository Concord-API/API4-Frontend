import LoginPage from "@/features/auth/pages/LoginPage.vue";
import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      component: LoginPage
    },
    {
      path: "/dashboard",
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
          component: () => import('@/features/dashboard/pages/HomePage.vue')
        },
        {
          path: 'equipamentos',
          name: 'dashboard-equipamentos',
          component: () => import('@/features/dashboard/pages/HomePage.vue')
        },
        {
          path: 'manutencoes',
          name: 'dashboard-manutencoes',
          component: () => import('@/features/dashboard/pages/HomePage.vue')
        },
        {
          path: 'tecnicos',
          name: 'dashboard-tecnicos',
          component: () => import('@/features/dashboard/pages/HomePage.vue')
        },
        {
          path: 'locais',
          name: 'dashboard-locais',
          component: () => import('@/features/dashboard/pages/HomePage.vue')
        },
        {
          path: 'historico',
          name: 'dashboard-historico',
          component: () => import('@/features/dashboard/pages/HomePage.vue')
        }
      ]
    }
  ],
});

export default router;