<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Je ne sais pas quel spécialiste consulter</h1>
        <p class="page-subtitle">
          Décrivez votre problème de santé en quelques mots, nous vous orienterons vers la spécialité et les
          cliniques les plus proches.
        </p>
      </div>
    </div>

    <div class="card card--narrow">
      <div class="field">
        <label>Décrivez votre besoin</label>
        <textarea
          v-model="description"
          rows="4"
          placeholder="ex: J'ai mal au ventre depuis deux jours et j'ai de la fièvre..."
        ></textarea>
      </div>

      <div class="field-hint" v-if="!position">
        <AppIcon name="mapPin" size="sm" />
        <span>L'accès à votre position est obligatoire pour vous proposer des cliniques proches de vous.</span>
      </div>

      <button
        v-if="!position"
        type="button"
        class="btn btn--ghost"
        :disabled="locating"
        @click="requestLocation"
      >
        <span v-if="locating" class="spinner spinner--dark"></span>
        <AppIcon v-else name="mapPin" size="sm" />
        {{ locating ? 'Localisation en cours...' : 'Autoriser la géolocalisation' }}
      </button>
      <p v-else class="alert alert--success" style="margin-bottom: var(--space-4)">
        Position obtenue — les cliniques proposées seront triées par proximité.
      </p>

      <p v-if="geoError" class="alert alert--error">{{ geoError }}</p>
      <p v-if="submitError" class="alert alert--error">{{ submitError }}</p>

      <button
        class="btn btn--primary btn--block"
        :disabled="!canSubmit || submitting"
        @click="submit"
      >
        <span v-if="submitting" class="spinner"></span>
        {{ submitting ? 'Analyse en cours...' : 'Obtenir une orientation' }}
      </button>
    </div>

    <template v-if="result">
      <h2 class="section-title">Résultat de l'orientation</h2>

      <p v-if="result.urgent" class="alert alert--error">
        Vos symptômes peuvent nécessiter une prise en charge rapide. Si votre état s'aggrave, rendez-vous
        immédiatement aux urgences les plus proches.
      </p>
      <p v-if="result.degraded" class="alert alert--warning">
        Orientation estimée automatiquement (mode simplifié, sans IA avancée) — le résultat reste indicatif.
      </p>
      <p v-if="result.fallbackToGeneralist" class="alert alert--info">
        Aucun spécialiste en {{ result.specialty }} n'a été trouvé à proximité : voici des médecins généralistes
        qui pourront vous orienter davantage.
      </p>

      <div class="card card--narrow" style="margin-bottom: var(--space-5)">
        <span class="badge badge--confirmed" style="margin-bottom: var(--space-3)">{{ result.specialty }}</span>
        <p style="margin: 0 0 var(--space-3)">{{ result.explanation }}</p>
        <p class="hint" style="margin: 0">{{ result.disclaimer }}</p>
      </div>

      <div class="item-list">
        <div v-for="entry in result.clinics" :key="entry.clinic.id" class="card">
          <div class="item-row__main" style="margin-bottom: var(--space-3)">
            <span class="item-row__title">{{ entry.clinic.name }}</span>
            <span class="item-row__meta">
              {{ entry.clinic.address }}<template v-if="entry.clinic.city"> — {{ entry.clinic.city }}</template>
              · {{ entry.distanceKm != null ? entry.distanceKm.toFixed(1) + ' km' : '' }}
            </span>
          </div>
          <div class="item-list">
            <div v-for="doctor in entry.doctors" :key="doctor.id" class="item-row">
              <div class="item-row__main">
                <span class="item-row__title">Dr {{ doctor.firstName }} {{ doctor.lastName }}</span>
                <span class="item-row__meta">{{ doctor.speciality }}</span>
              </div>
              <button class="btn btn--primary btn--sm" @click="bookWith(doctor)">Prendre rendez-vous</button>
            </div>
          </div>
        </div>
        <p v-if="result.clinics.length === 0" class="empty">
          Aucune clinique disponible pour le moment. Réessayez plus tard ou contactez l'équipe Save My Life.
        </p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import * as orientationService from '../services/orientation.service';
import AppIcon from '../components/AppIcon.vue';

const router = useRouter();

const description = ref('');
const position = ref(null);
const locating = ref(false);
const geoError = ref('');
const submitting = ref(false);
const submitError = ref('');
const result = ref(null);

const canSubmit = computed(() => description.value.trim().length >= 10 && !!position.value);

const requestLocation = () => {
  if (!navigator.geolocation) {
    geoError.value = "La géolocalisation n'est pas disponible sur cet appareil.";
    return;
  }
  locating.value = true;
  geoError.value = '';
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      locating.value = false;
      position.value = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    },
    () => {
      locating.value = false;
      geoError.value =
        'Impossible d’accéder à votre position. Cette fonctionnalité nécessite la géolocalisation : autorisez-la puis réessayez.';
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
};

const submit = async () => {
  submitting.value = true;
  submitError.value = '';
  result.value = null;
  try {
    result.value = await orientationService.requestOrientation({
      description: description.value.trim(),
      latitude: position.value.latitude,
      longitude: position.value.longitude,
    });
  } catch (err) {
    submitError.value = err.response?.data?.message || 'Impossible d’obtenir une orientation pour le moment.';
  } finally {
    submitting.value = false;
  }
};

const bookWith = (doctor) => {
  router.push({ path: '/prendre-rendez-vous', query: { doctorId: doctor.id } });
};
</script>
