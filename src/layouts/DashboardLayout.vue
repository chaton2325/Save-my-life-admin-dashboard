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
        <RouterLink v-if="!authStore.isAdmin" to="/accueil" class="nav-link" @click="sidebarOpen = false">
          <AppIcon name="home" size="sm" />
          Accueil
        </RouterLink>
        <RouterLink v-if="authStore.isAdmin" to="/patients" class="nav-link" @click="sidebarOpen = false">
          <AppIcon name="users" size="sm" />
          Patients
        </RouterLink>
        <RouterLink
          v-if="authStore.isAdmin"
          to="/administrateurs"
          class="nav-link"
          @click="sidebarOpen = false"
        >
          <AppIcon name="userPlus" size="sm" />
          Administrateurs
        </RouterLink>
      </nav>
      <div class="sidebar-footer">
        <p class="admin-name">
          <span class="avatar">{{ initials }}</span>
          <span>{{ authStore.user?.firstName }} {{ authStore.user?.lastName }}</span>
        </p>
        <button class="btn btn--danger-ghost btn--block" @click="handleLogout">
          <AppIcon name="logout" size="sm" />
          Déconnexion
        </button>
      </div>
    </aside>

    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth.store';
import AppIcon from '../components/AppIcon.vue';
import logo from '../assets/logo.jpeg';

const authStore = useAuthStore();
const router = useRouter();
const sidebarOpen = ref(false);

const initials = computed(() => {
  const first = authStore.user?.firstName?.[0] || '';
  const last = authStore.user?.lastName?.[0] || '';
  return (first + last).toUpperCase();
});

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>
