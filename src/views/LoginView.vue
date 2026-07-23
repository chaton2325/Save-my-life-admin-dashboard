<template>
  <div class="auth-screen">
    <section class="auth-brand">
      <div class="auth-brand__decor">
        <span class="blob blob--1"></span>
        <span class="blob blob--2"></span>
      </div>

      <svg
        class="auth-curve auth-curve--vertical"
        viewBox="0 0 100 800"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M50,0 Q100,200 50,400 Q0,600 50,800 L100,800 L100,0 Z" />
      </svg>
      <svg
        class="auth-curve auth-curve--horizontal"
        viewBox="0 0 400 60"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0,30 Q100,60 200,30 Q300,0 400,30 L400,60 L0,60 Z" />
      </svg>

      <div class="auth-brand__content">
        <div class="auth-brand__logo">
          <AppIcon name="heartbeat" size="lg" />
        </div>
        <h1>Save My Life</h1>
        <p>Gérez vos patients et vos administrateurs en toute sécurité, où que vous soyez.</p>
      </div>
    </section>

    <section class="auth-form-panel">
      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="auth-form__header">
          <h2>Connexion administrateur</h2>
          <p>Connectez-vous avec votre numéro de téléphone</p>
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
            <input id="password" v-model="password" type="password" placeholder="••••••••" required />
          </div>
        </div>

        <p v-if="errorMessage" class="alert alert--error">{{ errorMessage }}</p>

        <button type="submit" class="btn btn--primary btn--block" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          {{ loading ? 'Connexion...' : 'Se connecter' }}
        </button>
      </form>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth.store';
import AppIcon from '../components/AppIcon.vue';

const phoneNumber = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');

const authStore = useAuthStore();
const router = useRouter();

const handleSubmit = async () => {
  errorMessage.value = '';
  loading.value = true;
  try {
    await authStore.login(phoneNumber.value, password.value);
    router.push('/patients');
  } catch (err) {
    errorMessage.value = err.response?.data?.message || err.message || 'Connexion impossible.';
  } finally {
    loading.value = false;
  }
};
</script>
