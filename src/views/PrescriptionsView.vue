<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Mes ordonnances</h1>
        <p class="page-subtitle">{{ pagination.total }} ordonnance(s)</p>
      </div>
    </div>

    <div class="card card--flush">
      <p v-if="loading" class="state-message"><span class="spinner spinner--dark"></span> Chargement...</p>
      <p v-else-if="errorMessage" class="alert alert--error">{{ errorMessage }}</p>
      <template v-else>
        <div class="item-list">
          <div v-for="p in prescriptions" :key="p.id" class="item-row" style="align-items: flex-start">
            <div class="item-row__main">
              <span class="item-row__title">Dr {{ p.doctor?.firstName }} {{ p.doctor?.lastName }} — {{ formatDate(p.issuedAt) }}</span>
              <span class="item-row__meta">
                {{ (p.medications || []).map((m) => m.name).join(', ') || 'Aucun médicament listé' }}
              </span>
            </div>
            <div class="item-row__actions">
              <button class="btn btn--ghost btn--sm" @click="download(p.id)">
                <AppIcon name="download" size="sm" /> Télécharger
              </button>
            </div>
          </div>
          <p v-if="prescriptions.length === 0" class="empty">Aucune ordonnance pour le moment.</p>
        </div>

        <PaginationControl :page="pagination.page" :total-pages="pagination.totalPages" @change="fetchPrescriptions" />
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import * as prescriptionService from '../services/prescription.service';
import PaginationControl from '../components/PaginationControl.vue';
import AppIcon from '../components/AppIcon.vue';

const prescriptions = ref([]);
const pagination = ref({ page: 1, totalPages: 1, total: 0, limit: 10 });
const loading = ref(false);
const errorMessage = ref('');

const formatDate = (value) => new Date(value).toLocaleDateString('fr-FR', { dateStyle: 'long' });

const fetchPrescriptions = async (page = 1) => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const result = await prescriptionService.getMyPrescriptions({ page, limit: pagination.value.limit });
    prescriptions.value = result.prescriptions;
    pagination.value = result.pagination;
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Impossible de charger vos ordonnances.';
  } finally {
    loading.value = false;
  }
};

const download = (id) => prescriptionService.downloadPrescription(id);

onMounted(() => fetchPrescriptions());
</script>
