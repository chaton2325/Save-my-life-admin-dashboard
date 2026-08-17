<template>
  <div class="item-list" aria-busy="true" aria-live="polite">
    <span class="sr-only">Chargement en cours…</span>
    <div v-for="n in rows" :key="n" class="skeleton-row">
      <span v-if="avatar" class="skeleton skeleton-row__avatar"></span>
      <span class="skeleton-row__lines">
        <span class="skeleton skeleton-row__line skeleton-row__line--title"></span>
        <span class="skeleton skeleton-row__line skeleton-row__line--meta"></span>
      </span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  rows: { type: Number, default: 4 },
  avatar: { type: Boolean, default: true },
});
</script>
