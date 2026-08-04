<template>
  <div class="layout">
    <header class="topbar">
      <button class="btn btn--icon btn--ghost" aria-label="Ouvrir le menu" @click="sidebarOpen = true">
        <AppIcon name="menu" />
      </button>
      <div class="brand">
        <img class="brand__logo" :src="logo" alt="Save My Life" />
        Save My Life
      </div>
      <span class="avatar" aria-hidden="true">{{ initials }}</span>
    </header>

    <div v-if="sidebarOpen" class="sidebar-backdrop" @click="sidebarOpen = false"></div>

    <aside class="sidebar" :class="{ 'is-open': sidebarOpen }">
      <div class="brand">
        <img class="brand__logo" :src="logo" alt="Save My Life" />
        Save My Life
      </div>
      <nav>
        <p class="nav-section-label">Menu</p>

        <template v-if="authStore.isPatient">
          <RouterLink to="/accueil" class="nav-link" @click="sidebarOpen = false">
            <AppIcon name="home" size="sm" />
            Accueil
          </RouterLink>
          <RouterLink to="/rendez-vous" class="nav-link" @click="sidebarOpen = false">
            <AppIcon name="calendar" size="sm" />
            Mes rendez-vous
          </RouterLink>
          <RouterLink to="/prendre-rendez-vous" class="nav-link" @click="sidebarOpen = false">
            <AppIcon name="plus" size="sm" />
            Prendre rendez-vous
          </RouterLink>
          <RouterLink to="/ordonnances" class="nav-link" @click="sidebarOpen = false">
            <AppIcon name="fileText" size="sm" />
            Mes ordonnances
          </RouterLink>
          <RouterLink to="/orientation" class="nav-link" @click="sidebarOpen = false">
            <AppIcon name="helpCircle" size="sm" />
            Quel spécialiste consulter ?
          </RouterLink>
          <RouterLink to="/notifications" class="nav-link" @click="sidebarOpen = false">
            <AppIcon name="bell" size="sm" />
            Notifications
            <span v-if="unreadCount > 0" class="nav-badge">{{ unreadCount }}</span>
          </RouterLink>
        </template>

        <template v-if="authStore.isDoctor">
          <RouterLink to="/agenda" class="nav-link" @click="sidebarOpen = false">
            <AppIcon name="calendar" size="sm" />
            Mon agenda
          </RouterLink>
          <RouterLink to="/demandes" class="nav-link" @click="sidebarOpen = false">
            <AppIcon name="clipboard" size="sm" />
            Demandes de rendez-vous
          </RouterLink>
          <RouterLink to="/mes-disponibilites" class="nav-link" @click="sidebarOpen = false">
            <AppIcon name="clock" size="sm" />
            Mes disponibilités
          </RouterLink>
          <RouterLink to="/mes-patients" class="nav-link" @click="sidebarOpen = false">
            <AppIcon name="users" size="sm" />
            Mes patients
          </RouterLink>
          <RouterLink to="/notifications" class="nav-link" @click="sidebarOpen = false">
            <AppIcon name="bell" size="sm" />
            Notifications
            <span v-if="unreadCount > 0" class="nav-badge">{{ unreadCount }}</span>
          </RouterLink>
        </template>

        <template v-if="authStore.isAdmin">
          <RouterLink to="/tableau-de-bord" class="nav-link" @click="sidebarOpen = false">
            <AppIcon name="home" size="sm" />
            Tableau de bord
          </RouterLink>
          <RouterLink to="/patients" class="nav-link" @click="sidebarOpen = false">
            <AppIcon name="users" size="sm" />
            Patients
          </RouterLink>
          <RouterLink to="/medecins" class="nav-link" @click="sidebarOpen = false">
            <AppIcon name="userCheck" size="sm" />
            Médecins
          </RouterLink>
          <RouterLink to="/cliniques" class="nav-link" @click="sidebarOpen = false">
            <AppIcon name="building" size="sm" />
            Cliniques
          </RouterLink>
          <RouterLink to="/administrateurs" class="nav-link" @click="sidebarOpen = false">
            <AppIcon name="userPlus" size="sm" />
            Administrateurs
          </RouterLink>
          <RouterLink to="/conflits" class="nav-link" @click="sidebarOpen = false">
            <AppIcon name="alertTriangle" size="sm" />
            Conflits de rendez-vous
          </RouterLink>
          <RouterLink to="/statistiques" class="nav-link" @click="sidebarOpen = false">
            <AppIcon name="activity" size="sm" />
            Statistiques
          </RouterLink>
          <RouterLink to="/journaux" class="nav-link" @click="sidebarOpen = false">
            <AppIcon name="fileText" size="sm" />
            Journaux d'activité
          </RouterLink>
          <RouterLink to="/parametres" class="nav-link" @click="sidebarOpen = false">
            <AppIcon name="settings" size="sm" />
            Paramètres
          </RouterLink>
        </template>
      </nav>
      <div class="sidebar-footer">
        <p class="admin-name">
          <span class="avatar">{{ initials }}</span>
          <span class="admin-name__meta">
            <span class="admin-name__name">{{ authStore.user?.firstName }} {{ authStore.user?.lastName }}</span>
            <span class="role-label">{{ roleLabel }}</span>
          </span>
        </p>
        <RouterLink
          to="/mot-de-passe"
          class="nav-link"
          style="margin-bottom: var(--space-3)"
          @click="sidebarOpen = false"
        >
          <AppIcon name="lock" size="sm" />
          Changer mon mot de passe
        </RouterLink>
        <button class="btn btn--danger-ghost btn--block" @click="handleLogout">
          <AppIcon name="logout" size="sm" />
          Déconnexion
        </button>
      </div>
    </aside>

    <main class="content">
      <RouterView v-slot="{ Component }">
        <Transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth.store';
import * as notificationService from '../services/notification.service';
import AppIcon from '../components/AppIcon.vue';
import logo from '../assets/logo.jpeg';

const authStore = useAuthStore();
const router = useRouter();
const sidebarOpen = ref(false);
const unreadCount = ref(0);

const ADMIN_LEVEL_LABELS = {
  super_admin: 'Super administrateur',
  read_only: 'Lecture seule',
  doctor_manager: "Chargé d'ajouter les médecins et cliniques",
};

const initials = computed(() => {
  const first = authStore.user?.firstName?.[0] || '';
  const last = authStore.user?.lastName?.[0] || '';
  return (first + last).toUpperCase();
});

const roleLabel = computed(() => {
  if (authStore.isPatient) return 'Patient';
  if (authStore.isDoctor) return authStore.user?.speciality || 'Médecin';
  if (authStore.isAdmin) return ADMIN_LEVEL_LABELS[authStore.user?.adminLevel] || 'Administrateur';
  return '';
});

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};

onMounted(async () => {
  if (authStore.isPatient || authStore.isDoctor) {
    try {
      const result = await notificationService.getMyNotifications({ limit: 1 });
      unreadCount.value = result.unreadCount;
    } catch {
      unreadCount.value = 0;
    }
  }
});
</script>
