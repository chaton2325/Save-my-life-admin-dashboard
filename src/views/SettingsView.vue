<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Paramètres</h1>
        <p class="page-subtitle">Gestion des spécialités médicales proposées dans l'application</p>
      </div>
      <div class="input-icon search-input">
        <AppIcon name="search" size="sm" />
        <input v-model="search" type="search" placeholder="Rechercher une spécialité..." />
      </div>
    </div>

    <div class="card card--flush">
      <p v-if="loading" class="state-message"><span class="spinner spinner--dark"></span> Chargement...</p>
      <p v-else-if="errorMessage" class="alert alert--error">{{ errorMessage }}</p>
      <template v-else>
        <div class="item-list">
          <div v-for="speciality in filteredSpecialities" :key="speciality.id">
            <div class="item-row">
              <template v-if="editingId === speciality.id">
                <input v-model="editName" type="text" style="max-width: 320px" />
              </template>
              <div v-else class="item-row__main">
                <span class="item-row__title">{{ speciality.name }}</span>
                <span class="badge" :class="speciality.isActive ? 'badge--completed' : 'badge--cancelled'">
                  {{ speciality.isActive ? 'Active' : 'Désactivée' }}
                </span>
              </div>
              <div v-if="editingId === speciality.id" class="item-row__actions">
                <button class="btn btn--primary btn--sm" :disabled="editLoading" @click="submitRename(speciality)">
                  Enregistrer
                </button>
                <button class="btn btn--ghost btn--sm" @click="editingId = null">Annuler</button>
              </div>
              <RowActions
                v-else
                :title="speciality.name"
                :actions="specialityActions(speciality)"
                @select="(key) => runSpecialityAction(key, speciality)"
              />
            </div>
            <p v-if="rowError === speciality.id" class="alert alert--error" style="margin-top: var(--space-2)">
              {{ rowErrorMessage }}
            </p>
          </div>
          <p v-if="filteredSpecialities.length === 0" class="empty">Aucune spécialité trouvée.</p>
        </div>
      </template>
    </div>

    <CreatePanel title="Ajouter une spécialité" trigger-label="Nouvelle spécialité">
      <div class="field">
        <label>Nom de la spécialité</label>
        <input v-model="newName" type="text" placeholder="ex: Ostéopathie" @keyup.enter="submitCreate" />
      </div>
      <p v-if="createError" class="alert alert--error">{{ createError }}</p>
      <p v-if="createSuccess" class="alert alert--success">{{ createSuccess }}</p>
      <button
        class="btn btn--primary btn--block"
        :disabled="!newName.trim() || creating"
        @click="submitCreate"
      >
        <span v-if="creating" class="spinner"></span>
        {{ creating ? 'Ajout...' : 'Ajouter la spécialité' }}
      </button>
    </CreatePanel>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import * as specialityService from '../services/speciality.service';
import AppIcon from '../components/AppIcon.vue';
import CreatePanel from '../components/CreatePanel.vue';
import RowActions from '../components/RowActions.vue';

const specialities = ref([]);
const search = ref('');
const loading = ref(false);
const errorMessage = ref('');

const editingId = ref(null);
const editName = ref('');
const editLoading = ref(false);

const toggleBusyId = ref(null);
const rowError = ref(null);
const rowErrorMessage = ref('');

const newName = ref('');
const creating = ref(false);
const createError = ref('');
const createSuccess = ref('');

const filteredSpecialities = computed(() => {
  if (!search.value.trim()) return specialities.value;
  const q = search.value.trim().toLowerCase();
  return specialities.value.filter((s) => s.name.toLowerCase().includes(q));
});

const fetchSpecialities = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    specialities.value = await specialityService.getSpecialities();
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Impossible de charger les spécialités.';
  } finally {
    loading.value = false;
  }
};

const submitCreate = async () => {
  if (!newName.value.trim()) return;
  creating.value = true;
  createError.value = '';
  createSuccess.value = '';
  try {
    await specialityService.createSpeciality(newName.value.trim());
    createSuccess.value = 'Spécialité ajoutée avec succès.';
    newName.value = '';
    await fetchSpecialities();
  } catch (err) {
    createError.value = err.response?.data?.message || "Impossible d'ajouter cette spécialité.";
  } finally {
    creating.value = false;
  }
};

const specialityActions = (speciality) => [
  { key: 'rename', label: 'Renommer', icon: 'edit' },
  {
    key: 'toggle',
    label: speciality.isActive ? 'Désactiver' : 'Activer',
    icon: speciality.isActive ? 'x' : 'check',
    disabled: toggleBusyId.value === speciality.id,
  },
  { key: 'delete', label: 'Supprimer', icon: 'trash', danger: true },
];

const runSpecialityAction = (key, speciality) => {
  if (key === 'rename') startRename(speciality);
  else if (key === 'toggle') toggleActive(speciality);
  else if (key === 'delete') remove(speciality);
};

const startRename = (speciality) => {
  editingId.value = speciality.id;
  editName.value = speciality.name;
  rowError.value = null;
};

const submitRename = async (speciality) => {
  editLoading.value = true;
  rowError.value = null;
  try {
    await specialityService.updateSpeciality(speciality.id, { name: editName.value.trim() });
    editingId.value = null;
    await fetchSpecialities();
  } catch (err) {
    rowError.value = speciality.id;
    rowErrorMessage.value = err.response?.data?.message || 'Impossible de renommer cette spécialité.';
  } finally {
    editLoading.value = false;
  }
};

const toggleActive = async (speciality) => {
  toggleBusyId.value = speciality.id;
  rowError.value = null;
  try {
    await specialityService.updateSpeciality(speciality.id, { isActive: !speciality.isActive });
    await fetchSpecialities();
  } catch (err) {
    rowError.value = speciality.id;
    rowErrorMessage.value = err.response?.data?.message || 'Impossible de modifier cette spécialité.';
  } finally {
    toggleBusyId.value = null;
  }
};

const remove = async (speciality) => {
  rowError.value = null;
  try {
    await specialityService.deleteSpeciality(speciality.id);
    await fetchSpecialities();
  } catch (err) {
    rowError.value = speciality.id;
    rowErrorMessage.value = err.response?.data?.message || 'Impossible de supprimer cette spécialité.';
  }
};

onMounted(() => fetchSpecialities());
</script>
