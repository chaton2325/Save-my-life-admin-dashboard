<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Statistiques</h1>
        <p class="page-subtitle">Vue d'ensemble du système</p>
      </div>
      <span class="page-date"><AppIcon name="calendar" size="sm" /> {{ today }}</span>
    </div>

    <p v-if="loading" class="state-message"><span class="spinner spinner--dark"></span> Chargement...</p>
    <p v-else-if="errorMessage" class="alert alert--error">{{ errorMessage }}</p>

    <template v-else-if="stats">
      <h2 class="section-title">Utilisateurs</h2>
      <div class="dash-grid">
        <div class="tile tile--brand kpi span-3">
          <div class="kpi__head">
            <span class="kpi__label">Patients</span>
            <span class="kpi__icon"><AppIcon name="users" /></span>
          </div>
          <p class="kpi__value">{{ fmt(stats.users.patients) }}</p>
        </div>
        <div class="tile kpi span-3">
          <div class="kpi__head">
            <span class="kpi__label">Médecins</span>
            <span class="kpi__icon"><AppIcon name="userCheck" /></span>
          </div>
          <p class="kpi__value">{{ fmt(stats.users.doctors) }}</p>
        </div>
        <div class="tile kpi span-3">
          <div class="kpi__head">
            <span class="kpi__label">Administrateurs</span>
            <span class="kpi__icon"><AppIcon name="userPlus" /></span>
          </div>
          <p class="kpi__value">{{ fmt(stats.users.admins) }}</p>
        </div>
        <div class="tile kpi span-3">
          <div class="kpi__head">
            <span class="kpi__label">Nouveaux ce mois-ci</span>
            <span class="kpi__icon"><AppIcon name="activity" /></span>
          </div>
          <p class="kpi__value">{{ fmt(stats.users.newThisMonth) }}</p>
        </div>
      </div>

      <h2 class="section-title">Rendez-vous</h2>
      <div class="dash-grid">
        <section class="tile span-7">
          <div class="tile__head">
            <h2 class="tile__title">Répartition par statut</h2>
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

        <section class="tile span-5">
          <div class="tile__head">
            <h2 class="tile__title">Taux d'aboutissement</h2>
          </div>
          <GaugeChart :value="rate" label="Rendez-vous confirmés ou terminés" />
        </section>
      </div>

      <h2 class="section-title">Patients consultés par spécialité</h2>
      <section class="tile">
        <ul v-if="stats.patientsBySpeciality?.length" class="rank-list">
          <li class="rank-list__head">
            <span>Spécialité</span>
            <span>Patients</span>
          </li>
          <li v-for="(row, index) in stats.patientsBySpeciality" :key="row.speciality" class="rank-list__row">
            <span class="rank-list__name">
              {{ index + 1 }}. {{ row.speciality }}
              <span class="rank-list__bar"><i :style="{ width: barWidth(row.patientCount) + '%' }"></i></span>
            </span>
            <span class="rank-list__value">{{ fmt(row.patientCount) }}</span>
          </li>
        </ul>
        <p v-else class="empty">Aucune consultation terminée pour le moment.</p>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import * as adminService from '../services/admin.service';
import { statusBreakdown, acceptanceRate } from '../config/appointmentStatus';
import { formatNumber, todayLabel } from '../utils/format';
import AppIcon from '../components/AppIcon.vue';
import GaugeChart from '../components/GaugeChart.vue';

const stats = ref(null);
const loading = ref(false);
const errorMessage = ref('');

const today = todayLabel();
const fmt = formatNumber;

const breakdown = computed(() => statusBreakdown(stats.value?.appointments?.byStatus));
const rate = computed(() =>
  acceptanceRate(stats.value?.appointments?.byStatus, stats.value?.appointments?.total)
);

const maxPatientsBySpeciality = computed(() =>
  Math.max(1, ...(stats.value?.patientsBySpeciality || []).map((row) => row.patientCount))
);
const barWidth = (count) => Math.round((count / maxPatientsBySpeciality.value) * 100);

onMounted(async () => {
  loading.value = true;
  try {
    stats.value = await adminService.getStats();
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Impossible de charger les statistiques.';
  } finally {
    loading.value = false;
  }
});
</script>
