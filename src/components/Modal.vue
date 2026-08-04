<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal__header">
        <h2>{{ title }}</h2>
        <button class="btn btn--icon btn--ghost" aria-label="Fermer" @click="$emit('close')">
          <AppIcon name="x" size="sm" />
        </button>
      </div>
      <div class="modal__body">
        <slot />
      </div>
      <div v-if="$slots.footer" class="modal__footer">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import AppIcon from './AppIcon.vue';

defineProps({ title: { type: String, default: '' } });
const emit = defineEmits(['close']);

const onKeydown = (e) => {
  if (e.key === 'Escape') emit('close');
};

onMounted(() => window.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  z-index: 50;
}
.modal {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  max-width: 520px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: var(--space-5);
}
.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.modal__header h2 {
  margin: 0;
  font-size: 1.2rem;
}
.modal__footer {
  margin-top: var(--space-5);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}
</style>
