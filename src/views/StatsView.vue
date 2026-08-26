<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Statistiques</h1>
        <p class="page-subtitle">Vue d'ensemble du système</p>
      </div>
    </div>

    <p v-if="loading" class="state-message"><span class="spinner spinner--dark"></span> Chargement...</p>
    <p v-else-if="errorMessage" class="alert alert--error">{{ errorMessage }}</p>
    <template v-else-if="stats">
      <h2 class="section-title">Utilisateurs</h2>
      <div class="stat-grid">
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
          <span class="stat-card__icon"><AppIcon name="activity" /></span>
          <div>
            <p class="stat-card__value">{{ stats.users.newThisMonth }}</p>
            <p class="stat-card__label">Nouveaux ce mois-ci</p>
          </div>
        </div>
      </div>

      <h2 class="section-title">Rendez-vous</h2>
      <div class="stat-grid">
        <div class="stat-card">
          <span class="stat-card__icon"><AppIcon name="calendar" /></span>
          <div>
            <p class="stat-card__value">{{ stats.appointments.total }}</p>
            <p class="stat-card__label">Total</p>
          </div>
        </div>
        <div v-for="(count, status) in stats.appointments.byStatus" :key="status" class="stat-card">
          <span class="stat-card__icon"><AppIcon name="clock" /></span>
          <div>
            <p class="stat-card__value">{{ count }}</p>
            <p class="stat-card__label">{{ statusLabel(status) }}</p>
          </div>
        </div>
      </div>

      <h2 class="section-title">Patients consultés par spécialité</h2>
      <div class="card card--flush">
        <div class="item-list">
          <div v-for="(row, index) in stats.patientsBySpeciality" :key="row.speciality" class="item-row">
            <div class="item-row__main">
              <span class="item-row__title">{{ index + 1 }}. {{ row.speciality }}</span>
              <div class="speciality-bar">
                <div
                  class="speciality-bar__fill"
                  :style="{ width: barWidth(row.patientCount) + '%' }"
                ></div>
              </div>
            </div>
            <span class="badge badge--neutral">{{ row.patientCount }} patient(s)</span>
          </div>
          <p v-if="!stats.patientsBySpeciality?.length" class="empty">
            Aucune consultation terminée pour le moment.
          </p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import * as adminService from '../services/admin.service';
import AppIcon from '../components/AppIcon.vue';

const stats = ref(null);
const loading = ref(false);
const errorMessage = ref('');

const statusLabels = {
  pending: 'En attente',
  confirmed: 'Confirmés',
  refused: 'Refusés',
  cancelled: 'Annulés',
  completed: 'Terminés',
};
const statusLabel = (status) => statusLabels[status] || status;

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

<style scoped>
.speciality-bar {
  width: 100%;
  max-width: 320px;
  height: 6px;
  border-radius: 999px;
  background: var(--color-border);
  overflow: hidden;
  margin-top: var(--space-1);
}
.speciality-bar__fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 999px;
}
</style>
