<template>
  <div class="auth-screen">
    <AuthBrandPanel />

    <section class="auth-form-panel">
      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="auth-form__header">
          <h2>Créer un compte</h2>
          <p>Inscrivez-vous avec votre numéro de téléphone</p>
        </div>

        <div class="field-row">
          <div class="field">
            <label for="firstName">Prénom</label>
            <input id="firstName" v-model="firstName" type="text" required />
          </div>
          <div class="field">
            <label for="lastName">Nom</label>
            <input id="lastName" v-model="lastName" type="text" required />
          </div>
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

        <div class="field">
          <label for="password">Mot de passe</label>
          <div class="input-icon">
            <AppIcon name="lock" size="sm" />
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="••••••••"
              minlength="6"
              required
            />
          </div>
        </div>

        <div class="field">
          <label for="confirmPassword">Confirmer le mot de passe</label>
          <div class="input-icon">
            <AppIcon name="lock" size="sm" />
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <p v-if="errorMessage" class="alert alert--error">{{ errorMessage }}</p>

        <button type="submit" class="btn btn--primary btn--block" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          {{ loading ? 'Création...' : "S'inscrire" }}
        </button>

        <p class="auth-switch">Déjà inscrit ? <RouterLink to="/login">Se connecter</RouterLink></p>
        <p class="auth-legal">
          En créant un compte, vous acceptez notre
          <RouterLink to="/politique-de-confidentialite">politique de confidentialité</RouterLink>.
        </p>
      </form>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import * as authService from '../services/auth.service';
import { errorMessageOf } from '../services/api';
import AppIcon from '../components/AppIcon.vue';
import AuthBrandPanel from '../components/AuthBrandPanel.vue';

const firstName = ref('');
const lastName = ref('');
const phoneNumber = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const errorMessage = ref('');

const router = useRouter();

const handleSubmit = async () => {
  errorMessage.value = '';

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Les mots de passe ne correspondent pas.';
    return;
  }

  loading.value = true;
  try {
    const { phoneNumber: verifiedPhone, otpCode } = await authService.register({
      firstName: firstName.value,
      lastName: lastName.value,
      phoneNumber: phoneNumber.value,
      password: password.value,
    });
    router.push({ name: 'verify-phone', query: { phoneNumber: verifiedPhone, otpCode } });
  } catch (err) {
    errorMessage.value = errorMessageOf(err, 'Inscription impossible.');
  } finally {
    loading.value = false;
  }
};
</script>
