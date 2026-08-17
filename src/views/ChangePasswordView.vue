<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Changer mon mot de passe</h1>
        <p class="page-subtitle">Mettez à jour le mot de passe de votre compte Save My Life</p>
      </div>
    </div>

    <div class="card card--narrow">
      <div class="field">
        <label>Mot de passe actuel</label>
        <div class="input-icon">
          <AppIcon name="lock" size="sm" />
          <input v-model="currentPassword" type="password" placeholder="••••••••" />
        </div>
      </div>
      <div class="field">
        <label>Nouveau mot de passe</label>
        <div class="input-icon">
          <AppIcon name="lock" size="sm" />
          <input v-model="newPassword" type="password" minlength="6" placeholder="••••••••" />
        </div>
      </div>
      <div class="field">
        <label>Confirmer le nouveau mot de passe</label>
        <div class="input-icon">
          <AppIcon name="lock" size="sm" />
          <input v-model="confirmPassword" type="password" minlength="6" placeholder="••••••••" />
        </div>
      </div>

      <p v-if="errorMessage" class="alert alert--error">{{ errorMessage }}</p>
      <p v-if="successMessage" class="alert alert--success">{{ successMessage }}</p>

      <button class="btn btn--primary" :disabled="loading" @click="handleSubmit">
        <span v-if="loading" class="spinner"></span>
        {{ loading ? 'Enregistrement...' : 'Mettre à jour le mot de passe' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import * as authService from '../services/auth.service';
import { errorMessageOf } from '../services/api';
import AppIcon from '../components/AppIcon.vue';

const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const handleSubmit = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  if (!currentPassword.value || !newPassword.value) {
    errorMessage.value = 'Veuillez remplir tous les champs.';
    return;
  }
  if (newPassword.value.length < 6) {
    errorMessage.value = 'Le nouveau mot de passe doit contenir au moins 6 caractères.';
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Les mots de passe ne correspondent pas.';
    return;
  }

  loading.value = true;
  try {
    await authService.changePassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    });
    successMessage.value = 'Mot de passe mis à jour avec succès.';
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
  } catch (err) {
    errorMessage.value = errorMessageOf(err, 'Impossible de mettre à jour le mot de passe.');
  } finally {
    loading.value = false;
  }
};
</script>
