<template>
  <nav class="tabbar" :class="{ 'tabbar--hidden': hidden && !moreActive }" aria-label="Navigation principale">
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
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import AppIcon from './AppIcon.vue';

const props = defineProps({
  tabs: { type: Array, default: () => [] },
  unreadCount: { type: Number, default: 0 },
  moreActive: { type: Boolean, default: false },
  moreBadge: { type: Boolean, default: false },
});
defineEmits(['more']);

const route = useRoute();

const badgeFor = (tab) => {
  if (tab.badge !== 'notifications' || props.unreadCount <= 0) return '';
  return props.unreadCount > 9 ? '9+' : String(props.unreadCount);
};

/* La barre s'efface quand on descend dans une longue liste et revient dès que
   l'on remonte : le contenu récupère toute la hauteur de l'écran. */
const hidden = ref(false);
const HIDE_AFTER = 140;
const DELTA = 8;
let lastY = 0;
let ticking = false;

const update = () => {
  ticking = false;
  const y = Math.max(0, window.scrollY);
  const bottom = document.documentElement.scrollHeight - window.innerHeight - y;

  if (y < HIDE_AFTER || bottom < 48) hidden.value = false;
  else if (y - lastY > DELTA) hidden.value = true;
  else if (lastY - y > DELTA) hidden.value = false;

  lastY = y;
};

const onScroll = () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(update);
};

watch(
  () => route.fullPath,
  () => {
    hidden.value = false;
    lastY = 0;
  }
);

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }));
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll));
</script>
