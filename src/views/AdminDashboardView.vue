<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Tableau de bord</h1>
        <p class="page-subtitle">Bienvenue, {{ authStore.user?.firstName }} — vue d'ensemble du système</p>
      </div>
      <span class="page-date"><AppIcon name="calendar" size="sm" /> {{ today }}</span>
    </div>

    <p v-if="loading" class="state-message"><span class="spinner spinner--dark"></span> Chargement...</p>
    <p v-else-if="errorMessage" class="alert alert--error">{{ errorMessage }}</p>

    <template v-else-if="stats">
      <!-- Chiffres clés -->
      <div class="dash-grid">
        <RouterLink to="/patients" class="tile tile--link tile--brand kpi span-3">
          <div class="kpi__head">
            <span class="kpi__label">Patients</span>
            <span class="kpi__icon"><AppIcon name="users" /></span>
          </div>
          <div>
            <p class="kpi__value">{{ fmt(stats.users.patients) }}</p>
            <p class="kpi__meta">+{{ fmt(stats.users.newThisMonth) }} ce mois-ci</p>
          </div>
        </RouterLink>

        <RouterLink to="/medecins" class="tile tile--link kpi span-3">
          <div class="kpi__head">
            <span class="kpi__label">Médecins</span>
            <span class="kpi__icon"><AppIcon name="userCheck" /></span>
          </div>
          <div>
            <p class="kpi__value">{{ fmt(stats.users.doctors) }}</p>
            <p class="kpi__meta">comptes enregistrés</p>
          </div>
        </RouterLink>

        <component
          :is="authStore.isSuperAdmin ? 'RouterLink' : 'div'"
          :to="authStore.isSuperAdmin ? '/administrateurs' : undefined"
          class="tile kpi span-3"
          :class="{ 'tile--link': authStore.isSuperAdmin }"
        >
          <div class="kpi__head">
            <span class="kpi__label">Administrateurs</span>
            <span class="kpi__icon"><AppIcon name="userPlus" /></span>
          </div>
          <div>
            <p class="kpi__value">{{ fmt(stats.users.admins) }}</p>
            <p class="kpi__meta">avec permissions</p>
          </div>
        </component>

        <RouterLink
          to="/conflits"
          class="tile tile--link kpi span-3"
          :class="{ 'tile--alert': conflictCount > 0 }"
        >
          <div class="kpi__head">
            <span class="kpi__label">Conflits de rendez-vous</span>
            <span class="kpi__icon"><AppIcon name="alertTriangle" /></span>
          </div>
          <div>
            <p class="kpi__value">{{ conflictCount }}</p>
            <p class="kpi__meta">{{ conflictCount > 0 ? 'à résoudre' : 'aucun conflit en cours' }}</p>
          </div>
        </RouterLink>
      </div>

      <!-- Rendez-vous : répartition, taux, spécialités -->
      <div class="dash-grid">
        <section class="tile span-5">
          <div class="tile__head">
            <h2 class="tile__title">Rendez-vous</h2>
            <RouterLink to="/statistiques" class="tile__link">Détails</RouterLink>
          </div>
          <p class="kpi__value">
            {{ fmt(stats.appointments.total) }}<span class="kpi__unit">au total</span>
          </p>
          <div class="segbar" role="img" aria-label="Répartition des rendez-vous par statut">
            <span
              v-for="row in breakdown.filter((r) => r.count > 0)"
              :key="row.key"
              class="segbar__seg"
              :style="{ flexGrow: row.count, background: row.color }"
            ></span>
          </div>
          <ul class="legend">
            <li v-for="row in breakdown" :key="row.key">
              <span class="legend__dot" :style="{ background: row.color }"></span>
              <span class="legend__label">{{ row.label }}</span>
              <span class="legend__value">{{ fmt(row.count) }}</span>
            </li>
          </ul>
        </section>

        <section class="tile span-3">
          <div class="tile__head">
            <h2 class="tile__title">Taux d'aboutissement</h2>
          </div>
          <GaugeChart :value="rate" label="Rendez-vous confirmés ou terminés" />
        </section>

        <section class="tile span-4">
          <div class="tile__head">
            <h2 class="tile__title">Top spécialités</h2>
            <RouterLink to="/statistiques" class="tile__link">Tout voir</RouterLink>
          </div>
          <ul v-if="topSpecialities.length" class="rank-list">
            <li class="rank-list__head">
              <span>Spécialité</span>
              <span>Patients</span>
            </li>
            <li v-for="row in topSpecialities" :key="row.speciality" class="rank-list__row">
              <span class="rank-list__name">
                {{ row.speciality }}
                <span class="rank-list__bar"><i :style="{ width: barWidth(row.patientCount) + '%' }"></i></span>
              </span>
              <span class="rank-list__value">{{ fmt(row.patientCount) }}</span>
            </li>
          </ul>
          <p v-else class="empty">Aucune consultation terminée pour le moment.</p>
        </section>
      </div>

      <!-- Activité et raccourcis -->
      <div class="dash-grid">
        <section v-if="recentLogs.length > 0" class="tile span-7">
          <div class="tile__head">
            <h2 class="tile__title">Activité récente</h2>
            <RouterLink v-if="canSeeLogs" to="/journaux" class="tile__link">Journal complet</RouterLink>
          </div>
          <ul class="feed">
            <li v-for="log in recentLogs" :key="log.id" class="feed__item">
              <span class="feed__icon"><AppIcon :name="logIcon(log.action)" /></span>
              <span class="feed__body">
                <span class="feed__title">{{ actionLabel(log.action) }}</span>
                <span class="feed__meta">
                  {{ log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : 'Système' }} ·
                  {{ formatDateTime(log.createdAt) }}
                </span>
              </span>
            </li>
          </ul>
        </section>

        <section class="tile" :class="recentLogs.length > 0 ? 'span-5' : 'span-12'">
          <div class="tile__head">
            <h2 class="tile__title">Accès rapide</h2>
          </div>
          <div class="shortcut-list" :class="{ 'shortcut-list--cols': recentLogs.length === 0 }">
            <RouterLink v-for="link in quickLinks" :key="link.to" :to="link.to" class="shortcut">
              <span class="shortcut__icon"><AppIcon :name="link.icon" size="sm" /></span>
              <span class="shortcut__text">
                <span class="shortcut__label">{{ link.label }}</span>
                <span class="shortcut__desc">{{ link.desc }}</span>
              </span>
              <AppIcon name="chevronRight" size="sm" class="shortcut__chevron" />
            </RouterLink>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../store/auth.store';
