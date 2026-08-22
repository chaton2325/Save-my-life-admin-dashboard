import { ref } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth.store';

/** Sens de la dernière navigation, pour animer l'entrée de page en conséquence. */
export const navDirection = ref('forward');

const routes = [
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
  { path: '/inscription', name: 'register', component: () => import('../views/RegisterView.vue') },
  {
    path: '/verification',
    name: 'verify-phone',
    component: () => import('../views/VerifyPhoneView.vue'),
  },
  {
    path: '/politique-de-confidentialite',
    name: 'privacy-policy',
    component: () => import('../views/PrivacyPolicyView.vue'),
  },
  {
    path: '/',
    component: () => import('../layouts/DashboardLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/login' },

      // Patient
      { path: 'accueil', name: 'home', meta: { roles: ['patient'] }, component: () => import('../views/PatientHomeView.vue') },
      { path: 'rendez-vous', name: 'appointments', meta: { roles: ['patient'] }, component: () => import('../views/AppointmentsView.vue') },
      { path: 'prendre-rendez-vous', name: 'book-appointment', meta: { roles: ['patient'] }, component: () => import('../views/BookAppointmentView.vue') },
      { path: 'ordonnances', name: 'prescriptions', meta: { roles: ['patient'] }, component: () => import('../views/PrescriptionsView.vue') },
      { path: 'orientation', name: 'orientation', meta: { roles: ['patient'] }, component: () => import('../views/OrientationView.vue') },
      { path: 'urgence', name: 'sos', meta: { roles: ['patient'] }, component: () => import('../views/SosView.vue') },
      { path: 'mes-urgences', name: 'sos-history', meta: { roles: ['patient'] }, component: () => import('../views/SosHistoryView.vue') },
      { path: 'passeport', name: 'passport', meta: { roles: ['patient'] }, component: () => import('../views/PassportView.vue') },

      // Médecin
      { path: 'agenda', name: 'agenda', meta: { roles: ['medecin'] }, component: () => import('../views/AgendaView.vue') },
      { path: 'demandes', name: 'appointment-requests', meta: { roles: ['medecin'] }, component: () => import('../views/AppointmentRequestsView.vue') },
      { path: 'mes-disponibilites', name: 'my-availability', meta: { roles: ['medecin'] }, component: () => import('../views/MyAvailabilityView.vue') },
      { path: 'mes-patients', name: 'my-patients', meta: { roles: ['medecin'] }, component: () => import('../views/MyPatientsView.vue') },
      { path: 'mes-patients/:id', name: 'patient-history', meta: { roles: ['medecin'] }, component: () => import('../views/PatientHistoryView.vue') },

      // Patient + Médecin
      { path: 'notifications', name: 'notifications', meta: { roles: ['patient', 'medecin'] }, component: () => import('../views/NotificationsView.vue') },
      { path: 'messagerie', name: 'messages', meta: { roles: ['patient', 'medecin'] }, component: () => import('../views/MessagesView.vue') },

      // Commun à tous les rôles
      { path: 'mot-de-passe', name: 'change-password', component: () => import('../views/ChangePasswordView.vue') },

      // Admin
      { path: 'tableau-de-bord', name: 'admin-dashboard', meta: { roles: ['admin'] }, component: () => import('../views/AdminDashboardView.vue') },
      { path: 'patients', name: 'patients', meta: { roles: ['admin'] }, component: () => import('../views/PatientsView.vue') },
      { path: 'medecins', name: 'doctors', meta: { roles: ['admin'] }, component: () => import('../views/DoctorsView.vue') },
      { path: 'cliniques', name: 'clinics', meta: { roles: ['admin'] }, component: () => import('../views/CliniquesView.vue') },
      { path: 'administrateurs', name: 'administrators', meta: { roles: ['admin'], adminLevels: ['super_admin'] }, component: () => import('../views/AdministratorsView.vue') },
      { path: 'conflits', name: 'conflicts', meta: { roles: ['admin'], adminLevels: ['super_admin', 'read_only'] }, component: () => import('../views/ConflictsView.vue') },
      { path: 'statistiques', name: 'stats', meta: { roles: ['admin'] }, component: () => import('../views/StatsView.vue') },
      { path: 'journaux', name: 'activity-logs', meta: { roles: ['admin'], adminLevels: ['super_admin', 'read_only'] }, component: () => import('../views/ActivityLogView.vue') },
      { path: 'parametres', name: 'settings', meta: { roles: ['admin'] }, component: () => import('../views/SettingsView.vue') },
      { path: 'urgences', name: 'sos-admin', meta: { roles: ['admin'] }, component: () => import('../views/SosAdminView.vue') },
      { path: 'support', name: 'support-admin', meta: { roles: ['admin'] }, component: () => import('../views/MessagesAdminView.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/login' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  // Effet application : on repart toujours en haut de l'écran, sauf retour arrière.
  scrollBehavior: (to, from, savedPosition) => savedPosition || { top: 0 },
});

const landingRouteFor = (authStore) => {
  if (authStore.isAdmin) return { name: 'admin-dashboard' };
  if (authStore.isDoctor) return { name: 'agenda' };
  return { name: 'home' };
};

router.beforeEach((to) => {
  const authStore = useAuthStore();
  const isAuthPage = ['login', 'register', 'verify-phone'].includes(to.name);

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' };
  }

  if (to.meta.roles && !to.meta.roles.includes(authStore.user?.role)) {
    return landingRouteFor(authStore);
  }

  if (to.meta.adminLevels && !authStore.isSuperAdmin && !to.meta.adminLevels.includes(authStore.user?.adminLevel)) {
    return landingRouteFor(authStore);
  }

  if (authStore.isAuthenticated && (isAuthPage || to.path === '/')) {
    return landingRouteFor(authStore);
  }

  return true;
});

// vue-router numérote les entrées d'historique : un numéro qui décroît, c'est
// un retour arrière.
let lastPosition = window.history.state?.position ?? 0;
router.afterEach(() => {
  const position = window.history.state?.position ?? 0;
  navDirection.value = position < lastPosition ? 'back' : 'forward';
  lastPosition = position;
});

export default router;
