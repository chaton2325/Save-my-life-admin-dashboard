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
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
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
