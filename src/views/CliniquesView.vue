<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Cliniques</h1>
        <p class="page-subtitle">{{ pagination.total }} clinique(s) enregistrée(s)</p>
      </div>
      <div class="input-icon search-input">
        <AppIcon name="search" size="sm" />
        <input v-model="search" type="search" placeholder="Rechercher (nom, ville)..." @input="onSearchInput" />
      </div>
    </div>

    <div class="card card--flush">
      <SkeletonList v-if="loading" />
      <p v-else-if="errorMessage" class="alert alert--error">{{ errorMessage }}</p>
      <template v-else>
        <div class="item-list">
          <div v-for="clinic in clinics" :key="clinic.id">
            <div class="item-row">
              <div class="item-row__main">
                <span class="item-row__title">{{ clinic.name }}</span>
                <span class="item-row__meta">
                  {{ clinic.address }}<template v-if="clinic.city"> — {{ clinic.city }}</template>
                  · {{ (clinic.doctors || []).length }} médecin(s)
                </span>
                <span class="badge" :class="clinic.isActive ? 'badge--completed' : 'badge--cancelled'">
                  {{ clinic.isActive ? 'Active' : 'Désactivée' }}
                </span>
              </div>
              <div class="item-row__actions">
                <button class="btn btn--ghost btn--sm" @click="toggleEdit(clinic)">
                  <AppIcon name="edit" size="sm" /> Modifier
                </button>
                <button class="btn btn--danger-ghost btn--sm" @click="toggleDelete(clinic)">
                  <AppIcon name="x" size="sm" /> Supprimer
                </button>
              </div>
            </div>

            <div v-if="editingId === clinic.id" class="card" style="margin-top: var(--space-2); background: var(--color-bg)">
              <ClinicForm v-model="editForm" />
              <div class="field">
                <label>
                  <input v-model="editForm.isActive" type="checkbox" style="width: auto; margin-right: var(--space-2)" />
                  Clinique active
                </label>
              </div>
              <p v-if="editError" class="alert alert--error">{{ editError }}</p>
              <div class="form-actions">
                <button class="btn btn--primary btn--sm" :disabled="editLoading" @click="submitEdit(clinic)">
                  {{ editLoading ? 'Enregistrement...' : 'Enregistrer' }}
                </button>
                <button class="btn btn--ghost btn--sm" @click="editingId = null">Annuler</button>
              </div>
            </div>

            <div v-if="deletingId === clinic.id" class="card" style="margin-top: var(--space-2); background: var(--color-bg)">
              <p style="margin-top: 0">
                Confirmer la suppression de <strong>{{ clinic.name }}</strong> ? Cette action est irréversible.
              </p>
              <p v-if="deleteError" class="alert alert--error">{{ deleteError }}</p>
              <div class="form-actions">
                <button class="btn btn--danger-ghost btn--sm" :disabled="deleteLoading" @click="confirmDelete(clinic)">
                  {{ deleteLoading ? 'Suppression...' : 'Confirmer la suppression' }}
                </button>
                <button class="btn btn--ghost btn--sm" @click="deletingId = null">Annuler</button>
              </div>
            </div>
          </div>
          <p v-if="clinics.length === 0" class="empty">Aucune clinique trouvée.</p>
        </div>

        <PaginationControl :page="pagination.page" :total-pages="pagination.totalPages" @change="fetchClinics" />
      </template>
    </div>

    <CreatePanel title="Enregistrer une clinique" trigger-label="Nouvelle clinique">
      <ClinicForm v-model="form" />

      <p v-if="createError" class="alert alert--error">{{ createError }}</p>
      <p v-if="createSuccess" class="alert alert--success">{{ createSuccess }}</p>
      <button class="btn btn--primary btn--block" :disabled="creating" @click="submit">
        <span v-if="creating" class="spinner"></span>
        {{ creating ? 'Enregistrement...' : 'Enregistrer la clinique' }}
      </button>
    </CreatePanel>
  </div>
</template>

<script setup>
import { ref, onMounted, defineComponent, h } from 'vue';
import * as clinicService from '../services/clinic.service';
import PaginationControl from '../components/PaginationControl.vue';
import SkeletonList from '../components/SkeletonList.vue';
import AppIcon from '../components/AppIcon.vue';
import LocationPicker from '../components/LocationPicker.vue';
import CreatePanel from '../components/CreatePanel.vue';

