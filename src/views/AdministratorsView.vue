<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Nommer un administrateur</h1>
        <p class="page-subtitle">
          Promouvoir un patient existant au rôle d'administrateur.
        </p>
      </div>
    </div>

    <div class="card card--narrow">
      <form class="inline-form" @submit.prevent="handleSubmit">
        <div class="input-icon" style="flex: 1">
          <AppIcon name="phone" size="sm" />
          <input v-model="phoneNumber" type="tel" placeholder="Numéro de téléphone (+237...)" required />
        </div>
        <button type="submit" class="btn btn--primary" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          {{ loading ? 'Traitement...' : 'Nommer administrateur' }}
        </button>
      </form>

      <p v-if="successMessage" class="alert alert--success">{{ successMessage }}</p>
      <p v-if="errorMessage" class="alert alert--error">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import * as adminService from '../services/admin.service';
import AppIcon from '../components/AppIcon.vue';

const phoneNumber = ref('');
const loading = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

const handleSubmit = async () => {
  loading.value = true;
  successMessage.value = '';
  errorMessage.value = '';
  try {
    const { user } = await adminService.appointAdmin(phoneNumber.value);
    successMessage.value = `${user.firstName} ${user.lastName} est maintenant administrateur.`;
    phoneNumber.value = '';
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Impossible de nommer cet administrateur.';
  } finally {
    loading.value = false;
  }
};
</script>
