<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Mon profil</h1>
        <p class="page-subtitle">Photo de profil et identité affichées dans l'application</p>
      </div>
    </div>

    <div class="card card--narrow">
      <div class="profile-photo-row">
        <AvatarUpload
          size="lg"
          :photo-url="authStore.user?.photoUrl"
          :label="fullName"
          :initials="initialsOf(authStore.user)"
          :uploading="uploading"
          @select="onSelectPhoto"
        />
        <div>
          <p class="profile-photo-row__name">{{ fullName }}</p>
          <p class="profile-photo-row__hint">JPEG, PNG ou WebP — 5 Mo maximum</p>
        </div>
      </div>
      <p v-if="error" class="alert alert--error">{{ error }}</p>
      <p v-if="success" class="alert alert--success">{{ success }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useAuthStore } from '../store/auth.store';
import * as userService from '../services/user.service';
import { initialsOf } from '../utils/format';
import AvatarUpload from '../components/AvatarUpload.vue';

const authStore = useAuthStore();
const fullName = computed(() => `${authStore.user?.firstName || ''} ${authStore.user?.lastName || ''}`.trim());

const uploading = ref(false);
const error = ref('');
const success = ref('');

const onSelectPhoto = async (file) => {
  uploading.value = true;
  error.value = '';
  success.value = '';
  try {
    const user = await userService.uploadMyPhoto(file);
    authStore.updateUser({ photoUrl: user.photoUrl });
    success.value = 'Photo de profil mise à jour.';
  } catch (err) {
    error.value = err.response?.data?.message || "Impossible d'envoyer cette photo.";
  } finally {
    uploading.value = false;
  }
};
</script>

<style scoped>
.profile-photo-row {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}
.profile-photo-row__name {
  margin: 0 0 var(--space-1);
  font-weight: 700;
  font-size: 1.05rem;
}
.profile-photo-row__hint {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

@media (max-width: 480px) {
  .profile-photo-row {
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }
}
</style>
