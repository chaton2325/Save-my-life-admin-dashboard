<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Prendre rendez-vous</h1>
        <p class="page-subtitle">Choisissez un médecin, une date et un créneau disponible.</p>
      </div>
    </div>

    <div class="card card--narrow">
      <div class="field">
        <label>Médecin</label>
        <div class="input-icon">
          <AppIcon name="search" size="sm" />
          <input v-model="search" type="search" placeholder="Rechercher par nom ou spécialité..." @input="onSearch" />
        </div>
      </div>

      <div class="item-list" style="margin-bottom: var(--space-4)">
        <div
          v-for="doctor in doctors"
          :key="doctor.id"
          class="item-row"
          :class="{ 'is-selected': selectedDoctor?.id === doctor.id }"
          style="cursor: pointer"
          @click="selectDoctor(doctor)"
        >
          <div class="item-row__main">
            <span class="item-row__title">Dr {{ doctor.firstName }} {{ doctor.lastName }}</span>
            <span class="item-row__meta">{{ doctor.speciality || 'Médecine générale' }}</span>
          </div>
          <AppIcon v-if="selectedDoctor?.id === doctor.id" name="check" size="sm" />
        </div>
        <p v-if="!loadingDoctors && doctors.length === 0" class="empty">Aucun médecin trouvé.</p>
      </div>

      <template v-if="selectedDoctor">
        <div class="field">
          <label>Date</label>
          <input v-model="selectedDate" type="date" :min="today" @change="fetchSlots" />
        </div>

        <div v-if="loadingSlots" class="state-message"><span class="spinner spinner--dark"></span> Recherche de créneaux...</div>
        <template v-else-if="selectedDate">
          <div class="field">
            <label>Créneaux disponibles</label>
            <div class="slot-grid">
              <button
                v-for="slot in slots"
                :key="slot.startTime"
                type="button"
                class="btn btn--ghost btn--sm"
                :class="{ 'btn--primary': selectedSlot?.startTime === slot.startTime }"
                @click="selectedSlot = slot"
              >
                {{ formatTime(slot.startTime) }}
              </button>
            </div>
            <p v-if="slots.length === 0" class="hint">Aucun créneau disponible ce jour-là.</p>
          </div>

          <div class="field">
            <label>Motif de consultation</label>
            <textarea v-model="reason" placeholder="Décrivez brièvement le motif..."></textarea>
          </div>

          <p v-if="bookError" class="alert alert--error">{{ bookError }}</p>
          <p v-if="bookSuccess" class="alert alert--success">{{ bookSuccess }}</p>

          <button class="btn btn--primary btn--block" :disabled="!selectedSlot || booking" @click="submitBooking">
            <span v-if="booking" class="spinner"></span>
            {{ booking ? 'Réservation...' : 'Confirmer le rendez-vous' }}
          </button>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import * as doctorService from '../services/doctor.service';
import * as appointmentService from '../services/appointment.service';
import AppIcon from '../components/AppIcon.vue';

const router = useRouter();
const route = useRoute();

const doctors = ref([]);
const loadingDoctors = ref(false);
const search = ref('');
let searchTimeout;

const selectedDoctor = ref(null);
const selectedDate = ref('');
const slots = ref([]);
const loadingSlots = ref(false);
const selectedSlot = ref(null);
const reason = ref('');
const booking = ref(false);
const bookError = ref('');
const bookSuccess = ref('');

const today = new Date().toISOString().slice(0, 10);

const fetchDoctors = async () => {
  loadingDoctors.value = true;
  try {
    const result = await doctorService.getDoctors({ search: search.value, limit: 50 });
    doctors.value = result.doctors;
  } finally {
    loadingDoctors.value = false;
  }
};

const onSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(fetchDoctors, 400);
};

const selectDoctor = (doctor) => {
  selectedDoctor.value = doctor;
  selectedDate.value = '';
  slots.value = [];
  selectedSlot.value = null;
  bookError.value = '';
  bookSuccess.value = '';
};

const fetchSlots = async () => {
  if (!selectedDate.value) return;
  loadingSlots.value = true;
  selectedSlot.value = null;
  try {
    const result = await doctorService.getDoctorAvailability(selectedDoctor.value.id, selectedDate.value);
    slots.value = result.slots || [];
  } finally {
    loadingSlots.value = false;
  }
};

const formatTime = (value) => new Date(value).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

const submitBooking = async () => {
  booking.value = true;
  bookError.value = '';
  bookSuccess.value = '';
  try {
    await appointmentService.bookAppointment({
      doctorId: selectedDoctor.value.id,
      scheduledAt: selectedSlot.value.startTime,
      reason: reason.value,
    });
    bookSuccess.value = 'Rendez-vous demandé avec succès !';
    setTimeout(() => router.push('/rendez-vous'), 1200);
  } catch (err) {
    bookError.value = err.response?.data?.message || 'Impossible de réserver ce créneau.';
    fetchSlots();
  } finally {
    booking.value = false;
  }
};

const preselectFromQuery = async () => {
  const doctorId = route.query.doctorId;
  if (!doctorId) return;
  try {
    const doctor = await doctorService.getDoctor(doctorId);
    selectDoctor(doctor);
  } catch {
    // Le médecin indiqué dans l'URL n'est plus disponible : on laisse la recherche normale.
  }
};

fetchDoctors();
preselectFromQuery();
</script>

<style scoped>
.slot-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
.item-row.is-selected {
  border-color: var(--color-primary);
  background: var(--color-info-bg);
}
</style>
