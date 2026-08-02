<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Patients</h1>
        <p class="page-subtitle">{{ pagination.total }} patient(s) enregistré(s)</p>
      </div>
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

    <div class="card">
      <p v-if="loading" class="state-message">
        <span class="spinner spinner--dark"></span>
        Chargement...
      </p>
      <p v-else-if="errorMessage" class="alert alert--error">{{ errorMessage }}</p>
      <template v-else>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Téléphone</th>
                <th>Inscrit le</th>
                <th v-if="authStore.canAssignPatients"></th>
              </tr>
            </thead>
            <tbody>
              <template v-for="patient in patients" :key="patient.id">
                <tr>
                  <td>
                    <div class="patient-cell">
                      <span class="avatar avatar--muted">{{ getInitials(patient) }}</span>
                      <span>{{ patient.firstName }} {{ patient.lastName }}</span>
                    </div>
                  </td>
                  <td>{{ patient.phoneNumber }}</td>
                  <td>{{ formatDate(patient.createdAt) }}</td>
                  <td v-if="authStore.canAssignPatients">
                    <button class="btn btn--ghost btn--sm" @click="toggleAssign(patient)">
                      Assigner un médecin
                    </button>
                  </td>
                </tr>
                <tr v-if="assigningId === patient.id">
                  <td colspan="4">
                    <div class="inline-form" style="margin-bottom: 0">
                      <select v-model="selectedDoctorId" style="max-width: 280px">
                        <option value="">Choisir un médecin...</option>
                        <option v-for="doctor in doctors" :key="doctor.id" :value="doctor.id">
                          Dr {{ doctor.firstName }} {{ doctor.lastName }} — {{ doctor.speciality || 'Général' }}
                        </option>
                      </select>
                      <button class="btn btn--primary btn--sm" :disabled="!selectedDoctorId || assignLoading" @click="confirmAssign(patient)">
                        Confirmer
                      </button>
                      <button class="btn btn--ghost btn--sm" @click="assigningId = null">Annuler</button>
                    </div>
                  </td>
                </tr>
              </template>
              <tr v-if="patients.length === 0">
                <td colspan="4" class="empty">Aucun patient trouvé.</td>
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
import { ref, onMounted } from 'vue';
import * as adminService from '../services/admin.service';
import * as doctorService from '../services/doctor.service';
import { useAuthStore } from '../store/auth.store';
import PaginationControl from '../components/PaginationControl.vue';
import AppIcon from '../components/AppIcon.vue';

const authStore = useAuthStore();
const patients = ref([]);
const doctors = ref([]);
const pagination = ref({ page: 1, totalPages: 1, total: 0, limit: 10 });
const search = ref('');
const loading = ref(false);
const errorMessage = ref('');
let searchTimeout;

const assigningId = ref(null);
const selectedDoctorId = ref('');
const assignLoading = ref(false);

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

const toggleAssign = async (patient) => {
  assigningId.value = assigningId.value === patient.id ? null : patient.id;
  selectedDoctorId.value = '';
  if (assigningId.value && doctors.value.length === 0) {
    const result = await doctorService.getDoctors({ limit: 100 });
    doctors.value = result.doctors;
  }
};

const confirmAssign = async (patient) => {
  assignLoading.value = true;
  try {
    await adminService.assignPatientToDoctor(patient.id, selectedDoctorId.value);
    assigningId.value = null;
  } finally {
    assignLoading.value = false;
  }
};

onMounted(() => fetchPatients());
</script>
