<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Conflits de rendez-vous</h1>
        <p class="page-subtitle">{{ conflicts.length }} conflit(s) détecté(s)</p>
      </div>
    </div>

    <p v-if="loading" class="state-message"><span class="spinner spinner--dark"></span> Chargement...</p>
    <p v-else-if="errorMessage" class="alert alert--error">{{ errorMessage }}</p>
    <template v-else>
      <div v-for="(conflict, index) in conflicts" :key="index" class="card" style="margin-bottom: var(--space-4)">
        <p class="page-subtitle" style="margin-bottom: var(--space-3)">
          Même médecin, créneaux qui se chevauchent — Dr {{ conflict.appointmentA.doctor?.firstName }}
          {{ conflict.appointmentA.doctor?.lastName }}
        </p>
        <div class="item-list">
          <div v-for="appt in [conflict.appointmentA, conflict.appointmentB]" :key="appt.id" class="item-row">
            <div class="item-row__main">
              <span class="item-row__title">{{ appt.patient?.firstName }} {{ appt.patient?.lastName }}</span>
              <span class="item-row__meta">{{ formatDateTime(appt.scheduledAt) }}</span>
            </div>
            <button
              v-if="authStore.isSuperAdmin"
              class="btn btn--danger-ghost btn--sm"
              :disabled="resolving"
              @click="resolve(conflict, appt)"
            >
              Annuler ce rendez-vous
            </button>
          </div>
        </div>
      </div>
      <p v-if="conflicts.length === 0" class="empty">Aucun conflit détecté.</p>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import * as appointmentService from '../services/appointment.service';
import { useAuthStore } from '../store/auth.store';

const authStore = useAuthStore();
const conflicts = ref([]);
const loading = ref(false);
const errorMessage = ref('');
const resolving = ref(false);

const formatDateTime = (value) =>
  new Date(value).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });

const fetchConflicts = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    conflicts.value = await appointmentService.getConflicts();
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Impossible de charger les conflits.';
  } finally {
    loading.value = false;
  }
};

const resolve = async (conflict, appointmentToCancel) => {
  const keep = appointmentToCancel.id === conflict.appointmentA.id ? conflict.appointmentB : conflict.appointmentA;
  resolving.value = true;
  try {
    await appointmentService.resolveConflict({
      keepAppointmentId: keep.id,
      cancelAppointmentId: appointmentToCancel.id,
    });
    await fetchConflicts();
  } finally {
    resolving.value = false;
  }
};

onMounted(() => fetchConflicts());
</script>
