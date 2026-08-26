<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Urgences SOS</h1>
        <p class="page-subtitle">{{ pagination.total }} alerte(s)</p>
      </div>
    </div>

    <div class="segmented" role="tablist" style="margin-bottom: var(--space-4)">
      <button
        v-for="option in statusFilters"
        :key="option.value"
        type="button"
        class="segmented__option"
        role="tab"
        :class="{ 'is-active': statusFilter === option.value }"
        @click="setFilter(option.value)"
      >
        {{ option.label }}
      </button>
    </div>

    <p v-if="loading" class="state-message"><span class="spinner spinner--dark"></span> Chargement...</p>
    <p v-else-if="errorMessage" class="alert alert--error">{{ errorMessage }}</p>
    <template v-else>
      <div v-for="request in requests" :key="request.id" class="card" style="margin-bottom: var(--space-4)">
        <div class="item-row__main" style="margin-bottom: var(--space-3)">
          <span class="item-row__title">
            {{ request.patient?.firstName }} {{ request.patient?.lastName }} — {{ typeLabel(request.type) }}
          </span>
          <span class="item-row__meta">{{ formatDate(request.createdAt) }}</span>
          <span v-if="request.description" class="item-row__meta">{{ request.description }}</span>
        </div>

        <div class="sos-admin-actions">
          <a v-if="request.patient?.phoneNumber" class="btn btn--ghost btn--sm" :href="telHref(request.patient.phoneNumber)">
            <AppIcon name="phone" size="sm" /> Appeler le patient
          </a>
          <a v-if="request.emergencyContactPhone" class="btn btn--ghost btn--sm" :href="telHref(request.emergencyContactPhone)">
            <AppIcon name="phone" size="sm" /> Appeler {{ request.emergencyContactName || 'le contact' }}
          </a>
          <a
            v-if="request.latitude != null"
            class="btn btn--ghost btn--sm"
            :href="`https://www.google.com/maps?q=${request.latitude},${request.longitude}`"
            target="_blank"
            rel="noopener"
          >
            <AppIcon name="mapPin" size="sm" /> Voir la position
          </a>
          <span class="badge" :class="SOS_STATUS_BADGE[request.status]">{{ SOS_STATUS_LABELS[request.status] }}</span>
        </div>

        <div class="form-grid" style="margin-top: var(--space-3)">
          <div class="field">
            <label>Statut</label>
            <select v-model="edits[request.id].status">
              <option v-for="s in SOS_STATUSES" :key="s" :value="s">{{ SOS_STATUS_LABELS[s] }}</option>
            </select>
          </div>
          <div class="field">
            <label>Notes internes</label>
            <input v-model="edits[request.id].adminNotes" type="text" />
          </div>
        </div>
        <button class="btn btn--primary btn--sm" :disabled="updating === request.id" @click="save(request)">
          <span v-if="updating === request.id" class="spinner"></span>
          Mettre à jour
        </button>
      </div>
      <p v-if="requests.length === 0" class="empty">Aucune alerte pour ce filtre.</p>

      <PaginationControl :page="pagination.page" :total-pages="pagination.totalPages" @change="fetchRequests" />
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import * as sosService from '../services/sos.service';
import * as sosTypeService from '../services/sosType.service';
import { SOS_STATUS_LABELS, SOS_STATUS_BADGE } from '../services/sos.service';
import AppIcon from '../components/AppIcon.vue';
import PaginationControl from '../components/PaginationControl.vue';

const SOS_STATUSES = Object.keys(SOS_STATUS_LABELS);
// Inclut les types désactivés/renommés : une alerte passée doit rester lisible.
const sosTypeLabel = reactive({});
const typeLabel = (value) => sosTypeLabel[value] || value;

const statusFilters = [
  { value: '', label: 'Toutes' },
  { value: 'nouveau', label: 'Nouvelles' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'oriente', label: 'Orientées' },
  { value: 'resolu', label: 'Résolues' },
];

const requests = ref([]);
const edits = reactive({});
const pagination = ref({ page: 1, totalPages: 1, total: 0, limit: 20 });
const statusFilter = ref('');
const loading = ref(false);
const errorMessage = ref('');
const updating = ref(null);

const formatDate = (value) =>
  new Date(value).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

const telHref = (phone) => `tel:${phone.replace(/\s+/g, '')}`;

const fetchRequests = async (page = 1) => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const result = await sosService.getAllSosRequests({ status: statusFilter.value, page, limit: pagination.value.limit });
    requests.value = result.sosRequests;
    pagination.value = result.pagination;
    requests.value.forEach((r) => {
      edits[r.id] = { status: r.status, adminNotes: r.adminNotes || '' };
    });
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Impossible de charger les alertes.';
  } finally {
    loading.value = false;
  }
};

const setFilter = (value) => {
  statusFilter.value = value;
  fetchRequests(1);
};

const save = async (request) => {
  updating.value = request.id;
  try {
    const updated = await sosService.updateSosStatus(request.id, edits[request.id]);
    Object.assign(request, updated);
  } finally {
    updating.value = null;
  }
};

const fetchTypeLabels = async () => {
  try {
    const types = await sosTypeService.getSosTypes();
    types.forEach((t) => {
      sosTypeLabel[t.value] = t.label;
    });
  } catch {
    // Non bloquant : on retombe sur la valeur brute si les libellés sont indisponibles.
  }
};

onMounted(() => {
  fetchRequests();
  fetchTypeLabels();
});
</script>

<style scoped>
.sos-admin-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}
</style>
