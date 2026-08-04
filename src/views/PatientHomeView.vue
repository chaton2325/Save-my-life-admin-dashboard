<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Bienvenue, {{ authStore.user?.firstName }}</h1>
        <p class="page-subtitle">Votre espace personnel Save My Life</p>
      </div>
    </div>

    <div class="card card--narrow">
      <dl class="profile-list">
        <div class="profile-row">
          <dt>Nom complet</dt>
          <dd>{{ authStore.user?.firstName }} {{ authStore.user?.lastName }}</dd>
        </div>
        <div class="profile-row">
          <dt>Téléphone</dt>
          <dd>{{ authStore.user?.phoneNumber }}</dd>
        </div>
        <div class="profile-row">
          <dt>Statut</dt>
          <dd>Numéro vérifié</dd>
        </div>
      </dl>
    </div>

    <h2 class="section-title">Besoin d'un professionnel de santé ?</h2>
    <div class="quick-link-grid">
      <RouterLink to="/prendre-rendez-vous" class="quick-link-card">
        <span class="quick-link-card__icon"><AppIcon name="search" /></span>
        <span>
          <span class="quick-link-card__label">Je sais quel médecin consulter</span>
          <span class="quick-link-card__desc">Rechercher un médecin par nom ou spécialité</span>
        </span>
      </RouterLink>
      <RouterLink to="/orientation" class="quick-link-card">
        <span class="quick-link-card__icon"><AppIcon name="helpCircle" /></span>
        <span>
          <span class="quick-link-card__label">Je ne sais pas quel spécialiste consulter</span>
          <span class="quick-link-card__desc">Décrivez votre besoin, nous vous orientons</span>
        </span>
      </RouterLink>
    </div>

    <h2 class="section-title">Compléter mes informations</h2>
    <div class="card card--narrow">
      <div class="form-grid">
        <div class="field">
          <label>Email</label>
          <input v-model="form.email" type="email" placeholder="vous@exemple.com" />
        </div>
        <div class="field">
          <label>Date de naissance</label>
          <input v-model="form.birthDate" type="date" />
        </div>
        <div class="field">
          <label>Genre</label>
          <select v-model="form.gender">
            <option value="">Non précisé</option>
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
            <option value="autre">Autre</option>
          </select>
        </div>
        <div class="field">
          <label>Groupe sanguin</label>
          <input v-model="form.bloodType" type="text" placeholder="ex: O+" />
        </div>
      </div>
      <div class="field">
        <label>Adresse</label>
        <input v-model="form.address" type="text" />
      </div>
      <div class="form-grid">
        <div class="field">
          <label>Contact d'urgence — nom</label>
          <input v-model="form.emergencyContactName" type="text" />
        </div>
        <div class="field">
          <label>Contact d'urgence — téléphone</label>
          <input v-model="form.emergencyContactPhone" type="tel" />
        </div>
      </div>

      <p v-if="successMessage" class="alert alert--success">{{ successMessage }}</p>
      <p v-if="errorMessage" class="alert alert--error">{{ errorMessage }}</p>

      <button class="btn btn--primary" :disabled="loading" @click="handleSubmit">
        <span v-if="loading" class="spinner"></span>
        {{ loading ? 'Enregistrement...' : 'Enregistrer' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../store/auth.store';
import * as userService from '../services/user.service';
import AppIcon from '../components/AppIcon.vue';

const authStore = useAuthStore();
const loading = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

const form = ref({
  email: authStore.user?.email || '',
  birthDate: authStore.user?.birthDate || '',
  gender: authStore.user?.gender || '',
  address: authStore.user?.address || '',
  bloodType: authStore.user?.bloodType || '',
  emergencyContactName: authStore.user?.emergencyContactName || '',
  emergencyContactPhone: authStore.user?.emergencyContactPhone || '',
});

const handleSubmit = async () => {
  loading.value = true;
  successMessage.value = '';
  errorMessage.value = '';
  try {
    const payload = Object.fromEntries(
      Object.entries(form.value).map(([key, value]) => [key, value === '' ? null : value])
    );
    const user = await userService.updateMe(payload);
    authStore.setSession(user, authStore.token);
    successMessage.value = 'Informations mises à jour.';
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Impossible de mettre à jour vos informations.';
  } finally {
    loading.value = false;
  }
};
</script>
