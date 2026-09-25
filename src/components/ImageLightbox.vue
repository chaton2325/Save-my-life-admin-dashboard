<template>
  <Teleport to="body">
    <div class="lightbox-backdrop" @click.self="$emit('close')">
      <button class="lightbox-close" type="button" aria-label="Fermer" @click="$emit('close')">
        <AppIcon name="x" size="sm" />
      </button>
      <img :src="src" :alt="alt" class="lightbox-image" />
    </div>
  </Teleport>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import AppIcon from './AppIcon.vue';
import { useScrollLock } from '../composables/useScrollLock';

defineProps({
  src: { type: String, required: true },
  alt: { type: String, default: '' },
});
const emit = defineEmits(['close']);

useScrollLock();

const onKeydown = (e) => {
  if (e.key === 'Escape') emit('close');
};

onMounted(() => window.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
</script>

<style scoped>
.lightbox-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(10, 14, 26, 0.88);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  z-index: 80;
  animation: lightbox-fade 0.15s var(--ease);
}
.lightbox-image {
  max-width: min(90vw, 720px);
  max-height: 85vh;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  object-fit: contain;
  animation: lightbox-pop 0.2s var(--ease-spring);
}
.lightbox-close {
  position: fixed;
  top: calc(var(--space-4) + var(--safe-top));
  right: calc(var(--space-4) + var(--safe-right));
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1;
}
.lightbox-close:hover {
  background: rgba(255, 255, 255, 0.24);
}

@keyframes lightbox-fade {
  from {
    opacity: 0;
  }
}
@keyframes lightbox-pop {
  from {
    opacity: 0;
    transform: scale(0.94);
  }
}

@media (max-width: 640px) {
  .lightbox-backdrop {
    padding: var(--space-3);
  }
  .lightbox-image {
    max-width: 94vw;
    max-height: 80vh;
  }
}
</style>