// Petit sous-composant local : champs communs au formulaire de création/édition d'une clinique,
// avec conversion texte <-> tableau pour les téléphones et services.
const ClinicForm = defineComponent({
  props: { modelValue: { type: Object, required: true } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const update = (patch) => emit('update:modelValue', { ...props.modelValue, ...patch });
    return () =>
      h('div', [
        h('div', { class: 'form-grid' }, [
          h('div', { class: 'field' }, [
            h('label', "Nom de la clinique"),
            h('input', {
              type: 'text',
              value: props.modelValue.name,
              onInput: (e) => update({ name: e.target.value }),
            }),
          ]),
          h('div', { class: 'field' }, [
            h('label', 'Ville'),
            h('input', {
              type: 'text',
              value: props.modelValue.city,
              onInput: (e) => update({ city: e.target.value }),
            }),
          ]),
        ]),
        h('div', { class: 'field' }, [
          h('label', 'Adresse'),
          h('input', {
            type: 'text',
            value: props.modelValue.address,
            onInput: (e) => update({ address: e.target.value }),
          }),
        ]),
        h('div', { class: 'field' }, [
          h('label', 'Position géographique'),
          h(LocationPicker, {
            modelValue: { latitude: props.modelValue.latitude, longitude: props.modelValue.longitude },
            'onUpdate:modelValue': (v) => update({ latitude: v.latitude, longitude: v.longitude }),
          }),
        ]),
        h('div', { class: 'field' }, [
          h('label', 'Numéros de téléphone (séparés par une virgule)'),
          h('input', {
            type: 'text',
            placeholder: 'ex: +237600000000, +237611111111',
            value: props.modelValue.phoneNumbersText,
            onInput: (e) => update({ phoneNumbersText: e.target.value }),
          }),
        ]),
        h('div', { class: 'field' }, [
          h('label', "Horaires d'ouverture"),
          h('input', {
            type: 'text',
            placeholder: 'ex: Lun-Ven 8h-18h, Sam 9h-13h',
            value: props.modelValue.openingHours,
            onInput: (e) => update({ openingHours: e.target.value }),
          }),
        ]),
        h('div', { class: 'field' }, [
          h('label', 'Services proposés (séparés par une virgule)'),
          h('input', {
            type: 'text',
            placeholder: 'ex: Urgences, Laboratoire, Pharmacie',
            value: props.modelValue.servicesText,
            onInput: (e) => update({ servicesText: e.target.value }),
          }),
        ]),
      ]);
  },
});

const clinics = ref([]);
const pagination = ref({ page: 1, totalPages: 1, total: 0, limit: 10 });
const search = ref('');
const loading = ref(false);
const errorMessage = ref('');
let searchTimeout;

const emptyForm = () => ({
  name: '',
  address: '',
  city: '',
  latitude: null,
  longitude: null,
  phoneNumbersText: '',
  openingHours: '',
  servicesText: '',
  isActive: true,
});

const form = ref(emptyForm());
const creating = ref(false);
const createError = ref('');
const createSuccess = ref('');

const editingId = ref(null);
const editForm = ref(emptyForm());
const editLoading = ref(false);
const editError = ref('');

const deletingId = ref(null);
const deleteLoading = ref(false);
const deleteError = ref('');

const toPayload = (f) => ({
  name: f.name,
  address: f.address,
  city: f.city || null,
  latitude: f.latitude,
  longitude: f.longitude,
  phoneNumbers: f.phoneNumbersText
    ? f.phoneNumbersText.split(',').map((v) => v.trim()).filter(Boolean)
    : [],
  openingHours: f.openingHours || null,
  services: f.servicesText ? f.servicesText.split(',').map((v) => v.trim()).filter(Boolean) : [],
});

const fetchClinics = async (page = 1) => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const result = await clinicService.getClinics({ page, limit: pagination.value.limit, search: search.value });
    clinics.value = result.clinics;
    pagination.value = result.pagination;
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Impossible de charger les cliniques.';
  } finally {
    loading.value = false;
  }
};

const onSearchInput = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => fetchClinics(1), 400);
};

const submit = async () => {
  creating.value = true;
  createError.value = '';
  createSuccess.value = '';
  try {
    await clinicService.createClinic(toPayload(form.value));
    createSuccess.value = 'Clinique enregistrée avec succès.';
    form.value = emptyForm();
    await fetchClinics();
  } catch (err) {
    createError.value = err.response?.data?.message || 'Impossible d’enregistrer cette clinique.';
  } finally {
    creating.value = false;
  }
};

const toggleEdit = (clinic) => {
  editingId.value = editingId.value === clinic.id ? null : clinic.id;
  deletingId.value = null;
  editError.value = '';
  editForm.value = {
    name: clinic.name,
    address: clinic.address,
    city: clinic.city || '',
    latitude: clinic.latitude,
    longitude: clinic.longitude,
    phoneNumbersText: (clinic.phoneNumbers || []).join(', '),
    openingHours: clinic.openingHours || '',
    servicesText: (clinic.services || []).join(', '),
    isActive: clinic.isActive,
  };
};

const submitEdit = async (clinic) => {
  editLoading.value = true;
  editError.value = '';
  try {
    await clinicService.updateClinic(clinic.id, { ...toPayload(editForm.value), isActive: editForm.value.isActive });
    editingId.value = null;
    await fetchClinics(pagination.value.page);
  } catch (err) {
    editError.value = err.response?.data?.message || 'Impossible de modifier cette clinique.';
  } finally {
    editLoading.value = false;
  }
};

const toggleDelete = (clinic) => {
  deletingId.value = deletingId.value === clinic.id ? null : clinic.id;
  editingId.value = null;
  deleteError.value = '';
};

const confirmDelete = async (clinic) => {
  deleteLoading.value = true;
  deleteError.value = '';
  try {
    await clinicService.deleteClinic(clinic.id);
    deletingId.value = null;
    await fetchClinics(pagination.value.page);
  } catch (err) {
    deleteError.value = err.response?.data?.message || 'Impossible de supprimer cette clinique.';
  } finally {
    deleteLoading.value = false;
  }
};

onMounted(() => fetchClinics());
</script>
