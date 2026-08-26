<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Mes urgences</h1>
        <p class="page-subtitle">Historique de vos alertes SOS</p>
      </div>
      <RouterLink to="/urgence" class="btn btn--danger">
        <AppIcon name="alertTriangle" size="sm" />
        Nouvelle alerte
      </RouterLink>
    </div>

    <div class="card card--flush">
      <p v-if="loading" class="state-message"><span class="spinner spinner--dark"></span> Chargement...</p>
      <p v-else-if="errorMessage" class="alert alert--error">{{ errorMessage }}</p>
      <template v-else>
        <div class="item-list">
          <div v-for="request in requests" :key="request.id" class="item-row">
            <div class="item-row__main">
              <span class="item-row__title">{{ typeLabel(request.type) }}</span>
              <span class="item-row__meta">{{ formatDate(request.createdAt) }}</span>
              <a
                v-if="request.latitude != null"
                class="item-row__meta"
                :href="`https://www.google.com/maps?q=${request.latitude},${request.longitude}`"
                target="_blank"
                rel="noopener"
              >
                Voir la position transmise
              </a>
            </div>
            <span class="badge" :class="SOS_STATUS_BADGE[request.status]">{{ SOS_STATUS_LABELS[request.status] }}</span>
          </div>
          <p v-if="requests.length === 0" class="empty">Aucune alerte pour le moment.</p>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import * as sosService from '../services/sos.service';
import * as sosTypeService from '../services/sosType.service';
import { SOS_STATUS_LABELS, SOS_STATUS_BADGE } from '../services/sos.service';
import AppIcon from '../components/AppIcon.vue';

const requests = ref([]);
const loading = ref(false);
const errorMessage = ref('');

// Inclut les types désactivés/renommés : une alerte passée doit rester lisible.
const sosTypeLabel = reactive({});
const typeLabel = (value) => sosTypeLabel[value] || value;

const formatDate = (value) =>
  new Date(value).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

onMounted(async () => {
  loading.value = true;
  try {
    const [myRequests, types] = await Promise.all([sosService.getMySosRequests(), sosTypeService.getSosTypes()]);
    requests.value = myRequests;
    types.forEach((t) => {
      sosTypeLabel[t.value] = t.label;
    });
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Impossible de charger vos alertes.';
  } finally {
    loading.value = false;
  }
});
</script>
