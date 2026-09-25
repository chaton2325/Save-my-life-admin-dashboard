<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Opticiens</h1>
        <p class="page-subtitle">Annuaire des opticiens et de leurs cliniques de rattachement</p>
      </div>
    </div>

    <div class="dash-grid kpi-strip">
      <div class="tile tile--brand kpi span-3">
        <div class="kpi__head">
          <span class="kpi__label">Opticiens</span>
          <span class="kpi__icon"><AppIcon name="eye" /></span>
        </div>
        <div>
          <p class="kpi__value">{{ stat(stats?.users.opticians) }}</p>
          <p class="kpi__meta">comptes enregistrés</p>
        </div>
      </div>
      <div class="tile kpi span-3">
        <div class="kpi__head">
          <span class="kpi__label">Cliniques</span>
          <span class="kpi__icon"><AppIcon name="building" /></span>
        </div>
        <div>
          <p class="kpi__value">{{ stat(clinicsTotal) }}</p>
          <p class="kpi__meta">structures de rattachement</p>
        </div>
      </div>
      <div class="tile kpi span-3">
        <div class="kpi__head">
          <span class="kpi__label">Spécialités actives</span>
          <span class="kpi__icon"><AppIcon name="clipboard" /></span>
        </div>
        <div>
          <p class="kpi__value">{{ specialities.length ? activeSpecialities.length : '–' }}</p>
          <p class="kpi__meta">proposées aux patients</p>
        </div>
      </div>
      <div class="tile kpi span-3">
        <div class="kpi__head">
          <span class="kpi__label">Patients par opticien</span>
          <span class="kpi__icon"><AppIcon name="users" /></span>
        </div>
        <div>
          <p class="kpi__value">{{ ratio }}</p>
          <p class="kpi__meta">{{ stat(stats?.users.patients) }} patients</p>
        </div>
      </div>
    </div>

    <div class="card card--flush">
      <div class="card__toolbar">
        <h2 class="card__title">Liste des opticiens <span class="count-chip">{{ pagination.total }}</span></h2>
        <div class="input-icon search-input">
          <AppIcon name="search" size="sm" />
          <input v-model="search" type="search" placeholder="Rechercher (nom, spécialité)..." @input="onSearchInput" />
        </div>
      </div>
      <SkeletonList v-if="loading" />
      <p v-else-if="errorMessage" class="alert alert--error">{{ errorMessage }}</p>
      <template v-else>
        <div class="item-list">
          <div v-for="optician in opticians" :key="optician.id">
            <div class="item-row">
              <Avatar
                class="item-row__lead"
                :photo-url="optician.photoUrl"
                :label="doctorLabel(optician)"
                :initials="initialsOf(optician)"
                :muted="!optician.isActive"
              />
              <div class="item-row__main">
                <div class="item-row__heading">
                  <span class="item-row__title">{{ doctorLabel(optician) }}</span>
                  <span class="badge" :class="optician.isActive ? 'badge--completed' : 'badge--cancelled'">
                    {{ optician.isActive ? 'Actif' : 'Accès restreint' }}
                  </span>
                </div>
                <div class="chips">
                  <span class="chip">{{ optician.speciality || 'Optique générale' }}</span>
                </div>
                <div class="meta-list">
                  <span class="meta-item"><AppIcon name="phone" size="sm" />{{ optician.phoneNumber }}</span>
                  <span v-if="optician.clinic" class="meta-item">
                    <AppIcon name="building" size="sm" />{{ optician.clinic.name }}
                  </span>
                  <span v-if="optician.medicalOrderNumber" class="meta-item">
                    <AppIcon name="fileText" size="sm" />Ordre : {{ optician.medicalOrderNumber }}
                  </span>
                </div>
              </div>
              <RowActions
                :title="doctorLabel(optician)"
                :actions="opticianActions(optician)"
                @select="(key) => runOpticianAction(key, optician)"
              />
            </div>

            <div v-if="editingId === optician.id" class="inline-panel">
              <AvatarUpload
                :photo-url="optician.photoUrl"
                :label="doctorLabel(optician)"
                :initials="initialsOf(optician)"
                :uploading="photoBusyId === optician.id"
                style="margin-bottom: var(--space-4)"
                @select="(file) => uploadPhoto(optician, file)"
              />
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
                    <option value="">Optique générale</option>
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
                <label>N° d'inscription à l'ordre</label>
                <input v-model="editForm.medicalOrderNumber" type="text" />
              </div>
              <p v-if="editError" class="alert alert--error">{{ editError }}</p>
              <div class="form-actions">
                <button class="btn btn--primary btn--sm" :disabled="editLoading" @click="submitEdit(optician)">
                  {{ editLoading ? 'Enregistrement...' : 'Enregistrer' }}
                </button>
                <button class="btn btn--ghost btn--sm" @click="editingId = null">Annuler</button>
              </div>
            </div>

            <div v-if="deletingId === optician.id" class="inline-panel">
              <p style="margin-top: 0">
                Confirmer la suppression de <strong>{{ doctorLabel(optician) }}</strong> ?
                Cette action est irréversible.
              </p>
              <p v-if="deleteError" class="alert alert--error">{{ deleteError }}</p>
              <div class="form-actions">
                <button class="btn btn--danger-ghost btn--sm" :disabled="deleteLoading" @click="confirmDelete(optician)">
                  {{ deleteLoading ? 'Suppression...' : 'Confirmer la suppression' }}
                </button>
                <button class="btn btn--ghost btn--sm" @click="deletingId = null">Annuler</button>
              </div>
            </div>
          </div>
          <p v-if="opticians.length === 0" class="empty">Aucun opticien trouvé.</p>
        </div>

        <PaginationControl :page="pagination.page" :total-pages="pagination.totalPages" @change="fetchOpticians" />
      </template>
    </div>

    <CreatePanel
      v-if="authStore.canManageOpticians"
      title="Enregistrer un opticien"
      trigger-label="Nouvel opticien"
    >
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
            <option value="">Optique générale</option>
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
        <label>N° d'inscription à l'ordre</label>
        <input v-model="form.medicalOrderNumber" type="text" placeholder="ex: ONMC-12345" />
      </div>
      <div class="field">
        <label>Mot de passe temporaire</label>
        <input v-model="form.password" type="password" minlength="6" />
      </div>

      <p v-if="createError" class="alert alert--error">{{ createError }}</p>
      <p v-if="createSuccess" class="alert alert--success">{{ createSuccess }}</p>
      <button class="btn btn--primary btn--block" :disabled="creating" @click="submit">
        <span v-if="creating" class="spinner"></span>
        {{ creating ? 'Enregistrement...' : "Enregistrer l'opticien" }}
      </button>
    </CreatePanel>

    <Modal v-if="viewingOptician" :title="doctorLabel(viewingOptician)" @close="viewingOptician = null">
      <Avatar
        size="lg"
        :photo-url="viewingOptician.photoUrl"
        :label="doctorLabel(viewingOptician)"
        :initials="initialsOf(viewingOptician)"
        :muted="!viewingOptician.isActive"
        style="margin-bottom: var(--space-4)"
      />
      <dl class="profile-list">
        <div class="profile-row">
          <dt>Statut</dt>
          <dd>
            <span class="badge" :class="viewingOptician.isActive ? 'badge--completed' : 'badge--cancelled'">
              {{ viewingOptician.isActive ? 'Actif' : 'Accès restreint' }}
            </span>
          </dd>
        </div>
        <div class="profile-row">
          <dt>Spécialité</dt>
          <dd>{{ viewingOptician.speciality || 'Optique générale' }}</dd>
        </div>
        <div class="profile-row" v-if="viewingOptician.medicalOrderNumber">
          <dt>N° d'inscription à l'ordre</dt>
          <dd>{{ viewingOptician.medicalOrderNumber }}</dd>
        </div>
        <div class="profile-row" v-if="viewingOptician.clinic">
          <dt>Clinique</dt>
          <dd>
            {{ viewingOptician.clinic.name }}<template v-if="viewingOptician.clinic.address"> — {{ viewingOptician.clinic.address }}</template>
            <button class="btn btn--ghost btn--sm" style="margin-left: var(--space-2)" @click="viewClinicFromOptician">
              <AppIcon name="building" size="sm" /> Voir la clinique
            </button>
          </dd>
        </div>
        <div class="profile-row">
          <dt>Téléphone</dt>
          <dd>{{ viewingOptician.phoneNumber }}</dd>
        </div>
        <div class="profile-row" v-if="viewingOptician.email">
          <dt>Email</dt>
          <dd>{{ viewingOptician.email }}</dd>
        </div>
        <div class="profile-row">
          <dt>Inscrit le</dt>
          <dd>{{ formatDate(viewingOptician.createdAt) }}</dd>
        </div>
      </dl>
    </Modal>

    <ClinicDetailModal v-if="viewingClinic" :clinic="viewingClinic" @close="viewingClinic = null" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import * as doctorService from '../services/doctor.service';
