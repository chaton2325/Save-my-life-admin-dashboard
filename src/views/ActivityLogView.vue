<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Journaux d'activité</h1>
        <p class="page-subtitle">{{ pagination.total }} action(s) enregistrée(s)</p>
      </div>
    </div>

    <div class="card">
      <p v-if="loading" class="state-message"><span class="spinner spinner--dark"></span> Chargement...</p>
      <p v-else-if="errorMessage" class="alert alert--error">{{ errorMessage }}</p>
      <template v-else>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Auteur</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in logs" :key="log.id">
                <td class="td--primary">{{ actionLabel(log.action) }}</td>
                <td data-label="Auteur">
                  {{ log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : 'Système' }}
                </td>
                <td data-label="Date">{{ formatDateTime(log.createdAt) }}</td>
              </tr>
              <tr v-if="logs.length === 0">
                <td colspan="3" class="empty">Aucune activité enregistrée.</td>
              </tr>
            </tbody>
          </table>
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

const logs = ref([]);
const pagination = ref({ page: 1, totalPages: 1, total: 0, limit: 20 });
const loading = ref(false);
const errorMessage = ref('');

const actionLabels = {
  'admin.appoint_admin': 'A nommé un administrateur',
  'admin.register_doctor': 'A enregistré un médecin',
  'admin.update_doctor': 'A modifié un médecin',
  'admin.assign_patient_doctor': 'A assigné un patient à un médecin',
  'appointment.resolve_conflict': 'A résolu un conflit de rendez-vous',
};
const actionLabel = (action) => actionLabels[action] || action;

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
