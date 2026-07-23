<template>
  <div class="pagination" v-if="totalPages > 1">
    <button
      class="btn btn--ghost btn--icon"
      :disabled="page <= 1"
      aria-label="Page précédente"
      @click="$emit('change', page - 1)"
    >
      <AppIcon name="chevronLeft" size="sm" />
    </button>
    <span class="pagination__label">Page {{ page }} / {{ totalPages }}</span>
    <button
      class="btn btn--ghost btn--icon"
      :disabled="page >= totalPages"
      aria-label="Page suivante"
      @click="$emit('change', page + 1)"
    >
      <AppIcon name="chevronRight" size="sm" />
    </button>
  </div>
</template>

<script setup>
import AppIcon from './AppIcon.vue';

defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true },
});
defineEmits(['change']);
</script>
