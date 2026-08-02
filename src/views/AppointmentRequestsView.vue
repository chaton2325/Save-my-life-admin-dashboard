<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Demandes de rendez-vous</h1>
        <p class="page-subtitle">{{ pagination.total }} demande(s) en attente</p>
      </div>
    </div>

    <div class="card">
      <p v-if="loading" class="state-message"><span class="spinner spinner--dark"></span> Chargement...</p>
      <p v-else-if="errorMessage" class="alert alert--error">{{ errorMessage }}</p>
      <template v-else>
        <div class="item-list">
          <div v-for="appt in appointments" :key="appt.id">
            <div class="item-row">
              <div class="item-row__main">
                <span class="item-row__title">{{ appt.patient?.firstName }} {{ appt.patient?.lastName }}</span>
                <span class="item-row__meta">{{ formatDateTime(appt.scheduledAt) }} — {{ appt.reason || 'Aucun motif précisé' }}</span>
              </div>
              <div class="item-row__actions">
                <button class="btn btn--primary btn--sm" :disabled="busyId === appt.id" @click="validate(appt)">
                  <AppIcon name="check" size="sm" /> Valider
                </button>
                <button class="btn btn--danger-ghost btn--sm" @click="toggleRefuseForm(appt)">
                  <AppIcon name="x" size="sm" /> Refuser
                </button>
              </div>
            </div>

            <div v-if="refuseFormId === appt.id" class="card" style="margin-top: var(--space-2); background: var(--color-bg)">
              <div class="field">
                <label>Motif du refus (optionnel)</label>
                <textarea v-model="refusalReason"></textarea>
              </div>
              <div class="form-actions">
                <button class="btn btn--danger-ghost btn--sm" :disabled="busyId === appt.id" @click="refuse(appt)">
                  Confirmer le refus
                </button>
                <button class="btn btn--ghost btn--sm" @click="refuseFormId = null">Annuler</button>
              </div>
            </div>
          </div>
          <p v-if="appointments.length === 0" class="empty">Aucune demande en attente.</p>
        </div>

        <PaginationControl :page="pagination.page" :total-pages="pagination.totalPages" @change="fetchRequests" />
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import * as appointmentService from '../services/appointment.service';
import PaginationControl from '../components/PaginationControl.vue';
import AppIcon from '../components/AppIcon.vue';

const appointments = ref([]);
const pagination = ref({ page: 1, totalPages: 1, total: 0, limit: 10 });
const loading = ref(false);
const errorMessage = ref('');
const busyId = ref(null);
const refuseFormId = ref(null);
const refusalReason = ref('');

const formatDateTime = (value) =>
  new Date(value).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });

const fetchRequests = async (page = 1) => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const result = await appointmentService.getAgenda({ page, limit: pagination.value.limit, status: 'pending' });
    appointments.value = result.appointments;
    pagination.value = result.pagination;
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Impossible de charger les demandes.';
  } finally {
    loading.value = false;
  }
};

const validate = async (appt) => {
  busyId.value = appt.id;
  try {
    await appointmentService.validateAppointment(appt.id);
    await fetchRequests(pagination.value.page);
  } finally {
    busyId.value = null;
  }
};

const toggleRefuseForm = (appt) => {
  refuseFormId.value = refuseFormId.value === appt.id ? null : appt.id;
  refusalReason.value = '';
};

const refuse = async (appt) => {
  busyId.value = appt.id;
  try {
    await appointmentService.refuseAppointment(appt.id, refusalReason.value);
    refuseFormId.value = null;
    await fetchRequests(pagination.value.page);
  } finally {
    busyId.value = null;
  }
};

onMounted(() => fetchRequests());
</script>
