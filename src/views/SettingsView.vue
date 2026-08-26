<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Paramètres</h1>
        <p class="page-subtitle">Spécialités médicales et types d'urgence proposés dans l'application</p>
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

    <h2 class="section-title">Types d'urgence SOS</h2>
    <p class="page-subtitle" style="margin-top: calc(-1 * var(--space-2))">
      Options proposées aux patients à l'étape « type d'urgence » du bouton URGENCE
    </p>

    <div class="card card--flush">
      <p v-if="loadingTypes" class="state-message"><span class="spinner spinner--dark"></span> Chargement...</p>
      <p v-else-if="typesErrorMessage" class="alert alert--error">{{ typesErrorMessage }}</p>
      <template v-else>
        <div class="item-list">
          <div v-for="sosType in sosTypes" :key="sosType.id">
            <div class="item-row">
              <template v-if="editingTypeId === sosType.id">
                <div class="sos-type-edit">
                  <input v-model="editTypeLabel" type="text" style="max-width: 260px" />
                  <select v-model="editTypeIcon">
                    <option v-for="icon in SOS_TYPE_ICONS" :key="icon" :value="icon">{{ icon }}</option>
                  </select>
                </div>
              </template>
              <div v-else class="item-row__main">
                <span class="item-row__title sos-type-title">
                  <AppIcon :name="sosType.icon" size="sm" />
                  {{ sosType.label }}
                </span>
                <span class="badge" :class="sosType.isActive ? 'badge--completed' : 'badge--cancelled'">
                  {{ sosType.isActive ? 'Actif' : 'Désactivé' }}
                </span>
              </div>
              <div v-if="editingTypeId === sosType.id" class="item-row__actions">
                <button class="btn btn--primary btn--sm" :disabled="editTypeLoading" @click="submitTypeRename(sosType)">
                  Enregistrer
                </button>
                <button class="btn btn--ghost btn--sm" @click="editingTypeId = null">Annuler</button>
              </div>
              <RowActions
                v-else
                :title="sosType.label"
                :actions="sosTypeActions(sosType)"
                @select="(key) => runSosTypeAction(key, sosType)"
              />
            </div>
            <p v-if="typeRowError === sosType.id" class="alert alert--error" style="margin-top: var(--space-2)">
              {{ typeRowErrorMessage }}
            </p>
          </div>
          <p v-if="sosTypes.length === 0" class="empty">Aucun type d'urgence configuré.</p>
        </div>
      </template>
    </div>

    <CreatePanel title="Ajouter un type d'urgence" trigger-label="Nouveau type d'urgence">
      <div class="field">
        <label>Libellé</label>
        <input v-model="newTypeLabel" type="text" placeholder="ex: Crise cardiaque" @keyup.enter="submitTypeCreate" />
      </div>
      <div class="field">
        <label>Icône</label>
        <select v-model="newTypeIcon">
          <option v-for="icon in SOS_TYPE_ICONS" :key="icon" :value="icon">{{ icon }}</option>
        </select>
      </div>
      <p v-if="typeCreateError" class="alert alert--error">{{ typeCreateError }}</p>
      <p v-if="typeCreateSuccess" class="alert alert--success">{{ typeCreateSuccess }}</p>
      <button
        class="btn btn--primary btn--block"
        :disabled="!newTypeLabel.trim() || creatingType"
        @click="submitTypeCreate"
      >
        <span v-if="creatingType" class="spinner"></span>
        {{ creatingType ? 'Ajout...' : "Ajouter le type d'urgence" }}
      </button>
    </CreatePanel>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import * as specialityService from '../services/speciality.service';
import * as sosTypeService from '../services/sosType.service';
import { SOS_TYPE_ICONS } from '../services/sosType.service';
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

// --- Types d'urgence SOS ---

const sosTypes = ref([]);
const loadingTypes = ref(false);
const typesErrorMessage = ref('');

const editingTypeId = ref(null);
const editTypeLabel = ref('');
const editTypeIcon = ref('');
const editTypeLoading = ref(false);

const typeRowError = ref(null);
const typeRowErrorMessage = ref('');

const newTypeLabel = ref('');
const newTypeIcon = ref(SOS_TYPE_ICONS[0]);
const creatingType = ref(false);
const typeCreateError = ref('');
const typeCreateSuccess = ref('');

const fetchSosTypes = async () => {
  loadingTypes.value = true;
  typesErrorMessage.value = '';
  try {
    sosTypes.value = await sosTypeService.getSosTypes();
  } catch (err) {
    typesErrorMessage.value = err.response?.data?.message || "Impossible de charger les types d'urgence.";
  } finally {
    loadingTypes.value = false;
  }
};

const submitTypeCreate = async () => {
  if (!newTypeLabel.value.trim()) return;
  creatingType.value = true;
  typeCreateError.value = '';
  typeCreateSuccess.value = '';
  try {
    await sosTypeService.createSosType({ label: newTypeLabel.value.trim(), icon: newTypeIcon.value });
    typeCreateSuccess.value = "Type d'urgence ajouté avec succès.";
    newTypeLabel.value = '';
    newTypeIcon.value = SOS_TYPE_ICONS[0];
    await fetchSosTypes();
  } catch (err) {
    typeCreateError.value = err.response?.data?.message || "Impossible d'ajouter ce type d'urgence.";
  } finally {
    creatingType.value = false;
  }
};

const sosTypeActions = (sosType) => [
  { key: 'rename', label: 'Modifier', icon: 'edit' },
  {
    key: 'toggle',
    label: sosType.isActive ? 'Désactiver' : 'Activer',
    icon: sosType.isActive ? 'x' : 'check',
  },
  { key: 'delete', label: 'Supprimer', icon: 'trash', danger: true },
];

const runSosTypeAction = (key, sosType) => {
  if (key === 'rename') startTypeRename(sosType);
  else if (key === 'toggle') toggleTypeActive(sosType);
  else if (key === 'delete') removeType(sosType);
};

const startTypeRename = (sosType) => {
  editingTypeId.value = sosType.id;
  editTypeLabel.value = sosType.label;
  editTypeIcon.value = sosType.icon;
  typeRowError.value = null;
};

const submitTypeRename = async (sosType) => {
  editTypeLoading.value = true;
  typeRowError.value = null;
  try {
    await sosTypeService.updateSosType(sosType.id, { label: editTypeLabel.value.trim(), icon: editTypeIcon.value });
    editingTypeId.value = null;
    await fetchSosTypes();
  } catch (err) {
    typeRowError.value = sosType.id;
    typeRowErrorMessage.value = err.response?.data?.message || "Impossible de modifier ce type d'urgence.";
  } finally {
    editTypeLoading.value = false;
  }
};

const toggleTypeActive = async (sosType) => {
  typeRowError.value = null;
  try {
    await sosTypeService.updateSosType(sosType.id, { isActive: !sosType.isActive });
    await fetchSosTypes();
  } catch (err) {
    typeRowError.value = sosType.id;
    typeRowErrorMessage.value = err.response?.data?.message || "Impossible de modifier ce type d'urgence.";
  }
};

const removeType = async (sosType) => {
  typeRowError.value = null;
  try {
    await sosTypeService.deleteSosType(sosType.id);
    await fetchSosTypes();
  } catch (err) {
    typeRowError.value = sosType.id;
    typeRowErrorMessage.value = err.response?.data?.message || "Impossible de supprimer ce type d'urgence.";
  }
};

onMounted(() => {
  fetchSpecialities();
  fetchSosTypes();
});
</script>

<style scoped>
.sos-type-edit {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}
.sos-type-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
</style>
