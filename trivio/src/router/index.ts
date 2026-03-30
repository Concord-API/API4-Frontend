import LoginPage from "@/features/auth/pages/LoginPage.vue";
import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/", component: LoginPage },
  ],
});

export default router;