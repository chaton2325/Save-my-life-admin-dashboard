<template>
  <button
    v-if="resolvedUrl"
    v-bind="$attrs"
    type="button"
    class="avatar avatar--photo"
    :class="[size ? `avatar--${size}` : '', shape === 'square' ? 'avatar--square' : '']"
    :aria-label="`Agrandir la photo — ${label}`"
    @click="open = true"
  >
    <img :src="resolvedUrl" :alt="label" loading="lazy" />
  </button>
  <span
    v-else
    v-bind="$attrs"
    class="avatar"
    :class="[size ? `avatar--${size}` : '', { 'avatar--muted': muted }, shape === 'square' ? 'avatar--square' : '']"
    aria-hidden="true"
  >
    {{ initials }}
  </span>

  <ImageLightbox v-if="open" :src="resolvedUrl" :alt="label" @close="open = false" />
</template>

<script setup>
import { computed, ref } from 'vue';
import ImageLightbox from './ImageLightbox.vue';
import { assetUrl } from '../utils/media';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  photoUrl: { type: String, default: '' },
  label: { type: String, default: '' },
  initials: { type: String, default: '' },
  /** '', 'sm', 'lg' — reprend les tailles existantes de .avatar */
  size: { type: String, default: '' },
  muted: { type: Boolean, default: false },
  /** 'circle' (personnes) ou 'square' (logo de clinique) */
  shape: { type: String, default: 'circle' },
});

const open = ref(false);
const resolvedUrl = computed(() => assetUrl(props.photoUrl));
</script>

<style scoped>
.avatar--photo {
  padding: 0;
  overflow: hidden;
  border: none;
  cursor: zoom-in;
  transition: opacity 0.15s var(--ease);
}
.avatar--photo:hover {
  opacity: 0.88;
}
.avatar--photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
}
.avatar--square {
  border-radius: var(--radius);
}
.avatar--square.avatar--photo img {
  object-fit: contain;
  background: var(--color-surface);
}
</style>
