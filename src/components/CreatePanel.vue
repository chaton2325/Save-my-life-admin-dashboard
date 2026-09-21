<template>
  <!-- Desktop : un panneau repliable dans le flux de la page. -->
  <details v-if="!isMobile" class="disclosure create-panel" :open="open" @toggle="open = $event.target.open">
    <summary class="disclosure__summary">
      <span class="quick-link-card__icon"><AppIcon :name="icon" /></span>
      <span class="disclosure__text">
        <span class="disclosure__title">{{ title }}</span>
        <span class="disclosure__hint">Cliquez pour ouvrir le formulaire</span>
      </span>
      <AppIcon name="chevronRight" class="disclosure__chevron" />
    </summary>
    <div class="disclosure__body">
      <div class="create-panel__form">
        <slot />
      </div>
    </div>
  </details>

  <!-- Mobile : bouton flottant + feuille, pour ne pas allonger la page. -->
  <template v-else>
    <div class="fab-spacer" aria-hidden="true"></div>
    <button type="button" class="fab" @click="open = true">
      <AppIcon :name="icon" size="sm" />
      {{ triggerLabel || title }}
    </button>
    <AppSheet :open="open" :title="title" @close="open = false">
      <slot />
    </AppSheet>
  </template>
</template>

<script setup>
import { ref, watch } from 'vue';
import AppIcon from './AppIcon.vue';
import AppSheet from './AppSheet.vue';
import { useIsMobile } from '../composables/useIsMobile';

const props = defineProps({
  title: { type: String, required: true },
  triggerLabel: { type: String, default: '' },
  icon: { type: String, default: 'plus' },
});

const isMobile = useIsMobile();
const open = ref(false);

// Le formulaire redevenant inline sur grand écran, la feuille ne doit pas rester ouverte.
watch(isMobile, (value) => {
  if (!value) open.value = false;
});

defineExpose({
  close: () => {
    open.value = false;
  },
  isOpen: () => open.value,
  title: props.title,
});
</script>
