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
                <th>Statut</th>
                <th v-if="authStore.isSuperAdmin"></th>
              </tr>
            </thead>
            <tbody>
              <template v-for="patient in patients" :key="patient.id">
                <tr>
                  <td class="td--primary">
                    <div class="patient-cell">
                      <Avatar
                        :photo-url="patient.photoUrl"
                        :label="`${patient.firstName} ${patient.lastName}`"
                        :initials="getInitials(patient)"
                        muted
                      />
                      <span>{{ patient.firstName }} {{ patient.lastName }}</span>
                    </div>
                  </td>
                  <td data-label="Téléphone">{{ patient.phoneNumber }}</td>
                  <td data-label="Inscrit le">{{ formatDate(patient.createdAt) }}</td>
                  <td data-label="Statut">
                    <span class="badge" :class="patient.isActive ? 'badge--completed' : 'badge--cancelled'">
                      {{ patient.isActive ? 'Actif' : 'Accès restreint' }}
                    </span>
                  </td>
                  <td v-if="authStore.isSuperAdmin" class="td--actions">
                    <RowActions
                      :title="`${patient.firstName} ${patient.lastName}`"
                      :actions="patientActions(patient)"
                      @select="(key) => runPatientAction(key, patient)"
                    />
                  </td>
                </tr>
                <tr v-if="deletingId === patient.id">
                  <td :colspan="authStore.isSuperAdmin ? 5 : 4">
                    <div class="inline-panel">
                      <p style="margin-top: 0">
                        Confirmer la suppression de <strong>{{ patient.firstName }} {{ patient.lastName }}</strong> ?
                        Cette action est irréversible.
                      </p>
                      <p v-if="deleteError" class="alert alert--error">{{ deleteError }}</p>
                      <div class="form-actions">
                        <button class="btn btn--danger-ghost btn--sm" :disabled="deleteLoading" @click="confirmDelete(patient)">
                          {{ deleteLoading ? 'Suppression...' : 'Confirmer la suppression' }}
                        </button>
                        <button class="btn btn--ghost btn--sm" @click="deletingId = null">Annuler</button>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
              <tr v-if="patients.length === 0">
                <td colspan="5" class="empty">Aucun patient trouvé.</td>
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
import { useAuthStore } from '../store/auth.store';
import PaginationControl from '../components/PaginationControl.vue';
import SkeletonList from '../components/SkeletonList.vue';
import AppIcon from '../components/AppIcon.vue';
import RowActions from '../components/RowActions.vue';
import Avatar from '../components/Avatar.vue';
import { formatNumber } from '../utils/format';

const authStore = useAuthStore();

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

const statusBusyId = ref(null);
const deletingId = ref(null);
const deleteLoading = ref(false);
const deleteError = ref('');

const patientActions = (patient) => [
  {
    key: 'status',
    label: patient.isActive ? 'Restreindre l’accès' : 'Réactiver',
    icon: patient.isActive ? 'lock' : 'check',
    disabled: statusBusyId.value === patient.id,
  },
  { key: 'delete', label: 'Supprimer', icon: 'trash', danger: true },
];

const runPatientAction = (key, patient) => {
  if (key === 'status') toggleStatus(patient);
  else if (key === 'delete') toggleDelete(patient);
};

const toggleStatus = async (patient) => {
  statusBusyId.value = patient.id;
  try {
    await adminService.updatePatientStatus(patient.id, !patient.isActive);
    await fetchPatients(pagination.value.page);
  } finally {
    statusBusyId.value = null;
  }
};

const toggleDelete = (patient) => {
  deletingId.value = deletingId.value === patient.id ? null : patient.id;
  deleteError.value = '';
};

const confirmDelete = async (patient) => {
  deleteLoading.value = true;
  deleteError.value = '';
  try {
    await adminService.deletePatient(patient.id);
    deletingId.value = null;
    await fetchPatients(pagination.value.page);
  } catch (err) {
    deleteError.value = err.response?.data?.message || 'Impossible de supprimer ce patient.';
  } finally {
    deleteLoading.value = false;
  }
};

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
