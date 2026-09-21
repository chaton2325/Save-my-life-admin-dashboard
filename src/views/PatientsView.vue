<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Patients</h1>
        <p class="page-subtitle">Annuaire des patients inscrits sur la plateforme</p>
      </div>
    </div>

    <div class="dash-grid kpi-strip">
      <div class="tile tile--brand kpi span-3">
        <div class="kpi__head">
          <span class="kpi__label">Patients inscrits</span>
          <span class="kpi__icon"><AppIcon name="users" /></span>
        </div>
        <div>
          <p class="kpi__value">{{ stat(stats?.users.patients) }}</p>
          <p class="kpi__meta">comptes patients</p>
        </div>
      </div>
      <div class="tile kpi span-3">
        <div class="kpi__head">
          <span class="kpi__label">Nouveaux ce mois-ci</span>
          <span class="kpi__icon"><AppIcon name="userPlus" /></span>
        </div>
        <div>
          <p class="kpi__value">{{ stat(stats?.users.newThisMonth) }}</p>
          <p class="kpi__meta">{{ newShare }}</p>
        </div>
      </div>
      <div class="tile kpi span-3">
        <div class="kpi__head">
          <span class="kpi__label">Patients par médecin</span>
          <span class="kpi__icon"><AppIcon name="userCheck" /></span>
        </div>
        <div>
          <p class="kpi__value">{{ ratio }}</p>
          <p class="kpi__meta">{{ stat(stats?.users.doctors) }} médecins</p>
        </div>
      </div>
      <div class="tile kpi span-3">
        <div class="kpi__head">
          <span class="kpi__label">Rendez-vous</span>
          <span class="kpi__icon"><AppIcon name="calendar" /></span>
        </div>
        <div>
          <p class="kpi__value">{{ stat(stats?.appointments.total) }}</p>
          <p class="kpi__meta">au total</p>
        </div>
      </div>
    </div>

    <div class="card card--flush">
      <div class="card__toolbar">
        <h2 class="card__title">Liste des patients <span class="count-chip">{{ pagination.total }}</span></h2>
        <div class="input-icon search-input">
          <AppIcon name="search" size="sm" />
          <input
            v-model="search"
            type="search"
            placeholder="Rechercher (nom, téléphone)..."
            @input="onSearchInput"
          />
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
                <th>Inscrit le</th>
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
                <td data-label="Inscrit le">{{ formatDate(patient.createdAt) }}</td>
              </tr>
              <tr v-if="patients.length === 0">
                <td colspan="3" class="empty">Aucun patient trouvé.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <PaginationControl
          :page="pagination.page"
          :total-pages="pagination.totalPages"
          @change="goToPage"
        />
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import * as adminService from '../services/admin.service';
import PaginationControl from '../components/PaginationControl.vue';
import SkeletonList from '../components/SkeletonList.vue';
import AppIcon from '../components/AppIcon.vue';
import { formatNumber } from '../utils/format';

const stats = ref(null);
const stat = (value) => (value == null ? '–' : formatNumber(value));
const ratio = computed(() => {
  const doctors = stats.value?.users.doctors;
  return doctors ? formatNumber(Math.round(stats.value.users.patients / doctors)) : '–';
});
const newShare = computed(() => {
  const total = stats.value?.users.patients;
  if (!total) return 'depuis le 1er du mois';
  return `${Math.round((stats.value.users.newThisMonth / total) * 100)} % des inscrits`;
});

const patients = ref([]);
const pagination = ref({ page: 1, totalPages: 1, total: 0, limit: 10 });
const search = ref('');
const loading = ref(false);
const errorMessage = ref('');
let searchTimeout;

const fetchPatients = async (page = 1) => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const result = await adminService.getPatients({
      page,
      limit: pagination.value.limit,
      search: search.value,
    });
    patients.value = result.patients;
    pagination.value = result.pagination;
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Impossible de charger les patients.';
  } finally {
    loading.value = false;
  }
};

const onSearchInput = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => fetchPatients(1), 400);
};

const goToPage = (page) => fetchPatients(page);

const getInitials = (patient) =>
  `${patient.firstName?.[0] || ''}${patient.lastName?.[0] || ''}`.toUpperCase();

const formatDate = (value) =>
  new Date(value).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

onMounted(() => {
  fetchPatients();
  adminService
    .getStats()
    .then((result) => {
      stats.value = result;
    })
    .catch(() => {});
});
</script>