import * as adminService from '../services/admin.service';
import * as appointmentService from '../services/appointment.service';
import { statusBreakdown, acceptanceRate } from '../config/appointmentStatus';
import { formatNumber, todayLabel } from '../utils/format';
import { actionLabel, logIcon } from '../config/activityLog';
import AppIcon from '../components/AppIcon.vue';
import GaugeChart from '../components/GaugeChart.vue';

const authStore = useAuthStore();
const loading = ref(false);
const errorMessage = ref('');
const stats = ref(null);
const conflictCount = ref(0);
const recentLogs = ref([]);

const today = todayLabel();
const fmt = formatNumber;

const canSeeLogs = computed(() => authStore.isSuperAdmin || authStore.isReadOnlyAdmin);

const breakdown = computed(() => statusBreakdown(stats.value?.appointments?.byStatus));
const rate = computed(() =>
  acceptanceRate(stats.value?.appointments?.byStatus, stats.value?.appointments?.total)
);

const topSpecialities = computed(() => (stats.value?.patientsBySpeciality || []).slice(0, 5));
const maxPatients = computed(() => Math.max(1, ...topSpecialities.value.map((row) => row.patientCount)));
const barWidth = (count) => Math.round((count / maxPatients.value) * 100);

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
  if (canSeeLogs.value) {
    links.push({ to: '/journaux', icon: 'fileText', label: "Journaux d'activité", desc: 'Historique des actions' });
  }
  return links;
});

onMounted(async () => {
  loading.value = true;
  try {
    const [statsResult, conflicts] = await Promise.all([
      adminService.getStats(),
      appointmentService.getConflicts(),
    ]);
    stats.value = statsResult;
    conflictCount.value = conflicts.length;

    if (canSeeLogs.value) {
      const logsResult = await adminService.getActivityLogs({ limit: 5 });
      recentLogs.value = logsResult.logs;
    }
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Impossible de charger le tableau de bord.';
  } finally {
    loading.value = false;
  }
});
</script>