import * as clinicService from '../services/clinic.service';
import * as specialityService from '../services/speciality.service';
import * as adminService from '../services/admin.service';
import { formatNumber, initialsOf, doctorLabel } from '../utils/format';
import { useAuthStore } from '../store/auth.store';
import PaginationControl from '../components/PaginationControl.vue';
import SkeletonList from '../components/SkeletonList.vue';
import AppIcon from '../components/AppIcon.vue';
import Modal from '../components/Modal.vue';
import ClinicDetailModal from '../components/ClinicDetailModal.vue';
import CreatePanel from '../components/CreatePanel.vue';
import RowActions from '../components/RowActions.vue';
import Avatar from '../components/Avatar.vue';
import AvatarUpload from '../components/AvatarUpload.vue';

const authStore = useAuthStore();
const photoBusyId = ref(null);

const uploadPhoto = async (optician, file) => {
  photoBusyId.value = optician.id;
  try {
    const updated = await doctorService.uploadDoctorPhoto(optician.id, file);
    optician.photoUrl = updated.photoUrl;
  } catch (err) {
    editError.value = err.response?.data?.message || "Impossible d'envoyer cette photo.";
  } finally {
    photoBusyId.value = null;
  }
};
const opticians = ref([]);
const viewingOptician = ref(null);
const viewingClinic = ref(null);

