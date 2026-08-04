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
        <div class="item-list">
          <div v-for="doctor in doctors" :key="doctor.id">
            <div class="item-row">
              <div class="item-row__main">
                <span class="item-row__title">Dr {{ doctor.firstName }} {{ doctor.lastName }}</span>
                <span class="item-row__meta">
                  {{ doctor.speciality || 'Médecine générale' }} — {{ doctor.phoneNumber }}
                  <template v-if="doctor.clinic"> — {{ doctor.clinic.name }}</template>
                </span>
                <span class="item-row__meta" v-if="doctor.medicalOrderNumber">
                  N° Ordre des médecins du Cameroun : {{ doctor.medicalOrderNumber }}
                </span>
                <span class="badge" :class="doctor.isActive ? 'badge--completed' : 'badge--cancelled'">
                  {{ doctor.isActive ? 'Actif' : 'Accès restreint' }}
                </span>
              </div>
              <div v-if="authStore.canManageDoctors" class="item-row__actions">
                <button class="btn btn--ghost btn--sm" @click="toggleEdit(doctor)">
                  <AppIcon name="edit" size="sm" /> Modifier
                </button>
                <button
                  class="btn btn--ghost btn--sm"
                  :disabled="statusBusyId === doctor.id"
                  @click="toggleStatus(doctor)"
                >
                  {{ doctor.isActive ? 'Restreindre l’accès' : 'Réactiver' }}
                </button>
                <button class="btn btn--danger-ghost btn--sm" @click="toggleDelete(doctor)">
                  <AppIcon name="x" size="sm" /> Supprimer
                </button>
              </div>
            </div>

            <div v-if="editingId === doctor.id" class="card" style="margin-top: var(--space-2); background: var(--color-bg)">
              <div class="form-grid">
                <div class="field">
                  <label>Prénom</label>
                  <input v-model="editForm.firstName" type="text" />
                </div>
                <div class="field">
                  <label>Nom</label>
                  <input v-model="editForm.lastName" type="text" />
                </div>
              </div>
              <div class="form-grid">
                <div class="field">
                  <label>Spécialité</label>
                  <select v-model="editForm.speciality">
                    <option value="">Médecine générale</option>
                    <option v-for="s in specialities" :key="s.id" :value="s.name">
                      {{ s.name }}{{ s.isActive ? '' : ' (désactivée)' }}
                    </option>
                  </select>
                </div>
                <div class="field">
                  <label>Clinique</label>
                  <select v-model="editForm.clinicId">
                    <option value="">Aucune</option>
                    <option v-for="clinic in clinics" :key="clinic.id" :value="clinic.id">{{ clinic.name }}</option>
                  </select>
                </div>
              </div>
              <div class="field">
                <label>N° d'inscription à l'Ordre des médecins du Cameroun</label>
                <input v-model="editForm.medicalOrderNumber" type="text" />
              </div>
              <p v-if="editError" class="alert alert--error">{{ editError }}</p>
              <div class="form-actions">
                <button class="btn btn--primary btn--sm" :disabled="editLoading" @click="submitEdit(doctor)">
                  {{ editLoading ? 'Enregistrement...' : 'Enregistrer' }}
                </button>
                <button class="btn btn--ghost btn--sm" @click="editingId = null">Annuler</button>
              </div>
            </div>

            <div v-if="deletingId === doctor.id" class="card" style="margin-top: var(--space-2); background: var(--color-bg)">
              <p style="margin-top: 0">
                Confirmer la suppression de <strong>Dr {{ doctor.firstName }} {{ doctor.lastName }}</strong> ?
                Cette action est irréversible.
              </p>
              <p v-if="deleteError" class="alert alert--error">{{ deleteError }}</p>
              <div class="form-actions">
                <button class="btn btn--danger-ghost btn--sm" :disabled="deleteLoading" @click="confirmDelete(doctor)">
                  {{ deleteLoading ? 'Suppression...' : 'Confirmer la suppression' }}
                </button>
                <button class="btn btn--ghost btn--sm" @click="deletingId = null">Annuler</button>
              </div>
            </div>
          </div>
          <p v-if="doctors.length === 0" class="empty">Aucun médecin trouvé.</p>
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
            <select v-model="form.speciality">
              <option value="">Médecine générale</option>
              <option v-for="s in activeSpecialities" :key="s.id" :value="s.name">{{ s.name }}</option>
            </select>
          </div>
          <div class="field">
            <label>Clinique</label>
            <select v-model="form.clinicId">
              <option value="">Aucune (à rattacher plus tard)</option>
              <option v-for="clinic in clinics" :key="clinic.id" :value="clinic.id">{{ clinic.name }}</option>
            </select>
          </div>
        </div>
        <div class="field">
          <label>N° d'inscription à l'Ordre des médecins du Cameroun</label>
          <input v-model="form.medicalOrderNumber" type="text" placeholder="ex: ONMC-12345" />
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
import { ref, computed, onMounted } from 'vue';
import * as doctorService from '../services/doctor.service';
import * as clinicService from '../services/clinic.service';
import * as specialityService from '../services/speciality.service';
import { useAuthStore } from '../store/auth.store';
import PaginationControl from '../components/PaginationControl.vue';
import AppIcon from '../components/AppIcon.vue';

