<template>
  <div class="auth-screen">
    <AuthBrandPanel />

    <section class="auth-form-panel">
      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="auth-form__header">
          <h2>Connexion</h2>
          <p>Connectez-vous à votre compte Save My Life</p>
        </div>

        <div class="segmented" role="tablist">
          <button
            type="button"
            class="segmented__option"
            role="tab"
            :class="{ 'is-active': method === 'password' }"
            :aria-selected="method === 'password'"
            @click="switchMethod('password')"
          >
            <AppIcon name="lock" size="sm" />
            Mot de passe
          </button>
          <button
            type="button"
            class="segmented__option"
            role="tab"
            :class="{ 'is-active': method === 'sms' }"
            :aria-selected="method === 'sms'"
            @click="switchMethod('sms')"
          >
            <AppIcon name="messageCircle" size="sm" />
            Code SMS
          </button>
        </div>

        <div class="field">
          <label for="phoneNumber">Numéro de téléphone</label>
          <div class="input-icon">
            <AppIcon name="phone" size="sm" />
            <input
              id="phoneNumber"
              v-model="phoneNumber"
              type="tel"
              placeholder="+237 6XX XXX XXX"
              required
            />
          </div>
        </div>

        <div v-if="method === 'password'" class="field">
          <label for="password">Mot de passe</label>
          <div class="input-icon">
            <AppIcon name="lock" size="sm" />
            <input id="password" v-model="password" type="password" placeholder="••••••••" required />
          </div>
        </div>
        <p v-else class="field-hint">
          <AppIcon name="messageCircle" size="sm" />
          Un code à 6 chiffres vous sera envoyé par SMS pour vous connecter sans mot de passe.
        </p>

        <p v-if="errorMessage" class="alert alert--error">{{ errorMessage }}</p>

        <button type="submit" class="btn btn--primary btn--block" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          {{ submitLabel }}
        </button>

        <p class="auth-switch">
          Pas encore de compte ? <RouterLink to="/inscription">S'inscrire</RouterLink>
        </p>
        <p class="auth-legal">
          <RouterLink to="/politique-de-confidentialite">Politique de confidentialité</RouterLink>
        </p>
      </form>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth.store';
import * as authService from '../services/auth.service';
import { errorMessageOf } from '../services/api';
import AppIcon from '../components/AppIcon.vue';
import AuthBrandPanel from '../components/AuthBrandPanel.vue';

const method = ref('password');
const phoneNumber = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');

const authStore = useAuthStore();
const router = useRouter();

const submitLabel = computed(() => {
  if (loading.value) {
    return method.value === 'sms' ? 'Envoi du code...' : 'Connexion...';
  }
  return method.value === 'sms' ? 'Recevoir le code' : 'Se connecter';
});

const switchMethod = (value) => {
  method.value = value;
  errorMessage.value = '';
};

const goToVerification = (phone, otpCode) => {
  router.push({ name: 'verify-phone', query: { phoneNumber: phone, otpCode } });
};

const handleSubmit = async () => {
  errorMessage.value = '';
  loading.value = true;
  try {
    if (method.value === 'sms') {
      const result = await authService.resendCode(phoneNumber.value);
      goToVerification(result.phoneNumber, result.otpCode);
      return;
    }

    await authStore.login(phoneNumber.value, password.value);
    router.push(authStore.isAdmin ? '/patients' : '/accueil');
  } catch (err) {
    if (err.response?.data?.details?.requiresVerification) {
      goToVerification(phoneNumber.value);
      return;
    }
    errorMessage.value = errorMessageOf(err, 'Connexion impossible.');
  } finally {
    loading.value = false;
  }
};
</script>
