<template>
  <!-- Desktop : le formulaire reste dans le flux de la page. -->
  <template v-if="!isMobile">
    <h2 class="section-title">{{ title }}</h2>
    <div class="card card--narrow">
      <slot />
    </div>
  </template>

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
