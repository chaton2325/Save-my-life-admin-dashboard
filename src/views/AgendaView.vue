<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Mon agenda</h1>
        <p class="page-subtitle">{{ pagination.total }} rendez-vous</p>
      </div>
      <select v-model="statusFilter" class="page-header__filter" @change="fetchAgenda(1)">
        <option value="">Tous les statuts</option>
        <option value="confirmed">Confirmés</option>
        <option value="completed">Terminés</option>
        <option value="cancelled">Annulés</option>
      </select>
    </div>

    <div class="dash-grid kpi-strip">
      <div class="tile tile--brand kpi span-3">
        <div class="kpi__head">
          <span class="kpi__label">Aujourd'hui</span>
          <span class="kpi__icon"><AppIcon name="calendar" /></span>
        </div>
        <div>
          <p class="kpi__value">{{ counts.today ?? '–' }}</p>
          <p class="kpi__meta">rendez-vous prévus</p>
        </div>
      </div>
      <button
        v-for="item in filterTiles"
        :key="item.status"
        type="button"
        class="tile tile--link kpi span-3"
        :class="{ 'is-active': statusFilter === item.status }"
        :aria-pressed="statusFilter === item.status"
        @click="toggleFilter(item.status)"
      >
        <div class="kpi__head">
          <span class="kpi__label">{{ item.label }}</span>
          <span class="kpi__icon"><AppIcon :name="item.icon" /></span>
        </div>
        <div>
          <p class="kpi__value">{{ counts[item.status] ?? '–' }}</p>
          <p class="kpi__meta">{{ item.meta }}</p>
        </div>
      </button>
    </div>

    <div class="card card--flush">
      <SkeletonList v-if="loading" />
      <p v-else-if="errorMessage" class="alert alert--error">{{ errorMessage }}</p>
      <template v-else>
        <div class="item-list">
          <div v-for="appt in appointments" :key="appt.id">
            <div class="item-row">
              <div class="date-chip item-row__lead" :class="`date-chip--${appt.status}`" aria-hidden="true">
                <span class="date-chip__day">{{ dateParts(appt.scheduledAt).day }}</span>
                <span class="date-chip__month">{{ dateParts(appt.scheduledAt).month }}</span>
                <span class="date-chip__time">{{ dateParts(appt.scheduledAt).time }}</span>
              </div>
              <div class="item-row__main">
                <div class="item-row__heading">
                  <span class="item-row__title">{{ appt.patient?.firstName }} {{ appt.patient?.lastName }}</span>
                  <span class="badge" :class="`badge--${appt.status}`">{{ statusLabel(appt.status) }}</span>
                </div>
                <div class="meta-list">
                  <span v-if="appt.patient?.phoneNumber" class="meta-item">
                    <AppIcon name="phone" size="sm" />{{ appt.patient.phoneNumber }}
                  </span>
                  <span class="meta-item"><AppIcon name="clipboard" size="sm" />{{ appt.reason || 'Aucun motif précisé' }}</span>
                </div>
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

            <div v-if="reportFormId === appt.id" class="inline-panel">
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
import SkeletonList from '../components/SkeletonList.vue';
import AppIcon from '../components/AppIcon.vue';
import { dateParts } from '../utils/format';

const appointments = ref([]);
const pagination = ref({ page: 1, totalPages: 1, total: 0, limit: 10 });
const loading = ref(false);
const errorMessage = ref('');
const statusFilter = ref('');

const counts = ref({ today: null, confirmed: null, completed: null, cancelled: null });
const filterTiles = [
  { status: 'confirmed', label: 'À venir', icon: 'clock', meta: 'rendez-vous confirmés' },
  { status: 'completed', label: 'Terminés', icon: 'check', meta: 'consultations réalisées' },
  { status: 'cancelled', label: 'Annulés', icon: 'x', meta: 'rendez-vous annulés' },
];

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

// Un compteur sert aussi de filtre : un second clic le désactive.
const toggleFilter = (status) => {
  statusFilter.value = statusFilter.value === status ? '' : status;
  fetchAgenda(1);
};

// Un appel par compteur, limité à 1 ligne : seul le total de la pagination nous intéresse.
const fetchCounts = async () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  const totalOf = (params) =>
    appointmentService
      .getAgenda({ limit: 1, ...params })
      .then((result) => result.pagination?.total ?? 0)
      .catch(() => null);

  const [today, confirmed, completed, cancelled] = await Promise.all([
    totalOf({ status: 'confirmed', from: start.toISOString(), to: end.toISOString() }),
    totalOf({ status: 'confirmed' }),
    totalOf({ status: 'completed' }),
    totalOf({ status: 'cancelled' }),
  ]);
  counts.value = { today, confirmed, completed, cancelled };
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
    await Promise.all([fetchAgenda(pagination.value.page), fetchCounts()]);
  } catch (err) {
    reportError.value = err.response?.data?.message || 'Impossible d’enregistrer ce compte rendu.';
  } finally {
    reportLoading.value = false;
  }
};

onMounted(() => {
  fetchAgenda();
  fetchCounts();
});
</script>
