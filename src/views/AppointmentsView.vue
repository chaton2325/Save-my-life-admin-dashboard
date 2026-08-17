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

    <div class="card card--flush">
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
            <RowActions
              v-if="appointmentActions(appt).length"
              :title="`Dr ${appt.doctor?.firstName} ${appt.doctor?.lastName}`"
              :actions="appointmentActions(appt)"
              @select="(key) => runAppointmentAction(key, appt)"
            />
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

    <Modal
      v-if="itineraryAppointment"
      :title="`Itinéraire — Dr ${itineraryAppointment.doctor?.firstName} ${itineraryAppointment.doctor?.lastName}`"
      @close="itineraryAppointment = null"
    >
      <p class="hint" style="margin-top: 0">
        {{ itineraryAppointment.doctor?.clinic?.name }}<template v-if="itineraryAppointment.doctor?.clinic?.address">
          — {{ itineraryAppointment.doctor.clinic.address }}</template
        >
      </p>

      <div v-if="!myPosition" class="field-hint">
        <AppIcon name="mapPin" size="sm" />
        <span>Autorisez la géolocalisation pour afficher votre position et la distance jusqu'au rendez-vous.</span>
      </div>
      <button
        v-if="!myPosition"
        type="button"
        class="btn btn--ghost"
        style="margin-bottom: var(--space-4)"
        :disabled="locating"
        @click="requestMyPosition"
      >
        <span v-if="locating" class="spinner spinner--dark"></span>
        <AppIcon v-else name="mapPin" size="sm" />
        {{ locating ? 'Localisation...' : 'Autoriser la géolocalisation' }}
      </button>
      <p v-if="geoError" class="alert alert--error">{{ geoError }}</p>

      <ItineraryMap
        :origin="myPosition"
        :destination="{
          latitude: itineraryAppointment.doctor.clinic.latitude,
          longitude: itineraryAppointment.doctor.clinic.longitude,
          label: itineraryAppointment.doctor.clinic.name,
        }"
      />

      <p v-if="distanceKm != null" class="hint">Distance à vol d'oiseau : {{ distanceKm.toFixed(1) }} km</p>

      <a
        class="btn btn--primary btn--block"
        style="margin-top: var(--space-4)"
        :href="directionsUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        Ouvrir l'itinéraire dans Google Maps
      </a>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import * as appointmentService from '../services/appointment.service';
import PaginationControl from '../components/PaginationControl.vue';
import AppIcon from '../components/AppIcon.vue';
import Modal from '../components/Modal.vue';
import ItineraryMap from '../components/ItineraryMap.vue';
import RowActions from '../components/RowActions.vue';
import { haversineKm, googleMapsDirectionsUrl } from '../utils/geo';

const appointments = ref([]);
const itineraryAppointment = ref(null);
const myPosition = ref(null);
const locating = ref(false);
const geoError = ref('');

const distanceKm = computed(() => {
  if (!myPosition.value || !itineraryAppointment.value?.doctor?.clinic) return null;
  const clinic = itineraryAppointment.value.doctor.clinic;
  return haversineKm(myPosition.value.latitude, myPosition.value.longitude, clinic.latitude, clinic.longitude);
});

const directionsUrl = computed(() => {
  if (!itineraryAppointment.value?.doctor?.clinic) return '#';
  return googleMapsDirectionsUrl(itineraryAppointment.value.doctor.clinic, myPosition.value);
});

const openItinerary = (appt) => {
  itineraryAppointment.value = appt;
  geoError.value = '';
};

const requestMyPosition = () => {
  if (!navigator.geolocation) {
    geoError.value = "La géolocalisation n'est pas disponible sur cet appareil.";
    return;
  }
  locating.value = true;
  geoError.value = '';
  navigator.geolocation.getCurrentPosition(
    (position) => {
      locating.value = false;
      myPosition.value = { latitude: position.coords.latitude, longitude: position.coords.longitude };
    },
    () => {
      locating.value = false;
      geoError.value = 'Impossible de récupérer votre position. Vous pouvez tout de même ouvrir Google Maps.';
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
};
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

const appointmentActions = (appt) => {
  const actions = [];
  const open = ['pending', 'confirmed'].includes(appt.status);
  if (open && appt.doctor?.clinic) actions.push({ key: 'itinerary', label: 'Itinéraire', icon: 'mapPin' });
  if (appt.status === 'pending') actions.push({ key: 'edit', label: 'Modifier', icon: 'edit' });
  if (open) actions.push({ key: 'cancel', label: 'Annuler', icon: 'x', danger: true });
  return actions;
};

const runAppointmentAction = (key, appt) => {
  if (key === 'itinerary') openItinerary(appt);
  else if (key === 'edit') startEdit(appt);
  else if (key === 'cancel') startCancel(appt);
};

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
