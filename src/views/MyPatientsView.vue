<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Mes patients</h1>
        <p class="page-subtitle">Patients que vous suivez</p>
      </div>
    </div>

    <div class="dash-grid kpi-strip">
      <div class="tile tile--brand kpi span-4">
        <div class="kpi__head">
          <span class="kpi__label">Patients suivis</span>
          <span class="kpi__icon"><AppIcon name="users" /></span>
        </div>
        <div>
          <p class="kpi__value">{{ totalPatients ?? '–' }}</p>
          <p class="kpi__meta">dans votre patientèle</p>
        </div>
      </div>
      <RouterLink to="/agenda" class="tile tile--link kpi span-4">
        <div class="kpi__head">
          <span class="kpi__label">Rendez-vous aujourd'hui</span>
          <span class="kpi__icon"><AppIcon name="calendar" /></span>
        </div>
        <div>
          <p class="kpi__value">{{ todayCount ?? '–' }}</p>
          <p class="kpi__meta">confirmés pour la journée</p>
        </div>
      </RouterLink>
      <RouterLink to="/demandes" class="tile tile--link kpi span-4" :class="{ 'tile--alert': pendingCount > 0 }">
        <div class="kpi__head">
          <span class="kpi__label">Demandes en attente</span>
          <span class="kpi__icon"><AppIcon name="clipboard" /></span>
        </div>
        <div>
          <p class="kpi__value">{{ pendingCount ?? '–' }}</p>
          <p class="kpi__meta">à valider ou refuser</p>
        </div>
      </RouterLink>
    </div>

    <div class="card card--flush">
      <div class="card__toolbar">
        <h2 class="card__title">Liste des patients <span class="count-chip">{{ pagination.total }}</span></h2>
        <div class="input-icon search-input">
          <AppIcon name="search" size="sm" />
          <input v-model="search" type="search" placeholder="Rechercher (nom, téléphone)..." @input="onSearchInput" />
        </div>
      </div>
      <SkeletonList v-if="loading" />
      <p v-else-if="errorMessage" class="alert alert--error">{{ errorMessage }}</p>
      <template v-else>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Téléphone</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="patient in patients" :key="patient.id">
                <td class="td--primary">
                  <div class="patient-cell">
                    <span class="avatar avatar--muted">{{ getInitials(patient) }}</span>
                    <span>{{ patient.firstName }} {{ patient.lastName }}</span>
                  </div>
                </td>
                <td data-label="Téléphone">{{ patient.phoneNumber }}</td>
                <td class="td--actions">
                  <RouterLink :to="`/mes-patients/${patient.id}`" class="btn btn--ghost btn--sm">
                    Voir l'historique
                  </RouterLink>
                </td>
              </tr>
              <tr v-if="patients.length === 0">
                <td colspan="3" class="empty">Aucun patient trouvé.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <PaginationControl :page="pagination.page" :total-pages="pagination.totalPages" @change="fetchPatients" />
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import * as doctorService from '../services/doctor.service';
import * as appointmentService from '../services/appointment.service';
import PaginationControl from '../components/PaginationControl.vue';
import SkeletonList from '../components/SkeletonList.vue';
import AppIcon from '../components/AppIcon.vue';

const patients = ref([]);
const totalPatients = ref(null);
const todayCount = ref(null);
const pendingCount = ref(null);
const pagination = ref({ page: 1, totalPages: 1, total: 0, limit: 10 });
const search = ref('');
const loading = ref(false);
const errorMessage = ref('');
let searchTimeout;

const fetchPatients = async (page = 1) => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const result = await doctorService.getMyPatients({ page, limit: pagination.value.limit, search: search.value });
    patients.value = result.patients;
    pagination.value = result.pagination;
    // Le total « patientèle » ne doit pas suivre une recherche en cours.
    if (!search.value) totalPatients.value = result.pagination.total;
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Impossible de charger vos patients.';
  } finally {
    loading.value = false;
  }
};

const onSearchInput = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => fetchPatients(1), 400);
};

const getInitials = (patient) => `${patient.firstName?.[0] || ''}${patient.lastName?.[0] || ''}`.toUpperCase();

const totalOf = (params) =>
  appointmentService
    .getAgenda({ limit: 1, ...params })
    .then((result) => result.pagination?.total ?? 0)
    .catch(() => null);

onMounted(async () => {
  fetchPatients();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  [todayCount.value, pendingCount.value] = await Promise.all([
    totalOf({ status: 'confirmed', from: start.toISOString(), to: end.toISOString() }),
    totalOf({ status: 'pending' }),
  ]);
});
</script>
