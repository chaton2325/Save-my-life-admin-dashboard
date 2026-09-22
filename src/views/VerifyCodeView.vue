<template>
  <div class="auth-screen">
    <AuthBrandPanel tagline="Encore une étape avant d'accéder à votre espace." />

    <section class="auth-form-panel">
      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="auth-form__header">
          <h2>Vérifiez votre email</h2>
          <p>
            Un code à 6 chiffres a été envoyé à <strong>{{ destination }}</strong>. Il est valable 10 minutes.
          </p>
        </div>

        <p v-if="infoMessage" class="alert alert--success">{{ infoMessage }}</p>

        <div class="field">
          <label for="code">Code de vérification</label>
          <input
            id="code"
            v-model="code"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            placeholder="000000"
            required
          />
        </div>

        <p v-if="errorMessage" class="alert alert--error">{{ errorMessage }}</p>

        <button type="submit" class="btn btn--primary btn--block" :disabled="loading || code.length !== 6">
          <span v-if="loading" class="spinner"></span>
          {{ loading ? 'Vérification...' : 'Vérifier' }}
        </button>

        <button
          type="button"
          class="btn btn--ghost btn--block"
          style="margin-top: var(--space-3)"
          :disabled="resending || remaining > 0"
          @click="handleResend"
        >
          {{ resendLabel }}
        </button>

        <p class="auth-switch">
          Pas reçu ? Vérifiez vos courriers indésirables, ou
          <RouterLink to="/inscription">corrigez votre adresse</RouterLink>.
        </p>
      </form>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth.store';
import * as authService from '../services/auth.service';
import { errorMessageOf } from '../services/api';
import { maskEmail } from '../utils/format';
import { useCooldown } from '../composables/useCooldown';
import AuthBrandPanel from '../components/AuthBrandPanel.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// Le compte est désigné par son email (inscription, connexion par code) ou, après une tentative de
// connexion par mot de passe sur un compte non confirmé, par son téléphone.
const email = ref(route.query.email || '');
const phoneNumber = ref(route.query.phoneNumber || '');
const hint = ref(route.query.hint || '');

const code = ref('');
const loading = ref(false);
const resending = ref(false);
const errorMessage = ref('');
const infoMessage = ref('');
const { remaining, start: startCooldown } = useCooldown(60);

const destination = computed(() => hint.value || (email.value ? maskEmail(email.value) : 'votre adresse email'));
const resendLabel = computed(() => {
  if (resending.value) return 'Envoi...';
  return remaining.value > 0 ? `Renvoyer le code (${remaining.value} s)` : 'Renvoyer le code';
});

const sendCode = async ({ announce }) => {
  resending.value = true;
  errorMessage.value = '';
  try {
    const result = await authService.resendCode({
      email: email.value || undefined,
      phoneNumber: email.value ? undefined : phoneNumber.value,
    });
    if (result.email) hint.value = result.email;
    infoMessage.value = announce ? 'Un nouveau code vient d’être envoyé.' : '';
    startCooldown();
  } catch (err) {
    errorMessage.value = errorMessageOf(err, 'Impossible d’envoyer le code.');
  } finally {
    resending.value = false;
  }
};

const handleResend = () => sendCode({ announce: true });

const handleSubmit = async () => {
  errorMessage.value = '';
  infoMessage.value = '';
  loading.value = true;
  try {
    const { user, token } = await authService.verifyCode({
      email: email.value || undefined,
      phoneNumber: email.value ? undefined : phoneNumber.value,
      code: code.value.trim(),
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
  if (!email.value && !phoneNumber.value) {
    router.replace('/login');
    return;
  }
  // Arrivé de l'inscription ou de la connexion par code : le code est déjà parti, on attend avant
  // d'autoriser un renvoi. Arrivé d'une connexion par mot de passe : on l'envoie maintenant.
  if (route.query.send === '1') sendCode({ announce: false });
  else startCooldown();
});

</script>
