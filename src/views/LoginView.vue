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
            :class="{ 'is-active': method === 'email' }"
            :aria-selected="method === 'email'"
            @click="switchMethod('email')"
          >
            <AppIcon name="mail" size="sm" />
            Code par email
          </button>
        </div>

        <div v-if="method === 'email'" class="field">
          <label for="email">Adresse email</label>
          <div class="input-icon">
            <AppIcon name="mail" size="sm" />
            <input
              id="email"
              v-model="email"
              type="email"
              autocomplete="email"
              placeholder="vous@exemple.com"
              required
            />
          </div>
        </div>

        <div v-else class="field">
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
          <PasswordInput id="password" v-model="password" placeholder="••••••••" required />
        </div>
        <p v-else class="field-hint">
          <AppIcon name="mail" size="sm" />
          Un code à 6 chiffres vous sera envoyé par email pour vous connecter sans mot de passe.
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
import PasswordInput from '../components/PasswordInput.vue';

const method = ref('password');
const email = ref('');
const phoneNumber = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');

const authStore = useAuthStore();
const router = useRouter();

const submitLabel = computed(() => {
  if (loading.value) {
    return method.value === 'email' ? 'Envoi du code...' : 'Connexion...';
  }
  return method.value === 'email' ? 'Recevoir le code' : 'Se connecter';
});

const switchMethod = (value) => {
  method.value = value;
  errorMessage.value = '';
};

// Le code est déjà parti (connexion par code) ou doit l'être à l'arrivée (compte à confirmer).
const goToVerification = (query) => {
  router.push({ name: 'verify-code', query });
};

const handleSubmit = async () => {
  errorMessage.value = '';
  loading.value = true;
  try {
    if (method.value === 'email') {
      const result = await authService.resendCode({ email: email.value.trim() });
      goToVerification({ email: email.value.trim(), hint: result.email });
      return;
    }

    await authStore.login(phoneNumber.value, password.value);
    router.push(authStore.isAdmin ? '/patients' : '/accueil');
  } catch (err) {
    const details = err.response?.data?.details;
    if (details?.requiresVerification) {
      // Compte inscrit mais jamais confirmé : on envoie le code et on l'attend sur l'écran suivant.
      goToVerification({ phoneNumber: phoneNumber.value, hint: details.email || '', send: '1' });
      return;
    }
    errorMessage.value = errorMessageOf(err, 'Connexion impossible.');
  } finally {
    loading.value = false;
  }
};
</script>
