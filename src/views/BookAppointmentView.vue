<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Prendre rendez-vous</h1>
        <p class="page-subtitle">Étape {{ stepIndex }} sur 4 — {{ stepSubtitle }}</p>
      </div>
    </div>

    <div class="stepper" role="progressbar" :aria-valuenow="stepIndex" aria-valuemin="1" aria-valuemax="4">
      <span v-for="n in 4" :key="n" class="stepper__bar" :class="{ 'is-done': n <= stepIndex }"></span>
    </div>

    <!-- Étape 1 : choisir une clinique -->
    <div v-if="step === 'clinic'" class="card card--narrow">
      <div class="field">
        <label>Rechercher une clinique</label>
        <div class="input-icon">
          <AppIcon name="search" size="sm" />
          <input v-model="clinicSearch" type="search" placeholder="Nom ou ville..." @input="onClinicSearchInput" />
        </div>
      </div>

      <button
        v-if="!myPosition"
        type="button"
        class="btn btn--ghost"
        style="margin-bottom: var(--space-4)"
        :disabled="locating"
        @click="requestLocation"
      >
        <span v-if="locating" class="spinner spinner--dark"></span>
        <AppIcon v-else name="mapPin" size="sm" />
        {{ locating ? 'Localisation...' : 'Trier par proximité' }}
      </button>
      <p v-else class="hint" style="margin-top: -0.5rem">Cliniques triées par proximité.</p>
      <p v-if="geoError" class="hint">{{ geoError }}</p>

      <div class="item-list">
        <div
          v-for="clinic in clinics"
          :key="clinic.id"
          class="item-row"
          style="cursor: pointer"
          @click="selectClinic(clinic)"
        >
          <div class="item-row__main">
            <span class="item-row__title">{{ clinic.name }}</span>
            <span class="item-row__meta">
              {{ clinic.address }}<template v-if="clinic.city"> — {{ clinic.city }}</template>
              <template v-if="clinic.distanceKm != null"> · {{ clinic.distanceKm.toFixed(1) }} km</template>
            </span>
          </div>
          <AppIcon name="chevronRight" size="sm" />
        </div>
        <p v-if="loadingClinics" class="state-message"><span class="spinner spinner--dark"></span> Chargement...</p>
        <p v-else-if="clinics.length === 0" class="empty">Aucune clinique trouvée.</p>
      </div>
    </div>

    <!-- Étape 2 : choisir une spécialité disponible dans la clinique -->
    <div v-else-if="step === 'speciality'" class="card card--narrow">
      <button class="btn btn--ghost btn--sm" style="margin-bottom: var(--space-4)" @click="backToClinics">
        <AppIcon name="chevronLeft" size="sm" /> {{ selectedClinic?.name }}
      </button>

      <p v-if="loadingClinicDoctors" class="state-message"><span class="spinner spinner--dark"></span> Chargement...</p>
      <div v-else class="item-list">
        <div
          v-for="s in specialitiesInClinic"
          :key="s.name"
          class="item-row"
          style="cursor: pointer"
          @click="selectSpeciality(s.name)"
        >
          <div class="item-row__main">
            <span class="item-row__title">{{ s.name }}</span>
            <span class="item-row__meta">{{ s.count }} médecin(s)</span>
          </div>
          <AppIcon name="chevronRight" size="sm" />
        </div>
        <p v-if="specialitiesInClinic.length === 0" class="empty">
          Aucun médecin disponible dans cette clinique pour le moment.
        </p>
      </div>
    </div>

    <!-- Étape 3 : choisir un médecin de cette spécialité -->
    <div v-else-if="step === 'doctor'" class="card card--narrow">
      <button class="btn btn--ghost btn--sm" style="margin-bottom: var(--space-4)" @click="backToSpecialities">
        <AppIcon name="chevronLeft" size="sm" /> {{ selectedSpeciality }}
      </button>

      <div class="item-list">
        <div
          v-for="doctor in doctorsForSelectedSpeciality"
          :key="doctor.id"
          class="item-row"
          style="cursor: pointer"
          @click="selectDoctor(doctor)"
        >
          <div class="item-row__main">
            <span class="item-row__title">Dr {{ doctor.firstName }} {{ doctor.lastName }}</span>
            <span class="item-row__meta" v-if="doctor.medicalOrderNumber">N° Ordre : {{ doctor.medicalOrderNumber }}</span>
          </div>
          <AppIcon name="chevronRight" size="sm" />
        </div>
      </div>
    </div>

    <!-- Étape 4 : date, créneau et confirmation -->
    <div v-else-if="step === 'schedule' && selectedDoctor" class="card card--narrow">
      <button class="btn btn--ghost btn--sm" style="margin-bottom: var(--space-4)" @click="backFromSchedule">
        <AppIcon name="chevronLeft" size="sm" /> Changer de médecin
      </button>

      <h3 style="margin-top: 0">Dr {{ selectedDoctor.firstName }} {{ selectedDoctor.lastName }}</h3>
      <p class="hint" style="margin-top: -0.75rem">{{ selectedDoctor.speciality || 'Médecine générale' }}</p>

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
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import * as doctorService from '../services/doctor.service';
import * as clinicService from '../services/clinic.service';
import * as appointmentService from '../services/appointment.service';
import AppIcon from '../components/AppIcon.vue';

