<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Mes rendez-vous</h1>
        <p class="page-subtitle">{{ pagination.total }} rendez-vous</p>
      </div>
      <RouterLink to="/prendre-rendez-vous" class="btn btn--primary">
        <AppIcon name="plus" size="sm" />
        Prendre rendez-vous
      </RouterLink>
    </div>

    <div class="card">
      <p v-if="loading" class="state-message"><span class="spinner spinner--dark"></span> Chargement...</p>
      <p v-else-if="errorMessage" class="alert alert--error">{{ errorMessage }}</p>
      <template v-else>
        <div class="item-list">
          <div v-for="appt in appointments" :key="appt.id" class="item-row">
            <div class="item-row__main">
              <span class="item-row__title">Dr {{ appt.doctor?.firstName }} {{ appt.doctor?.lastName }}</span>
              <span class="item-row__meta">{{ formatDateTime(appt.scheduledAt) }} — {{ appt.reason || 'Aucun motif précisé' }}</span>
              <span class="badge" :class="`badge--${appt.status}`">{{ statusLabel(appt.status) }}</span>
            </div>
            <div class="item-row__actions">
              <template v-if="appt.status === 'pending'">
                <button class="btn btn--ghost btn--sm" @click="startEdit(appt)">
                  <AppIcon name="edit" size="sm" /> Modifier
                </button>
              </template>
              <button
                v-if="['pending', 'confirmed'].includes(appt.status)"
                class="btn btn--danger-ghost btn--sm"
                @click="startCancel(appt)"
              >
                <AppIcon name="x" size="sm" /> Annuler
              </button>
            </div>
          </div>
          <p v-if="appointments.length === 0" class="empty">Aucun rendez-vous pour le moment.</p>
        </div>

        <PaginationControl :page="pagination.page" :total-pages="pagination.totalPages" @change="fetchAppointments" />
      </template>
    </div>

    <div v-if="editing" class="card card--narrow" style="margin-top: var(--space-5)">
      <h3 style="margin-top: 0">Modifier le rendez-vous</h3>
      <div class="field">
        <label>Nouvelle date et heure</label>
        <input v-model="editForm.scheduledAt" type="datetime-local" />
      </div>
      <div class="field">
        <label>Motif</label>
        <textarea v-model="editForm.reason"></textarea>
      </div>
      <p v-if="editError" class="alert alert--error">{{ editError }}</p>
      <div class="form-actions">
        <button class="btn btn--primary" :disabled="editLoading" @click="submitEdit">
          {{ editLoading ? 'Enregistrement...' : 'Enregistrer' }}
        </button>
        <button class="btn btn--ghost" @click="editing = null">Annuler</button>
      </div>
    </div>

    <div v-if="cancelling" class="card card--narrow" style="margin-top: var(--space-5)">
      <h3 style="margin-top: 0">Annuler le rendez-vous</h3>
      <div class="field">
        <label>Raison (optionnel)</label>
        <textarea v-model="cancelReason"></textarea>
      </div>
      <p v-if="cancelError" class="alert alert--error">{{ cancelError }}</p>
      <div class="form-actions">
        <button class="btn btn--danger-ghost" :disabled="cancelLoading" @click="submitCancel">
          {{ cancelLoading ? 'Annulation...' : "Confirmer l'annulation" }}
        </button>
        <button class="btn btn--ghost" @click="cancelling = null">Retour</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import * as appointmentService from '../services/appointment.service';
import PaginationControl from '../components/PaginationControl.vue';
import AppIcon from '../components/AppIcon.vue';

const appointments = ref([]);
const pagination = ref({ page: 1, totalPages: 1, total: 0, limit: 10 });
const loading = ref(false);
const errorMessage = ref('');

const editing = ref(null);
const editForm = ref({ scheduledAt: '', reason: '' });
const editLoading = ref(false);
const editError = ref('');

const cancelling = ref(null);
const cancelReason = ref('');
const cancelLoading = ref(false);
const cancelError = ref('');

const statusLabels = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  refused: 'Refusé',
  cancelled: 'Annulé',
  completed: 'Terminé',
};
const statusLabel = (status) => statusLabels[status] || status;

const formatDateTime = (value) =>
  new Date(value).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });

const fetchAppointments = async (page = 1) => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const result = await appointmentService.getMyAppointments({ page, limit: pagination.value.limit });
    appointments.value = result.appointments;
    pagination.value = result.pagination;
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Impossible de charger vos rendez-vous.';
  } finally {
    loading.value = false;
  }
};

const toLocalInput = (value) => {
  const d = new Date(value);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const startEdit = (appt) => {
  editing.value = appt;
  cancelling.value = null;
  editError.value = '';
  editForm.value = { scheduledAt: toLocalInput(appt.scheduledAt), reason: appt.reason || '' };
};

const submitEdit = async () => {
  editLoading.value = true;
  editError.value = '';
  try {
    await appointmentService.rescheduleAppointment(editing.value.id, {
      scheduledAt: new Date(editForm.value.scheduledAt).toISOString(),
      reason: editForm.value.reason,
    });
    editing.value = null;
    await fetchAppointments(pagination.value.page);
  } catch (err) {
    editError.value = err.response?.data?.message || 'Impossible de modifier ce rendez-vous.';
  } finally {
    editLoading.value = false;
  }
};

const startCancel = (appt) => {
  cancelling.value = appt;
  editing.value = null;
  cancelError.value = '';
  cancelReason.value = '';
};

const submitCancel = async () => {
  cancelLoading.value = true;
  cancelError.value = '';
  try {
    await appointmentService.cancelAppointment(cancelling.value.id, cancelReason.value);
    cancelling.value = null;
    await fetchAppointments(pagination.value.page);
  } catch (err) {
    cancelError.value = err.response?.data?.message || 'Impossible d’annuler ce rendez-vous.';
  } finally {
    cancelLoading.value = false;
  }
};

onMounted(() => fetchAppointments());
</script>
