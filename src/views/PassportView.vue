<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Passeport Santé</h1>
        <p class="page-subtitle">Votre dossier de santé personnel, centralisé et sécurisé.</p>
      </div>
    </div>

    <div class="card card--narrow">
      <div class="identity" style="margin-bottom: var(--space-4)">
        <span class="avatar avatar--lg" aria-hidden="true">{{ initials }}</span>
        <div>
          <p class="item-row__title" style="margin: 0">{{ authStore.user?.firstName }} {{ authStore.user?.lastName }}</p>
          <p class="item-row__meta" style="margin: 0">{{ authStore.user?.phoneNumber }}</p>
        </div>
      </div>

      <h2 class="section-title" style="margin-top: 0">Identification</h2>
      <ul class="passport-list">
        <li><strong>Date de naissance :</strong> {{ authStore.user?.birthDate || 'non renseignée' }}</li>
        <li><strong>Genre :</strong> {{ GENDER_LABEL[authStore.user?.gender] || 'non précisé' }}</li>
        <li><strong>Groupe sanguin :</strong> {{ authStore.user?.bloodType || 'non renseigné' }}</li>
        <li><strong>Adresse :</strong> {{ authStore.user?.address || 'non renseignée' }}</li>
      </ul>

      <h2 class="section-title">Personne à contacter en cas d'urgence</h2>
      <ul class="passport-list">
        <li v-if="authStore.user?.emergencyContactPhone">
          {{ authStore.user.emergencyContactName }} — {{ authStore.user.emergencyContactPhone }}
        </li>
        <li v-else>Non renseignée</li>
      </ul>

      <h2 class="section-title">Assurance maladie</h2>
      <ul class="passport-list">
        <li><strong>Entreprise :</strong> {{ authStore.user?.employer || 'non renseignée' }}</li>
        <li><strong>Assurance :</strong> {{ authStore.user?.insuranceProvider || 'non renseignée' }}</li>
      </ul>
      <p class="hint">Ces informations se modifient depuis Accueil → « Compléter mes informations ».</p>

      <h2 class="section-title">Antécédents médicaux et chirurgicaux</h2>
      <textarea v-model="form.medicalHistory" rows="3" placeholder="ex: hypertension depuis 2020, appendicectomie en 2015..."></textarea>

      <h2 class="section-title">Allergies</h2>
      <textarea v-model="form.allergies" rows="2" placeholder="ex: pénicilline, arachides..."></textarea>

      <h2 class="section-title">Traitements en cours</h2>
      <textarea v-model="form.currentTreatments" rows="2" placeholder="ex: Amlodipine 5mg, 1x/jour..."></textarea>

      <h2 class="section-title">Vaccinations</h2>
      <textarea v-model="form.vaccinations" rows="2" placeholder="ex: Fièvre jaune (2019), COVID-19 (2021)..."></textarea>

      <p v-if="successMessage" class="alert alert--success">{{ successMessage }}</p>
      <p v-if="errorMessage" class="alert alert--error">{{ errorMessage }}</p>
      <button class="btn btn--primary btn--block" :disabled="loading" @click="save">
        <span v-if="loading" class="spinner"></span>
        {{ loading ? 'Enregistrement...' : 'Enregistrer mon dossier médical' }}
      </button>
    </div>

    <h2 class="section-title">Suivi</h2>
    <div class="quick-link-grid">
      <RouterLink to="/ordonnances" class="quick-link-card">
        <span class="quick-link-card__icon"><AppIcon name="fileText" /></span>
        <span>
          <span class="quick-link-card__label">Mes ordonnances</span>
          <span class="quick-link-card__desc">Consulter mes prescriptions</span>
        </span>
      </RouterLink>
      <RouterLink to="/rendez-vous" class="quick-link-card">
        <span class="quick-link-card__icon"><AppIcon name="calendar" /></span>
        <span>
          <span class="quick-link-card__label">Mes rendez-vous</span>
          <span class="quick-link-card__desc">Historique et rendez-vous à venir</span>
        </span>
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '../store/auth.store';
import * as userService from '../services/user.service';
import AppIcon from '../components/AppIcon.vue';

const GENDER_LABEL = { M: 'Masculin', F: 'Féminin', autre: 'Autre' };

const authStore = useAuthStore();
const loading = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

const form = ref({
  medicalHistory: authStore.user?.medicalHistory || '',
  allergies: authStore.user?.allergies || '',
  currentTreatments: authStore.user?.currentTreatments || '',
  vaccinations: authStore.user?.vaccinations || '',
});

const initials = computed(() => {
  const first = authStore.user?.firstName?.[0] || '';
  const last = authStore.user?.lastName?.[0] || '';
  return (first + last).toUpperCase();
});

const save = async () => {
  loading.value = true;
  successMessage.value = '';
  errorMessage.value = '';
  try {
    const payload = Object.fromEntries(
      Object.entries(form.value).map(([key, value]) => [key, value === '' ? null : value])
    );
    const user = await userService.updateMe(payload);
    authStore.setSession(user, authStore.token);
    successMessage.value = 'Passeport santé mis à jour.';
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Impossible de mettre à jour votre passeport.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.passport-list {
  list-style: none;
  padding: 0;
  margin: 0 0 var(--space-4);
}
.passport-list li {
  padding: var(--space-1) 0;
}
textarea {
  margin-bottom: var(--space-4);
}
</style>