const authStore = useAuthStore();
const doctors = ref([]);
const clinics = ref([]);
const specialities = ref([]);
const activeSpecialities = computed(() => specialities.value.filter((s) => s.isActive));
const pagination = ref({ page: 1, totalPages: 1, total: 0, limit: 10 });
const search = ref('');
const loading = ref(false);
const errorMessage = ref('');
let searchTimeout;

const emptyForm = () => ({
  firstName: '',
  lastName: '',
  phoneNumber: '',
  speciality: '',
  medicalOrderNumber: '',
  clinicId: '',
  password: '',
});

const form = ref(emptyForm());
const creating = ref(false);
const createError = ref('');
const createSuccess = ref('');

const editingId = ref(null);
const editForm = ref({ firstName: '', lastName: '', speciality: '', medicalOrderNumber: '', clinicId: '' });
const editLoading = ref(false);
const editError = ref('');

const fetchClinics = async () => {
  const result = await clinicService.getClinics({ limit: 100 });
  clinics.value = result.clinics;
};

const fetchSpecialities = async () => {
  specialities.value = await specialityService.getSpecialities();
};

const statusBusyId = ref(null);

const deletingId = ref(null);
const deleteLoading = ref(false);
const deleteError = ref('');

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

const submit = async () => {
  creating.value = true;
  createError.value = '';
  createSuccess.value = '';
  try {
    await doctorService.registerDoctor({ ...form.value, clinicId: form.value.clinicId || null });
    createSuccess.value = 'Médecin enregistré avec succès.';
    form.value = emptyForm();
    await fetchDoctors();
  } catch (err) {
    createError.value = err.response?.data?.message || 'Impossible d’enregistrer ce médecin.';
  } finally {
    creating.value = false;
  }
};

const toggleEdit = (doctor) => {
  editingId.value = editingId.value === doctor.id ? null : doctor.id;
  deletingId.value = null;
  editError.value = '';
  editForm.value = {
    firstName: doctor.firstName,
    lastName: doctor.lastName,
    speciality: doctor.speciality || '',
    medicalOrderNumber: doctor.medicalOrderNumber || '',
    clinicId: doctor.clinicId || '',
  };
};

const submitEdit = async (doctor) => {
  editLoading.value = true;
  editError.value = '';
  try {
    await doctorService.updateDoctor(doctor.id, { ...editForm.value, clinicId: editForm.value.clinicId || null });
    editingId.value = null;
    await fetchDoctors(pagination.value.page);
  } catch (err) {
    editError.value = err.response?.data?.message || 'Impossible de modifier ce médecin.';
  } finally {
    editLoading.value = false;
  }
};

const toggleStatus = async (doctor) => {
  statusBusyId.value = doctor.id;
  try {
    await doctorService.updateDoctorStatus(doctor.id, !doctor.isActive);
    await fetchDoctors(pagination.value.page);
  } finally {
    statusBusyId.value = null;
  }
};

const toggleDelete = (doctor) => {
  deletingId.value = deletingId.value === doctor.id ? null : doctor.id;
  editingId.value = null;
  deleteError.value = '';
};

const confirmDelete = async (doctor) => {
  deleteLoading.value = true;
  deleteError.value = '';
  try {
    await doctorService.deleteDoctor(doctor.id);
    deletingId.value = null;
    await fetchDoctors(pagination.value.page);
  } catch (err) {
    deleteError.value = err.response?.data?.message || 'Impossible de supprimer ce médecin.';
  } finally {
    deleteLoading.value = false;
  }
};

onMounted(() => {
  fetchDoctors();
  fetchClinics();
  fetchSpecialities();
});
</script>
