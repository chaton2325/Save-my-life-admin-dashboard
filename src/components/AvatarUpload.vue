<template>
  <button
    type="button"
    class="avatar-upload"
    :class="[`avatar-upload--${size}`, shape === 'square' ? 'avatar-upload--square' : '']"
    :disabled="uploading"
    :aria-label="`Changer la photo — ${label}`"
    @click="fileInput?.click()"
  >
    <img v-if="resolvedUrl" :src="resolvedUrl" :alt="label" />
    <span v-else class="avatar-upload__initials">{{ initials }}</span>
    <span class="avatar-upload__badge">
      <span v-if="uploading" class="spinner"></span>
      <AppIcon v-else name="camera" size="sm" />
    </span>
    <input
      ref="fileInput"
      type="file"
      accept="image/png,image/jpeg,image/webp"
      class="avatar-upload__input"
      @click.stop
      @change="onChange"
    />
  </button>
</template>

<script setup>
import { computed, ref } from 'vue';
import AppIcon from './AppIcon.vue';
import { assetUrl } from '../utils/media';

const props = defineProps({
  photoUrl: { type: String, default: '' },
  label: { type: String, default: '' },
  initials: { type: String, default: '' },
  /** 'md' (formulaires) ou 'lg' (page de profil) */
  size: { type: String, default: 'md' },
  /** 'circle' (personnes) ou 'square' (logo de clinique) */
  shape: { type: String, default: 'circle' },
  uploading: { type: Boolean, default: false },
});
const emit = defineEmits(['select']);

const fileInput = ref(null);
const resolvedUrl = computed(() => assetUrl(props.photoUrl));

const onChange = (e) => {
  const file = e.target.files?.[0];
  if (file) emit('select', file);
  e.target.value = '';
};
</script>

<style scoped>
.avatar-upload {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 2px solid var(--color-border);
  border-radius: 50%;
  background: var(--color-primary-soft);
  color: var(--color-primary-dark);
  font-weight: 800;
  overflow: hidden;
  cursor: pointer;
  flex-shrink: 0;
}
.avatar-upload:disabled {
  opacity: 0.7;
  cursor: default;
}
.avatar-upload--md {
  width: 72px;
  height: 72px;
  font-size: 1.2rem;
}
.avatar-upload--lg {
  width: 112px;
  height: 112px;
  font-size: 1.8rem;
}
.avatar-upload--square {
  border-radius: var(--radius-lg);
}
.avatar-upload img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-upload--square img {
  object-fit: contain;
  background: var(--color-surface);
}
.avatar-upload__badge {
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--color-surface);
}
.avatar-upload__input {
  display: none;
}
</style>
