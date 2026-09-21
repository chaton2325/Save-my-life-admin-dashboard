<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Journaux d'activité</h1>
        <p class="page-subtitle">{{ pagination.total }} action(s) enregistrée(s)</p>
      </div>
    </div>

    <div class="card card--flush">
      <div class="card__toolbar">
        <h2 class="card__title">Historique des actions <span class="count-chip">{{ pagination.total }}</span></h2>
      </div>
      <p v-if="loading" class="state-message"><span class="spinner spinner--dark"></span> Chargement...</p>
      <p v-else-if="errorMessage" class="alert alert--error">{{ errorMessage }}</p>
      <template v-else>
        <div class="item-list">
          <div v-for="log in logs" :key="log.id" class="item-row">
            <span class="lead-icon item-row__lead"><AppIcon :name="logIcon(log.action)" /></span>
            <div class="item-row__main">
              <span class="item-row__title">{{ actionLabel(log.action) }}</span>
              <div class="meta-list">
                <span class="meta-item">
                  <AppIcon name="user" size="sm" />
                  {{ log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : 'Système' }}
                </span>
                <span class="meta-item"><AppIcon name="clock" size="sm" />{{ formatDateTime(log.createdAt) }}</span>
              </div>
            </div>
          </div>
          <p v-if="logs.length === 0" class="empty">Aucune activité enregistrée.</p>
        </div>

        <PaginationControl :page="pagination.page" :total-pages="pagination.totalPages" @change="fetchLogs" />
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import * as adminService from '../services/admin.service';
import PaginationControl from '../components/PaginationControl.vue';
import AppIcon from '../components/AppIcon.vue';
import { actionLabel, logIcon } from '../config/activityLog';

const logs = ref([]);
const pagination = ref({ page: 1, totalPages: 1, total: 0, limit: 20 });
const loading = ref(false);
const errorMessage = ref('');

const formatDateTime = (value) =>
  new Date(value).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

const fetchLogs = async (page = 1) => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const result = await adminService.getActivityLogs({ page, limit: pagination.value.limit });
    logs.value = result.logs;
    pagination.value = result.pagination;
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Impossible de charger les journaux.';
  } finally {
    loading.value = false;
  }
};

onMounted(() => fetchLogs());
</script>
