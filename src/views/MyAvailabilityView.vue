<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Mes disponibilités</h1>
        <p class="page-subtitle">Définissez vos créneaux de consultation hebdomadaires.</p>
      </div>
    </div>

    <div class="dash-grid kpi-strip">
      <div class="tile tile--brand kpi span-4">
        <div class="kpi__head">
          <span class="kpi__label">Créneaux actifs</span>
          <span class="kpi__icon"><AppIcon name="clock" /></span>
        </div>
        <div>
          <p class="kpi__value">{{ activeSlots.length }}</p>
          <p class="kpi__meta">sur {{ availabilities.length }} défini(s)</p>
        </div>
      </div>
      <div class="tile kpi span-4">
        <div class="kpi__head">
          <span class="kpi__label">Jours couverts</span>
          <span class="kpi__icon"><AppIcon name="calendar" /></span>
        </div>
        <div>
          <p class="kpi__value">{{ daysCovered }}<span class="kpi__unit">/ 7</span></p>
          <p class="kpi__meta">jours de consultation par semaine</p>
        </div>
      </div>
      <div class="tile kpi span-4">
        <div class="kpi__head">
          <span class="kpi__label">Heures par semaine</span>
          <span class="kpi__icon"><AppIcon name="activity" /></span>
        </div>
        <div>
          <p class="kpi__value">{{ weeklyHours }}<span class="kpi__unit">h</span></p>
          <p class="kpi__meta">de consultation ouvertes</p>
        </div>
      </div>
    </div>

    <div class="card card--flush">
      <div class="card__toolbar">
        <h2 class="card__title">Mes créneaux <span class="count-chip">{{ availabilities.length }}</span></h2>
      </div>
      <p v-if="loading" class="state-message"><span class="spinner spinner--dark"></span> Chargement...</p>
      <template v-else>
        <div class="item-list">
          <div v-for="slot in availabilities" :key="slot.id" class="item-row">
            <span class="lead-icon item-row__lead" :class="{ 'lead-icon--muted': !slot.isActive }">
              <AppIcon name="clock" />
            </span>
            <div class="item-row__main">
              <div class="item-row__heading">
                <span class="item-row__title">{{ dayLabels[slot.dayOfWeek] }}</span>
                <span class="badge" :class="slot.isActive ? 'badge--completed' : 'badge--neutral'">
                  {{ slot.isActive ? 'Active' : 'Inactive' }}
                </span>
              </div>
              <div class="meta-list">
                <span class="meta-item"><AppIcon name="clock" size="sm" />{{ slot.startTime }} — {{ slot.endTime }}</span>
                <span class="meta-item">créneaux de {{ slot.slotDurationMinutes }} min</span>
              </div>
            </div>
            <div class="item-row__actions">
              <button class="btn btn--ghost btn--sm" @click="toggleActive(slot)">
                {{ slot.isActive ? 'Désactiver' : 'Activer' }}
              </button>
              <button class="btn btn--danger-ghost btn--sm" @click="remove(slot)">
                <AppIcon name="x" size="sm" />
              </button>
            </div>
          </div>
          <p v-if="availabilities.length === 0" class="empty">Aucune disponibilité définie.</p>
        </div>
      </template>
    </div>

    <CreatePanel title="Ajouter un créneau" trigger-label="Nouveau créneau">
      <div class="form-grid">
        <div class="field">
          <label>Jour</label>
          <select v-model.number="form.dayOfWeek">
            <option v-for="(label, index) in dayLabels" :key="index" :value="index">{{ label }}</option>
          </select>
        </div>
        <div class="field">
          <label>Durée des créneaux (min)</label>
          <input v-model.number="form.slotDurationMinutes" type="number" min="5" max="240" step="5" />
        </div>
        <div class="field">
          <label>Heure de début</label>
          <input v-model="form.startTime" type="time" />
        </div>
        <div class="field">
          <label>Heure de fin</label>
          <input v-model="form.endTime" type="time" />
        </div>
      </div>
      <p v-if="formError" class="alert alert--error">{{ formError }}</p>
      <button class="btn btn--primary btn--block" :disabled="creating" @click="submit">
        <span v-if="creating" class="spinner"></span>
        {{ creating ? 'Ajout...' : 'Ajouter le créneau' }}
      </button>
    </CreatePanel>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import * as availabilityService from '../services/availability.service';
import AppIcon from '../components/AppIcon.vue';
import CreatePanel from '../components/CreatePanel.vue';

const dayLabels = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const availabilities = ref([]);

const toMinutes = (time) => {
  const [hours, minutes] = String(time || '0:0').split(':').map(Number);
  return hours * 60 + (minutes || 0);
};
const activeSlots = computed(() => availabilities.value.filter((slot) => slot.isActive));
const daysCovered = computed(() => new Set(activeSlots.value.map((slot) => slot.dayOfWeek)).size);
const weeklyHours = computed(() => {
  const minutes = activeSlots.value.reduce((sum, slot) => sum + toMinutes(slot.endTime) - toMinutes(slot.startTime), 0);
  return Math.round((minutes / 60) * 10) / 10;
});
const loading = ref(false);
const creating = ref(false);
const formError = ref('');
const form = ref({ dayOfWeek: 1, startTime: '09:00', endTime: '12:00', slotDurationMinutes: 30 });

const fetchAvailabilities = async () => {
  loading.value = true;
  try {
    availabilities.value = await availabilityService.getMyAvailabilities();
  } finally {
    loading.value = false;
  }
};

const submit = async () => {
  creating.value = true;
  formError.value = '';
  try {
    await availabilityService.createAvailability(form.value);
    await fetchAvailabilities();
  } catch (err) {
    formError.value = err.response?.data?.message || 'Impossible d’ajouter ce créneau.';
  } finally {
    creating.value = false;
  }
};

const toggleActive = async (slot) => {
  await availabilityService.updateAvailability(slot.id, { isActive: !slot.isActive });
  await fetchAvailabilities();
};

const remove = async (slot) => {
  await availabilityService.deleteAvailability(slot.id);
  await fetchAvailabilities();
};

onMounted(() => fetchAvailabilities());
</script>
