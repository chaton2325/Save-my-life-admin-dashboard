import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth.store';

const routes = [
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
  {
    path: '/',
    component: () => import('../layouts/DashboardLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/patients' },
      { path: 'patients', name: 'patients', component: () => import('../views/PatientsView.vue') },
      {
        path: 'administrateurs',
        name: 'administrators',
        component: () => import('../views/AdministratorsView.vue'),
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/patients' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' };
  }
  if (to.name === 'login' && authStore.isAuthenticated) {
    return { path: '/patients' };
  }
  return true;
});

export default router;
