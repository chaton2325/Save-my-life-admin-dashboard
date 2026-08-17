<template>
  <Teleport to="body">
    <Transition name="sheet-fade">
      <div v-if="open" class="sheet-backdrop" @click="$emit('close')"></div>
    </Transition>
    <Transition name="sheet-slide">
      <section v-if="open" class="sheet" role="dialog" aria-modal="true" :aria-label="title">
        <span class="sheet__grabber" aria-hidden="true"></span>
        <header v-if="title" class="sheet__header">
          <h2>{{ title }}</h2>
          <button class="btn btn--icon btn--ghost" aria-label="Fermer" @click="$emit('close')">
            <AppIcon name="x" size="sm" />
          </button>
        </header>
        <div class="sheet__body">
          <slot />
        </div>
        <footer v-if="$slots.footer" class="sheet__footer">
          <slot name="footer" />
        </footer>
      </section>
    </Transition>
  </Teleport>
</template>

<script setup>
import { toRef, onMounted, onBeforeUnmount } from 'vue';
import AppIcon from './AppIcon.vue';
import { useScrollLock } from '../composables/useScrollLock';

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
});
const emit = defineEmits(['close']);

useScrollLock(toRef(props, 'open'));

const onKeydown = (e) => {
  if (e.key === 'Escape' && props.open) emit('close');
};

onMounted(() => window.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
</script>
