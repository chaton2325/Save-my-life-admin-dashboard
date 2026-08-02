<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Médecins</h1>
        <p class="page-subtitle">{{ pagination.total }} médecin(s) enregistré(s)</p>
      </div>
      <div class="input-icon search-input">
        <AppIcon name="search" size="sm" />
        <input v-model="search" type="search" placeholder="Rechercher (nom, spécialité)..." @input="onSearchInput" />
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
                <th>Médecin</th>
                <th>Spécialité</th>
                <th>Téléphone</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="doctor in doctors" :key="doctor.id">
                <td>
                  <div class="patient-cell">
                    <span class="avatar avatar--muted">{{ getInitials(doctor) }}</span>
                    <span>Dr {{ doctor.firstName }} {{ doctor.lastName }}</span>
                  </div>
                </td>
                <td>{{ doctor.speciality || '—' }}</td>
                <td>{{ doctor.phoneNumber }}</td>
              </tr>
              <tr v-if="doctors.length === 0">
                <td colspan="3" class="empty">Aucun médecin trouvé.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <PaginationControl :page="pagination.page" :total-pages="pagination.totalPages" @change="fetchDoctors" />
      </template>
    </div>

    <template v-if="authStore.canManageDoctors">
      <h2 class="section-title">Enregistrer un médecin</h2>
      <div class="card card--narrow">
        <div class="form-grid">
          <div class="field">
            <label>Prénom</label>
            <input v-model="form.firstName" type="text" />
          </div>
          <div class="field">
            <label>Nom</label>
            <input v-model="form.lastName" type="text" />
          </div>
          <div class="field">
            <label>Téléphone</label>
            <input v-model="form.phoneNumber" type="tel" placeholder="+237..." />
          </div>
          <div class="field">
            <label>Spécialité</label>
            <input v-model="form.speciality" type="text" placeholder="ex: Cardiologie" />
          </div>
        </div>
        <div class="field">
          <label>Mot de passe temporaire</label>
          <input v-model="form.password" type="password" minlength="6" />
        </div>

        <p v-if="createError" class="alert alert--error">{{ createError }}</p>
        <p v-if="createSuccess" class="alert alert--success">{{ createSuccess }}</p>
        <button class="btn btn--primary" :disabled="creating" @click="submit">
          <span v-if="creating" class="spinner"></span>
          {{ creating ? 'Enregistrement...' : 'Enregistrer le médecin' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import * as doctorService from '../services/doctor.service';
import { useAuthStore } from '../store/auth.store';
import PaginationControl from '../components/PaginationControl.vue';
import AppIcon from '../components/AppIcon.vue';

const authStore = useAuthStore();
const doctors = ref([]);
const pagination = ref({ page: 1, totalPages: 1, total: 0, limit: 10 });
const search = ref('');
const loading = ref(false);
const errorMessage = ref('');
let searchTimeout;

const form = ref({ firstName: '', lastName: '', phoneNumber: '', speciality: '', password: '' });
const creating = ref(false);
const createError = ref('');
const createSuccess = ref('');

const fetchDoctors = async (page = 1) => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const result = await doctorService.getDoctors({ page, limit: pagination.value.limit, search: search.value });
    doctors.value = result.doctors;
    pagination.value = result.pagination;
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Impossible de charger les médecins.';
  } finally {
    loading.value = false;
  }
};

const onSearchInput = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => fetchDoctors(1), 400);
};

const getInitials = (doctor) => `${doctor.firstName?.[0] || ''}${doctor.lastName?.[0] || ''}`.toUpperCase();

const submit = async () => {
  creating.value = true;
  createError.value = '';
  createSuccess.value = '';
  try {
    await doctorService.registerDoctor(form.value);
    createSuccess.value = 'Médecin enregistré avec succès.';
    form.value = { firstName: '', lastName: '', phoneNumber: '', speciality: '', password: '' };
    await fetchDoctors();
  } catch (err) {
    createError.value = err.response?.data?.message || 'Impossible d’enregistrer ce médecin.';
  } finally {
    creating.value = false;
  }
};

onMounted(() => fetchDoctors());
</script>
