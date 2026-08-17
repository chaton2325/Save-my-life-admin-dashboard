<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Mes disponibilités</h1>
        <p class="page-subtitle">Définissez vos créneaux de consultation hebdomadaires.</p>
      </div>
    </div>

    <div class="card card--flush">
      <p v-if="loading" class="state-message"><span class="spinner spinner--dark"></span> Chargement...</p>
      <template v-else>
        <div class="item-list">
          <div v-for="slot in availabilities" :key="slot.id" class="item-row">
            <div class="item-row__main">
              <span class="item-row__title">{{ dayLabels[slot.dayOfWeek] }}</span>
              <span class="item-row__meta">
                {{ slot.startTime }} — {{ slot.endTime }} (créneaux de {{ slot.slotDurationMinutes }} min)
              </span>
              <span class="badge" :class="slot.isActive ? 'badge--completed' : 'badge--neutral'">
                {{ slot.isActive ? 'Active' : 'Inactive' }}
              </span>
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
import { ref, onMounted } from 'vue';
import * as availabilityService from '../services/availability.service';
import AppIcon from '../components/AppIcon.vue';
import CreatePanel from '../components/CreatePanel.vue';

const dayLabels = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const availabilities = ref([]);
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
