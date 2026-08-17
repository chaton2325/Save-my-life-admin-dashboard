<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Tableau de bord</h1>
        <p class="page-subtitle">Bienvenue, {{ authStore.user?.firstName }} — vue d'ensemble du système</p>
      </div>
    </div>

    <p v-if="loading" class="state-message"><span class="spinner spinner--dark"></span> Chargement...</p>

    <template v-else>
      <RouterLink v-if="conflictCount > 0" to="/conflits" class="alert alert--warning" style="display: block; text-decoration: none">
        <strong>{{ conflictCount }}</strong> conflit(s) de rendez-vous à résoudre — cliquez pour les consulter.
      </RouterLink>

      <div v-if="stats" class="stat-grid">
        <div class="stat-card">
          <span class="stat-card__icon"><AppIcon name="users" /></span>
          <div>
            <p class="stat-card__value">{{ stats.users.patients }}</p>
            <p class="stat-card__label">Patients</p>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-card__icon"><AppIcon name="userCheck" /></span>
          <div>
            <p class="stat-card__value">{{ stats.users.doctors }}</p>
            <p class="stat-card__label">Médecins</p>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-card__icon"><AppIcon name="userPlus" /></span>
          <div>
            <p class="stat-card__value">{{ stats.users.admins }}</p>
            <p class="stat-card__label">Administrateurs</p>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-card__icon"><AppIcon name="calendar" /></span>
          <div>
            <p class="stat-card__value">{{ stats.appointments.total }}</p>
            <p class="stat-card__label">Rendez-vous au total</p>
          </div>
        </div>
      </div>

      <h2 class="section-title">Accès rapide</h2>
      <div class="quick-link-grid">
        <RouterLink v-for="link in quickLinks" :key="link.to" :to="link.to" class="quick-link-card">
          <span class="quick-link-card__icon"><AppIcon :name="link.icon" /></span>
          <span>
            <span class="quick-link-card__label">{{ link.label }}</span>
            <span class="quick-link-card__desc">{{ link.desc }}</span>
          </span>
        </RouterLink>
      </div>

      <template v-if="recentLogs.length > 0">
        <h2 class="section-title">Activité récente</h2>
        <div class="card">
          <div class="item-list">
            <div v-for="log in recentLogs" :key="log.id" class="item-row">
              <div class="item-row__main">
                <span class="item-row__title">{{ actionLabel(log.action) }}</span>
                <span class="item-row__meta">
                  {{ log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : 'Système' }} —
                  {{ formatDateTime(log.createdAt) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../store/auth.store';
import * as adminService from '../services/admin.service';
import * as appointmentService from '../services/appointment.service';
import AppIcon from '../components/AppIcon.vue';

const authStore = useAuthStore();
const loading = ref(false);
const stats = ref(null);
const conflictCount = ref(0);
const recentLogs = ref([]);

const actionLabels = {
  'admin.appoint_admin': 'A nommé un administrateur',
  'admin.register_doctor': 'A enregistré un médecin',
  'admin.update_doctor': 'A modifié un médecin',
  'admin.activate_doctor': 'A réactivé un médecin',
  'admin.deactivate_doctor': 'A restreint l’accès à un médecin',
  'admin.delete_doctor': 'A supprimé un médecin',
  'admin.assign_patient_doctor': 'A assigné un patient à un médecin',
  'appointment.resolve_conflict': 'A résolu un conflit de rendez-vous',
};
const actionLabel = (action) => actionLabels[action] || action;

const formatDateTime = (value) =>
  new Date(value).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

const quickLinks = computed(() => {
  const links = [
    { to: '/patients', icon: 'users', label: 'Patients', desc: 'Consulter et rechercher' },
    { to: '/medecins', icon: 'userCheck', label: 'Médecins', desc: 'Gérer les comptes médecins' },
    { to: '/conflits', icon: 'alertTriangle', label: 'Conflits', desc: 'Rendez-vous en chevauchement' },
    { to: '/statistiques', icon: 'activity', label: 'Statistiques', desc: 'Rapports détaillés' },
  ];
  if (authStore.isSuperAdmin) {
    links.splice(2, 0, { to: '/administrateurs', icon: 'userPlus', label: 'Administrateurs', desc: 'Nommer avec permissions' });
  }
  if (authStore.isSuperAdmin || authStore.isReadOnlyAdmin) {
    links.push({ to: '/journaux', icon: 'fileText', label: "Journaux d'activité", desc: 'Historique des actions' });
  }
  return links;
});

onMounted(async () => {
  loading.value = true;
  try {
    const tasks = [adminService.getStats(), appointmentService.getConflicts()];
    const [statsResult, conflicts] = await Promise.all(tasks);
    stats.value = statsResult;
    conflictCount.value = conflicts.length;

    if (authStore.isSuperAdmin || authStore.isReadOnlyAdmin) {
      const logsResult = await adminService.getActivityLogs({ limit: 5 });
      recentLogs.value = logsResult.logs;
    }
  } finally {
    loading.value = false;
  }
});
</script>
