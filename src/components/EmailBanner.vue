<template>
  <div v-if="visible" class="email-banner" role="status">
    <span class="email-banner__icon"><AppIcon name="mail" /></span>
    <p class="email-banner__text">
      <strong>{{ hasEmail ? 'Confirmez votre adresse email.' : 'Ajoutez votre adresse email.' }}</strong>
      Elle sert à recevoir vos codes de connexion et à sécuriser votre compte.
    </p>
    <div class="email-banner__actions">
      <button type="button" class="btn btn--primary btn--sm" @click="open = true">
        {{ hasEmail ? 'Confirmer mon email' : 'Ajouter mon email' }}
      </button>
      <button type="button" class="btn btn--ghost btn--icon btn--sm" aria-label="Plus tard" @click="dismiss">
        <AppIcon name="x" size="sm" />
      </button>
    </div>
  </div>

  <EmailVerificationModal
    v-if="open"
    :initial-email="authStore.user?.pendingEmail || authStore.user?.email || ''"
    @close="open = false"
  />
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '../store/auth.store';
import AppIcon from './AppIcon.vue';
import EmailVerificationModal from './EmailVerificationModal.vue';

const DISMISSED_KEY = 'sml_email_banner_dismissed';

const authStore = useAuthStore();
const open = ref(false);

// « Plus tard » ne masque la bannière que pour la session : on la reproposera à la prochaine visite.
const readDismissed = () => {
  try {
    return sessionStorage.getItem(DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
};
const dismissed = ref(readDismissed());

const dismiss = () => {
  dismissed.value = true;
  try {
    sessionStorage.setItem(DISMISSED_KEY, '1');
  } catch {
    // Stockage indisponible (navigation privée...) : la bannière reste masquée jusqu'au rechargement.
  }
};

const hasEmail = computed(() => Boolean(authStore.user?.email));
const visible = computed(() => Boolean(authStore.user) && !authStore.user.emailVerified && !dismissed.value);
</script>