const viewClinicFromOptician = () => {
  viewingClinic.value = viewingOptician.value.clinic;
  viewingOptician.value = null;
};
const clinics = ref([]);
const clinicsTotal = ref(null);
const stats = ref(null);
const stat = (value) => (value == null ? '–' : formatNumber(value));
const ratio = computed(() => {
  const opticiansCount = stats.value?.users.opticians;
  return opticiansCount ? formatNumber(Math.round(stats.value.users.patients / opticiansCount)) : '–';
});
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
  clinicsTotal.value = result.pagination?.total ?? result.clinics.length;
};

const fetchSpecialities = async () => {
  specialities.value = await specialityService.getSpecialities();
};

const statusBusyId = ref(null);

const opticianActions = (optician) => {
  const actions = [{ key: 'view', label: 'Voir', icon: 'eye' }];
  if (authStore.canManageOpticians) {
    actions.push(
      { key: 'edit', label: 'Modifier', icon: 'edit' },
      {
        key: 'status',
        label: optician.isActive ? 'Restreindre l’accès' : 'Réactiver',
        icon: optician.isActive ? 'lock' : 'check',
        disabled: statusBusyId.value === optician.id,
      },
      { key: 'delete', label: 'Supprimer', icon: 'trash', danger: true }
    );
  }
  return actions;
};

const runOpticianAction = (key, optician) => {
  if (key === 'view') viewingOptician.value = optician;
  else if (key === 'edit') toggleEdit(optician);
  else if (key === 'status') toggleStatus(optician);
  else if (key === 'delete') toggleDelete(optician);
};

const deletingId = ref(null);
const deleteLoading = ref(false);
const deleteError = ref('');

const fetchOpticians = async (page = 1) => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const result = await doctorService.getDoctors({
      page,
      limit: pagination.value.limit,
      search: search.value,
      isOptician: true,
    });
    opticians.value = result.doctors;
    pagination.value = result.pagination;
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Impossible de charger les opticiens.';
  } finally {
    loading.value = false;
  }
};

const onSearchInput = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => fetchOpticians(1), 400);
};

const formatDate = (value) =>
  new Date(value).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

const submit = async () => {
  creating.value = true;
  createError.value = '';
  createSuccess.value = '';
  try {
    await doctorService.registerDoctor({ ...form.value, clinicId: form.value.clinicId || null, isOptician: true });
    createSuccess.value = 'Opticien enregistré avec succès.';
    form.value = emptyForm();
    await fetchOpticians();
  } catch (err) {
    createError.value = err.response?.data?.message || 'Impossible d’enregistrer cet opticien.';
  } finally {
    creating.value = false;
  }
};

const toggleEdit = (optician) => {
  editingId.value = editingId.value === optician.id ? null : optician.id;
  deletingId.value = null;
  editError.value = '';
  editForm.value = {
    firstName: optician.firstName,
    lastName: optician.lastName,
    speciality: optician.speciality || '',
    medicalOrderNumber: optician.medicalOrderNumber || '',
    clinicId: optician.clinicId || '',
  };
};

const submitEdit = async (optician) => {
  editLoading.value = true;
  editError.value = '';
  try {
    await doctorService.updateDoctor(optician.id, { ...editForm.value, clinicId: editForm.value.clinicId || null });
    editingId.value = null;
    await fetchOpticians(pagination.value.page);
  } catch (err) {
    editError.value = err.response?.data?.message || 'Impossible de modifier cet opticien.';
  } finally {
    editLoading.value = false;
  }
};

const toggleStatus = async (optician) => {
  statusBusyId.value = optician.id;
  try {
    await doctorService.updateDoctorStatus(optician.id, !optician.isActive);
    await fetchOpticians(pagination.value.page);
  } finally {
    statusBusyId.value = null;
  }
};

const toggleDelete = (optician) => {
  deletingId.value = deletingId.value === optician.id ? null : optician.id;
  editingId.value = null;
  deleteError.value = '';
};

const confirmDelete = async (optician) => {
  deleteLoading.value = true;
  deleteError.value = '';
  try {
    await doctorService.deleteDoctor(optician.id);
    deletingId.value = null;
    await fetchOpticians(pagination.value.page);
  } catch (err) {
    deleteError.value = err.response?.data?.message || 'Impossible de supprimer cet opticien.';
  } finally {
    deleteLoading.value = false;
  }
};

onMounted(() => {
  fetchOpticians();
  fetchClinics();
  fetchSpecialities();
  adminService
    .getStats()
    .then((result) => {
      stats.value = result;
    })
    .catch(() => {});
});
</script>
