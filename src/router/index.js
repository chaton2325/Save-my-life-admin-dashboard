import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth.store';

const routes = [
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
  { path: '/inscription', name: 'register', component: () => import('../views/RegisterView.vue') },
  {
    path: '/verification',
    name: 'verify-phone',
    component: () => import('../views/VerifyPhoneView.vue'),
  },
  {
    path: '/',
    component: () => import('../layouts/DashboardLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/login' },
      { path: 'accueil', name: 'home', component: () => import('../views/PatientHomeView.vue') },
      {
        path: 'patients',
        name: 'patients',
        meta: { requiresAdmin: true },
        component: () => import('../views/PatientsView.vue'),
      },
      {
        path: 'administrateurs',
        name: 'administrators',
        meta: { requiresAdmin: true },
        component: () => import('../views/AdministratorsView.vue'),
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/login' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const landingRouteFor = (authStore) => ({ name: authStore.isAdmin ? 'patients' : 'home' });

router.beforeEach((to) => {
  const authStore = useAuthStore();
  const isAuthPage = ['login', 'register', 'verify-phone'].includes(to.name);

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' };
  }
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return landingRouteFor(authStore);
  }
  if (authStore.isAuthenticated && (isAuthPage || to.path === '/')) {
    return landingRouteFor(authStore);
  }
  return true;
});

export default router;