const router = useRouter();
const route = useRoute();

const step = ref('clinic'); // clinic | speciality | doctor | schedule

const STEP_ORDER = ['clinic', 'speciality', 'doctor', 'schedule'];
const stepIndex = computed(() => STEP_ORDER.indexOf(step.value) + 1 || 1);

const stepSubtitle = computed(() => {
  switch (step.value) {
    case 'clinic':
      return 'Choisissez une clinique près de chez vous.';
    case 'speciality':
      return 'Choisissez une spécialité disponible dans cette clinique.';
    case 'doctor':
      return 'Choisissez un médecin.';
    case 'schedule':
      return 'Choisissez une date et un créneau disponible.';
    default:
      return '';
  }
});

// Étape 1 : cliniques
const clinics = ref([]);
const loadingClinics = ref(false);
const clinicSearch = ref('');
const myPosition = ref(null);
const locating = ref(false);
const geoError = ref('');
let clinicSearchTimeout;

const fetchClinics = async () => {
  loadingClinics.value = true;
  try {
    const result = await clinicService.getClinics({
      search: clinicSearch.value,
      limit: 50,
      latitude: myPosition.value?.latitude,
      longitude: myPosition.value?.longitude,
    });
    clinics.value = result.clinics;
  } finally {
    loadingClinics.value = false;
  }
};

const requestLocation = () => {
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
      fetchClinics();
    },
    () => {
      locating.value = false;
      geoError.value = "Impossible d'obtenir votre position. Les cliniques restent triées par nom.";
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
};

const onClinicSearchInput = () => {
  clearTimeout(clinicSearchTimeout);
  clinicSearchTimeout = setTimeout(fetchClinics, 400);
};

// Étape 2 : spécialités disponibles dans la clinique choisie
const selectedClinic = ref(null);
const clinicDoctors = ref([]);
const loadingClinicDoctors = ref(false);
const selectedSpeciality = ref('');

const specialitiesInClinic = computed(() => {
  const counts = new Map();
  clinicDoctors.value.forEach((doctor) => {
    const name = doctor.speciality || 'Médecine générale';
    counts.set(name, (counts.get(name) || 0) + 1);
  });
  return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
});

const selectClinic = async (clinic) => {
  selectedClinic.value = clinic;
  step.value = 'speciality';
  loadingClinicDoctors.value = true;
  try {
    const result = await doctorService.getDoctors({ clinicId: clinic.id, limit: 100 });
    clinicDoctors.value = result.doctors;
  } finally {
    loadingClinicDoctors.value = false;
  }
};

const backToClinics = () => {
  step.value = 'clinic';
  selectedClinic.value = null;
  clinicDoctors.value = [];
  selectedSpeciality.value = '';
};

// Étape 3 : médecins de la spécialité choisie
const doctorsForSelectedSpeciality = computed(() =>
  clinicDoctors.value.filter((doctor) => (doctor.speciality || 'Médecine générale') === selectedSpeciality.value)
);

const selectSpeciality = (name) => {
  selectedSpeciality.value = name;
  step.value = 'doctor';
};

const backToSpecialities = () => {
  step.value = 'speciality';
};

// Étape 4 : créneau et réservation
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

const selectDoctor = (doctor) => {
  selectedDoctor.value = doctor;
  selectedDate.value = '';
  slots.value = [];
  selectedSlot.value = null;
  bookError.value = '';
  bookSuccess.value = '';
  step.value = 'schedule';
};

const backFromSchedule = () => {
  if (selectedClinic.value) {
    step.value = 'doctor';
  } else {
    step.value = 'clinic';
  }
  selectedDoctor.value = null;
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

onMounted(() => {
  fetchClinics();
  preselectFromQuery();
});
</script>

<style scoped>
.slot-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
</style>
