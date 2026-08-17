<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal" role="dialog" aria-modal="true">
      <span class="modal__grabber" aria-hidden="true"></span>
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
import { useScrollLock } from '../composables/useScrollLock';

defineProps({ title: { type: String, default: '' } });
const emit = defineEmits(['close']);

useScrollLock();

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
  -webkit-backdrop-filter: blur(3px);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  z-index: 50;
  animation: modal-fade 0.2s var(--ease);
}
.modal {
  position: relative;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  max-width: 520px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: var(--space-5);
  animation: modal-pop 0.24s var(--ease-spring);
}
.modal__grabber {
  display: none;
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

@keyframes modal-fade {
  from {
    opacity: 0;
  }
}
@keyframes modal-pop {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
}

/* Sur mobile la modale devient une feuille remontant du bas de l'écran. */
@media (max-width: 640px) {
  .modal-backdrop {
    align-items: flex-end;
    padding: 0;
  }
  .modal {
    max-width: none;
    max-height: 92dvh;
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    padding: var(--space-2) var(--space-4) calc(var(--space-5) + var(--safe-bottom));
    animation: sheet-up 0.28s var(--ease-spring);
  }
  .modal__grabber {
    display: block;
    width: 42px;
    height: 4px;
    margin: 8px auto var(--space-2);
    border-radius: 999px;
    background: var(--color-border-strong);
  }
  .modal__header {
    position: sticky;
    top: 0;
    z-index: 1;
    background: var(--color-surface);
    padding-bottom: var(--space-2);
    margin-bottom: var(--space-3);
  }
  .modal__header h2 {
    font-size: 1.05rem;
  }
  .modal__footer {
    margin-top: var(--space-4);
  }
  @keyframes sheet-up {
    from {
      transform: translateY(100%);
    }
  }
}
</style>
