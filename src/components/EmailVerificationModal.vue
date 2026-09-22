<template>
  <Modal :title="step === 'email' ? 'Mon adresse email' : 'Confirmer mon email'" @close="$emit('close')">
    <!-- Étape 1 : l'adresse -->
    <form v-if="step === 'email'" @submit.prevent="sendCode">
      <p class="modal-hint">
        Nous enverrons un code à 6 chiffres à cette adresse. Elle vous servira à vous connecter avec un code, sans mot
        de passe.
      </p>
      <div class="field">
        <label for="verify-email">Adresse email</label>
        <div class="input-icon">
          <AppIcon name="mail" size="sm" />
          <input
            id="verify-email"
            v-model="email"
            type="email"
            autocomplete="email"
            placeholder="vous@exemple.com"
            required
          />
        </div>
      </div>
      <p v-if="errorMessage" class="alert alert--error">{{ errorMessage }}</p>
      <button type="submit" class="btn btn--primary btn--block" :disabled="loading">
        <span v-if="loading" class="spinner"></span>
        {{ loading ? 'Envoi...' : 'Envoyer le code' }}
      </button>
    </form>

    <!-- Étape 2 : le code reçu -->
    <form v-else @submit.prevent="confirm">
      <p class="modal-hint">
        Un code à 6 chiffres a été envoyé à <strong>{{ hint }}</strong>. Il est valable 10 minutes.
      </p>
      <p v-if="infoMessage" class="alert alert--success">{{ infoMessage }}</p>
      <div class="field">
        <label for="verify-code">Code de vérification</label>
        <input
          id="verify-code"
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
        {{ loading ? 'Vérification...' : 'Confirmer' }}
      </button>
      <div class="form-actions">
        <button type="button" class="btn btn--ghost btn--sm" :disabled="loading || remaining > 0" @click="sendCode">
          {{ remaining > 0 ? `Renvoyer (${remaining} s)` : 'Renvoyer le code' }}
        </button>
        <button type="button" class="btn btn--ghost btn--sm" @click="changeAddress">Changer d'adresse</button>
      </div>
    </form>
  </Modal>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../store/auth.store';
import * as authService from '../services/auth.service';
import { errorMessageOf } from '../services/api';
import { useCooldown } from '../composables/useCooldown';
import AppIcon from './AppIcon.vue';
import Modal from './Modal.vue';

const props = defineProps({
  /** Adresse préremplie (email actuel non confirmé, ou adresse en attente). */
  initialEmail: { type: String, default: '' },
});
const emit = defineEmits(['close', 'verified']);

const authStore = useAuthStore();
const { remaining, start: startCooldown } = useCooldown(60);

const step = ref('email');
const email = ref(props.initialEmail);
const code = ref('');
const hint = ref('');
const loading = ref(false);
const errorMessage = ref('');
const infoMessage = ref('');

const sendCode = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const result = await authService.requestEmail(email.value.trim());
    hint.value = result.email;
    infoMessage.value = step.value === 'code' ? 'Un nouveau code vient d’être envoyé.' : '';
    step.value = 'code';
    startCooldown();
  } catch (err) {
    errorMessage.value = errorMessageOf(err, 'Impossible d’envoyer le code.');
  } finally {
    loading.value = false;
  }
};

const confirm = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const user = await authService.confirmEmail(code.value.trim());
    authStore.setSession(user, authStore.token);
    emit('verified');
    emit('close');
  } catch (err) {
    errorMessage.value = errorMessageOf(err, 'Code invalide.');
  } finally {
    loading.value = false;
  }
};

const changeAddress = () => {
  step.value = 'email';
  code.value = '';
  errorMessage.value = '';
  infoMessage.value = '';
};
</script>

<style scoped>
.modal-hint {
  margin: 0 0 var(--space-4);
  font-size: 0.9rem;
  color: var(--color-text-muted);
}
</style>
