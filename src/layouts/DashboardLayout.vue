<template>
  <div class="layout">
    <!-- Desktop : navigation latérale -->
    <aside class="sidebar">
      <div class="brand">
        <img class="brand__logo" :src="logo" alt="Save My Life" />
        Save My Life
      </div>

      <nav aria-label="Navigation principale">
        <p class="nav-section-label">Menu</p>
        <RouterLink v-for="item in navItems" :key="item.to" :to="item.to" class="nav-link">
          <AppIcon :name="item.icon" size="sm" />
          {{ item.label }}
          <span v-if="badgeFor(item)" class="nav-badge">{{ badgeFor(item) }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <p class="admin-name">
          <span class="avatar">{{ initials }}</span>
          <span class="admin-name__meta">
            <span class="admin-name__name">{{ fullName }}</span>
            <span class="role-label">{{ roleLabel }}</span>
          </span>
        </p>
        <RouterLink
          v-for="item in accountItems"
          :key="item.to"
          :to="item.to"
          class="nav-link"
          style="margin-bottom: var(--space-3)"
        >
          <AppIcon :name="item.icon" size="sm" />
          {{ item.label }}
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

    <!-- Mobile : tab bar + feuille « Plus » -->
    <MobileTabBar
      :tabs="tabItems"
      :unread-count="unreadCount"
      :more-active="moreOpen"
      :more-badge="moreHasUnread"
      @more="moreOpen = true"
    />

    <AppSheet :open="moreOpen" title="Menu" @close="moreOpen = false">
      <p class="admin-name" style="margin-bottom: var(--space-4)">
        <span class="avatar">{{ initials }}</span>
        <span class="admin-name__meta">
          <span class="admin-name__name">{{ fullName }}</span>
          <span class="role-label">{{ roleLabel }}</span>
        </span>
      </p>

      <template v-if="moreItems.length">
        <p class="nav-section-label">Navigation</p>
        <RouterLink
          v-for="item in moreItems"
          :key="item.to"
          :to="item.to"
          class="nav-link"
          @click="moreOpen = false"
        >
          <AppIcon :name="item.icon" size="sm" />
          {{ item.label }}
          <span v-if="badgeFor(item)" class="nav-badge">{{ badgeFor(item) }}</span>
        </RouterLink>
      </template>

      <p class="nav-section-label">Compte</p>
      <RouterLink
        v-for="item in accountItems"
        :key="item.to"
        :to="item.to"
        class="nav-link"
        @click="moreOpen = false"
      >
        <AppIcon :name="item.icon" size="sm" />
        {{ item.label }}
      </RouterLink>

      <template #footer>
        <button class="btn btn--danger-ghost btn--block" @click="handleLogout">
          <AppIcon name="logout" size="sm" />
          Déconnexion
        </button>
      </template>
    </AppSheet>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../store/auth.store';
import * as notificationService from '../services/notification.service';
import { navItemsFor, tabItemsFor, moreItemsFor, ACCOUNT_NAV } from '../config/navigation';
import AppIcon from '../components/AppIcon.vue';
import MobileTabBar from '../components/MobileTabBar.vue';
import AppSheet from '../components/AppSheet.vue';
import logo from '../assets/logo.jpeg';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const moreOpen = ref(false);
const unreadCount = ref(0);

const ADMIN_LEVEL_LABELS = {
  super_admin: 'Super administrateur',
  read_only: 'Lecture seule',
  doctor_manager: "Chargé d'ajouter les médecins et cliniques",
};

const navItems = computed(() => navItemsFor(authStore));
const tabItems = computed(() => tabItemsFor(authStore));
const moreItems = computed(() => moreItemsFor(authStore));
const accountItems = ACCOUNT_NAV;

const badgeFor = (item) =>
  item.badge === 'notifications' && unreadCount.value > 0 ? unreadCount.value : '';

const moreHasUnread = computed(
  () => unreadCount.value > 0 && moreItems.value.some((item) => item.badge === 'notifications')
);

const initials = computed(() => {
  const first = authStore.user?.firstName?.[0] || '';
  const last = authStore.user?.lastName?.[0] || '';
  return (first + last).toUpperCase();
});

const fullName = computed(() =>
  `${authStore.user?.firstName || ''} ${authStore.user?.lastName || ''}`.trim()
);

const roleLabel = computed(() => {
  if (authStore.isPatient) return 'Patient';
  if (authStore.isDoctor) return authStore.user?.speciality || 'Médecin';
  if (authStore.isAdmin) return ADMIN_LEVEL_LABELS[authStore.user?.adminLevel] || 'Administrateur';
  return '';
});

const handleLogout = () => {
  moreOpen.value = false;
  authStore.logout();
  router.push('/login');
};

/* Pendant la saisie, le clavier remonte la page : on efface la barre d'onglets
   et le bouton flottant pour ne pas couvrir le champ actif. */
const FIELD_TAGS = ['INPUT', 'TEXTAREA', 'SELECT'];
const setTyping = (value) => document.body.classList.toggle('is-typing', value);
const onFocusIn = (event) => {
  if (FIELD_TAGS.includes(event.target?.tagName)) setTyping(true);
};
const onFocusOut = (event) => {
  if (FIELD_TAGS.includes(event.target?.tagName)) setTyping(false);
};

const refreshUnreadCount = async () => {
  if (!authStore.isPatient && !authStore.isDoctor) return;
  try {
    const result = await notificationService.getMyNotifications({ limit: 1 });
    unreadCount.value = result.unreadCount;
  } catch {
    unreadCount.value = 0;
  }
};

// La feuille ne doit jamais survivre à un changement de page.
watch(() => route.fullPath, () => {
  moreOpen.value = false;
  refreshUnreadCount();
});

onMounted(() => {
  refreshUnreadCount();
  document.addEventListener('focusin', onFocusIn);
  document.addEventListener('focusout', onFocusOut);
});

onBeforeUnmount(() => {
  document.removeEventListener('focusin', onFocusIn);
  document.removeEventListener('focusout', onFocusOut);
  setTyping(false);
});
</script>
