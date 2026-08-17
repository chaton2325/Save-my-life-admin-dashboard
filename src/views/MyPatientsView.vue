<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Mes patients</h1>
        <p class="page-subtitle">{{ pagination.total }} patient(s)</p>
      </div>
      <div class="input-icon search-input">
        <AppIcon name="search" size="sm" />
        <input v-model="search" type="search" placeholder="Rechercher (nom, téléphone)..." @input="onSearchInput" />
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
import PaginationControl from '../components/PaginationControl.vue';
import AppIcon from '../components/AppIcon.vue';

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
    const result = await doctorService.getMyPatients({ page, limit: pagination.value.limit, search: search.value });
    patients.value = result.patients;
    pagination.value = result.pagination;
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

onMounted(() => fetchPatients());
</script>
