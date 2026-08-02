<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Nommer un administrateur</h1>
        <p class="page-subtitle">
          Attribuer un rôle d'administrateur avec des permissions spécifiques à un utilisateur existant.
        </p>
      </div>
    </div>

    <div class="card card--narrow">
      <div class="field">
        <label>Numéro de téléphone</label>
        <div class="input-icon">
          <AppIcon name="phone" size="sm" />
          <input v-model="phoneNumber" type="tel" placeholder="Numéro de téléphone (+237...)" required />
        </div>
      </div>

      <div class="field">
        <label>Niveau de permission</label>
        <select v-model="adminLevel">
          <option value="super_admin">Super administrateur — accès complet</option>
          <option value="read_only">Lecture seule — consultation uniquement</option>
          <option value="patient_assigner">Chargé d'attribuer les patients aux médecins</option>
          <option value="doctor_manager">Chargé d'ajouter les médecins</option>
        </select>
      </div>

      <p v-if="successMessage" class="alert alert--success">{{ successMessage }}</p>
      <p v-if="errorMessage" class="alert alert--error">{{ errorMessage }}</p>

      <button class="btn btn--primary" :disabled="loading" @click="handleSubmit">
        <span v-if="loading" class="spinner"></span>
        {{ loading ? 'Traitement...' : 'Nommer administrateur' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import * as adminService from '../services/admin.service';
import AppIcon from '../components/AppIcon.vue';

const phoneNumber = ref('');
const adminLevel = ref('read_only');
const loading = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

const handleSubmit = async () => {
  loading.value = true;
  successMessage.value = '';
  errorMessage.value = '';
  try {
    const { user } = await adminService.appointAdmin(phoneNumber.value, adminLevel.value);
    successMessage.value = `${user.firstName} ${user.lastName} est maintenant administrateur (${adminLevel.value}).`;
    phoneNumber.value = '';
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Impossible de nommer cet administrateur.';
  } finally {
    loading.value = false;
  }
};
</script>
