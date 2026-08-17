<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Mon agenda</h1>
        <p class="page-subtitle">{{ pagination.total }} rendez-vous</p>
      </div>
      <select v-model="statusFilter" @change="fetchAgenda(1)" style="max-width: 200px">
        <option value="">Tous les statuts</option>
        <option value="confirmed">Confirmés</option>
        <option value="completed">Terminés</option>
        <option value="cancelled">Annulés</option>
      </select>
    </div>

    <div class="card card--flush">
      <p v-if="loading" class="state-message"><span class="spinner spinner--dark"></span> Chargement...</p>
      <p v-else-if="errorMessage" class="alert alert--error">{{ errorMessage }}</p>
      <template v-else>
        <div class="item-list">
          <div v-for="appt in appointments" :key="appt.id">
            <div class="item-row">
              <div class="item-row__main">
                <span class="item-row__title">{{ appt.patient?.firstName }} {{ appt.patient?.lastName }}</span>
                <span class="item-row__meta">{{ formatDateTime(appt.scheduledAt) }} — {{ appt.reason || 'Aucun motif précisé' }}</span>
                <span class="badge" :class="`badge--${appt.status}`">{{ statusLabel(appt.status) }}</span>
              </div>
              <div class="item-row__actions">
                <button
                  v-if="appt.status === 'confirmed'"
                  class="btn btn--ghost btn--sm"
                  @click="toggleReportForm(appt)"
                >
                  <AppIcon name="fileText" size="sm" /> Compte rendu
                </button>
              </div>
            </div>

            <div v-if="reportFormId === appt.id" class="card" style="margin-top: var(--space-2); background: var(--color-bg)">
              <div class="field">
                <label>Diagnostic</label>
                <input v-model="reportForm.diagnosis" type="text" placeholder="Diagnostic (optionnel)" />
              </div>
              <div class="field">
                <label>Notes de consultation</label>
                <textarea v-model="reportForm.notes" placeholder="Observations, recommandations..."></textarea>
              </div>
              <p v-if="reportError" class="alert alert--error">{{ reportError }}</p>
              <div class="form-actions">
                <button class="btn btn--primary btn--sm" :disabled="reportLoading" @click="submitReport(appt)">
                  {{ reportLoading ? 'Enregistrement...' : 'Enregistrer le compte rendu' }}
                </button>
                <button class="btn btn--ghost btn--sm" @click="reportFormId = null">Annuler</button>
              </div>
            </div>
          </div>
          <p v-if="appointments.length === 0" class="empty">Aucun rendez-vous.</p>
        </div>

        <PaginationControl :page="pagination.page" :total-pages="pagination.totalPages" @change="fetchAgenda" />
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import * as appointmentService from '../services/appointment.service';
import * as consultationService from '../services/consultation.service';
import PaginationControl from '../components/PaginationControl.vue';
import AppIcon from '../components/AppIcon.vue';

const appointments = ref([]);
const pagination = ref({ page: 1, totalPages: 1, total: 0, limit: 10 });
const loading = ref(false);
const errorMessage = ref('');
const statusFilter = ref('');

const reportFormId = ref(null);
const reportForm = ref({ diagnosis: '', notes: '' });
const reportLoading = ref(false);
const reportError = ref('');

const statusLabels = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  refused: 'Refusé',
  cancelled: 'Annulé',
  completed: 'Terminé',
};
const statusLabel = (status) => statusLabels[status] || status;

const formatDateTime = (value) =>
  new Date(value).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });

const fetchAgenda = async (page = 1) => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const result = await appointmentService.getAgenda({
      page,
      limit: pagination.value.limit,
      status: statusFilter.value,
    });
    appointments.value = result.appointments;
    pagination.value = result.pagination;
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Impossible de charger votre agenda.';
  } finally {
    loading.value = false;
  }
};

const toggleReportForm = (appt) => {
  reportFormId.value = reportFormId.value === appt.id ? null : appt.id;
  reportForm.value = { diagnosis: '', notes: '' };
  reportError.value = '';
};

const submitReport = async (appt) => {
  reportLoading.value = true;
  reportError.value = '';
  try {
    await consultationService.createConsultationReport({
      appointmentId: appt.id,
      diagnosis: reportForm.value.diagnosis,
      notes: reportForm.value.notes,
    });
    reportFormId.value = null;
    await fetchAgenda(pagination.value.page);
  } catch (err) {
    reportError.value = err.response?.data?.message || 'Impossible d’enregistrer ce compte rendu.';
  } finally {
    reportLoading.value = false;
  }
};

onMounted(() => fetchAgenda());
</script>
