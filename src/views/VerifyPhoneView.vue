<template>
  <div class="auth-screen">
    <AuthBrandPanel tagline="Encore une étape avant d'accéder à votre espace." />

    <section class="auth-form-panel">
      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="auth-form__header">
          <h2>Vérification du téléphone</h2>
          <p>Un code à 6 chiffres a été envoyé au {{ phoneNumber }}</p>
        </div>

        <p v-if="displayedCode" class="alert alert--info">
          Simulation SMS — aucun message n'est réellement envoyé. Votre code est :
          <strong>{{ displayedCode }}</strong>
        </p>

        <div class="field">
          <label for="code">Code de vérification</label>
          <input
            id="code"
            v-model="code"
            type="text"
            inputmode="numeric"
            maxlength="6"
            placeholder="000000"
            required
          />
        </div>

        <p v-if="errorMessage" class="alert alert--error">{{ errorMessage }}</p>

        <button type="submit" class="btn btn--primary btn--block" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          {{ loading ? 'Vérification...' : 'Vérifier' }}
        </button>

        <button
          type="button"
          class="btn btn--ghost btn--block"
          style="margin-top: var(--space-3)"
          :disabled="resending"
          @click="handleResend"
        >
          {{ resending ? 'Envoi...' : 'Renvoyer le code' }}
        </button>
      </form>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth.store';
import * as authService from '../services/auth.service';
import { errorMessageOf } from '../services/api';
import AuthBrandPanel from '../components/AuthBrandPanel.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const phoneNumber = ref(route.query.phoneNumber || '');
const displayedCode = ref(route.query.otpCode || '');
const code = ref('');
const loading = ref(false);
const resending = ref(false);
const errorMessage = ref('');

const handleResend = async () => {
  resending.value = true;
  errorMessage.value = '';
  try {
    const result = await authService.resendCode(phoneNumber.value);
    displayedCode.value = result.otpCode;
  } catch (err) {
    errorMessage.value = errorMessageOf(err, 'Impossible de renvoyer le code.');
  } finally {
    resending.value = false;
  }
};

const handleSubmit = async () => {
  errorMessage.value = '';
  loading.value = true;
  try {
    const { user, token } = await authService.verifyPhone({
      phoneNumber: phoneNumber.value,
      code: code.value,
    });
    authStore.setSession(user, token);
    router.push(authStore.isAdmin ? '/patients' : '/accueil');
  } catch (err) {
    errorMessage.value = errorMessageOf(err, 'Code invalide.');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  if (!phoneNumber.value) {
    router.replace('/login');
    return;
  }
  if (!displayedCode.value) {
    handleResend();
  }
});
</script>
