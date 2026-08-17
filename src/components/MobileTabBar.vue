<template>
  <nav class="tabbar" aria-label="Navigation principale">
    <RouterLink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="tabbar__item"
      :class="{ 'tabbar__item--accent': tab.accent }"
    >
      <span class="tabbar__icon">
        <AppIcon :name="tab.icon" />
        <span v-if="badgeFor(tab)" class="tabbar__badge">{{ badgeFor(tab) }}</span>
      </span>
      <span class="tabbar__label">{{ tab.short || tab.label }}</span>
    </RouterLink>

    <button
      type="button"
      class="tabbar__item"
      :class="{ 'is-active': moreActive }"
      :aria-expanded="moreActive"
      aria-label="Plus d'options"
      @click="$emit('more')"
    >
      <span class="tabbar__icon">
        <AppIcon name="more" />
        <span v-if="moreBadge" class="tabbar__dot"></span>
      </span>
      <span class="tabbar__label">Plus</span>
    </button>
  </nav>
</template>

<script setup>
import AppIcon from './AppIcon.vue';

const props = defineProps({
  tabs: { type: Array, default: () => [] },
  unreadCount: { type: Number, default: 0 },
  moreActive: { type: Boolean, default: false },
  moreBadge: { type: Boolean, default: false },
});
defineEmits(['more']);

const badgeFor = (tab) => {
  if (tab.badge !== 'notifications' || props.unreadCount <= 0) return '';
  return props.unreadCount > 9 ? '9+' : String(props.unreadCount);
};
</script>
