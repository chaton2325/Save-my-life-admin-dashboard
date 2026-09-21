<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Urgences SOS</h1>
        <p class="page-subtitle">Alertes envoyées par les patients — touchez un compteur pour filtrer</p>
      </div>
    </div>

    <div class="dash-grid kpi-strip">
      <button
        v-for="option in statusFilters.filter((o) => o.value)"
        :key="option.value"
        type="button"
        class="tile tile--link kpi span-3"
        :class="{
          'is-active': statusFilter === option.value,
          'tile--alert': option.value === 'nouveau' && counts.nouveau > 0,
        }"
        :aria-pressed="statusFilter === option.value"
        @click="setFilter(statusFilter === option.value ? '' : option.value)"
      >
        <div class="kpi__head">
          <span class="kpi__label">{{ option.label }}</span>
          <span class="kpi__icon"><AppIcon :name="option.icon" /></span>
        </div>
        <div>
          <p class="kpi__value">{{ counts[option.value] ?? '–' }}</p>
          <p class="kpi__meta">{{ option.meta }}</p>
        </div>
      </button>
    </div>

    <div class="card card--flush">
      <div class="card__toolbar">
        <h2 class="card__title">
          {{ statusFilter ? filterLabel : 'Toutes les alertes' }}
          <span class="count-chip">{{ pagination.total }}</span>
        </h2>
        <button v-if="statusFilter" type="button" class="btn btn--ghost btn--sm" @click="setFilter('')">
          Tout afficher
        </button>
      </div>

    <p v-if="loading" class="state-message"><span class="spinner spinner--dark"></span> Chargement...</p>
    <p v-else-if="errorMessage" class="alert alert--error">{{ errorMessage }}</p>
    <template v-else>
     <div class="item-list">
      <div v-for="request in requests" :key="request.id" class="sos-request">
        <div class="sos-request__head">
          <span class="avatar item-row__lead" aria-hidden="true">{{ initialsOf(request.patient) }}</span>
          <div class="item-row__main">
            <div class="item-row__heading">
              <span class="item-row__title">{{ request.patient?.firstName }} {{ request.patient?.lastName }}</span>
              <span class="chip chip--danger">{{ typeLabel(request.type) }}</span>
            </div>
            <div class="meta-list">
              <span class="meta-item"><AppIcon name="clock" size="sm" />{{ formatDate(request.createdAt) }}</span>
            </div>
            <span v-if="request.description" class="item-row__meta">{{ request.description }}</span>
          </div>
          <span class="badge" :class="SOS_STATUS_BADGE[request.status]">{{ SOS_STATUS_LABELS[request.status] }}</span>
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
     </div>

      <PaginationControl :page="pagination.page" :total-pages="pagination.totalPages" @change="fetchRequests" />
    </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import * as sosService from '../services/sos.service';
import * as sosTypeService from '../services/sosType.service';
import { SOS_STATUS_LABELS, SOS_STATUS_BADGE } from '../services/sos.service';
import AppIcon from '../components/AppIcon.vue';
import PaginationControl from '../components/PaginationControl.vue';
import { initialsOf } from '../utils/format';

const SOS_STATUSES = Object.keys(SOS_STATUS_LABELS);
// Inclut les types désactivés/renommés : une alerte passée doit rester lisible.
const sosTypeLabel = reactive({});
const typeLabel = (value) => sosTypeLabel[value] || value;

const statusFilters = [
  { value: '', label: 'Toutes' },
  { value: 'nouveau', label: 'Nouvelles', icon: 'alertTriangle', meta: 'à prendre en charge' },
  { value: 'en_cours', label: 'En cours', icon: 'clock', meta: 'en cours de traitement' },
  { value: 'oriente', label: 'Orientées', icon: 'mapPin', meta: 'orientées vers une structure' },
  { value: 'resolu', label: 'Résolues', icon: 'check', meta: 'clôturées' },
];
const filterLabel = computed(() => statusFilters.find((o) => o.value === statusFilter.value)?.label || '');

// Un appel par statut, limité à 1 ligne : seul le total nous intéresse.
const counts = reactive({ nouveau: null, en_cours: null, oriente: null, resolu: null });
const fetchCounts = () =>
  Promise.all(
    Object.keys(counts).map((status) =>
      sosService
        .getAllSosRequests({ status, limit: 1 })
        .then((result) => {
          counts[status] = result.pagination?.total ?? 0;
        })
        .catch(() => {
          counts[status] = null;
        })
    )
  );

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
    fetchCounts();
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
  fetchCounts();
});
</script>

<style scoped>
.sos-request {
  padding: var(--space-4) var(--space-5);
}
.sos-request__head {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}
.sos-request__head > .badge {
  flex-shrink: 0;
  margin-left: auto;
}
.sos-request .form-grid {
  margin-top: var(--space-3);
}
.sos-admin-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}
</style>
