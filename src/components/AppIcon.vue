<template>
  <svg
    class="icon"
    :class="`icon--${size}`"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    v-html="paths[name] || ''"
  />
</template>

<script setup>
defineProps({
  name: { type: String, required: true },
  size: { type: String, default: 'md' },
});

const paths = {
  heartbeat: '<path d="M3 12h4l2-7 4 14 2-7h6" />',
  phone:
    '<path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.2c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1L6.6 10.8z" fill="currentColor" stroke="none" />',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />',
  messageCircle:
    '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />',
  search: '<circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />',
  users:
    '<circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17" cy="9" r="2.5" /><path d="M15.5 14.2c2.5.4 4.5 2.6 4.5 5.3" />',
  userPlus:
    '<circle cx="9" cy="8" r="3" /><path d="M2 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="16" y1="11" x2="22" y2="11" />',
  logout:
    '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />',
  home: '<path d="M3 11l9-8 9 8" /><path d="M5 10v10h5v-6h4v6h5V10" />',
  chevronLeft: '<polyline points="15 18 9 12 15 6" />',
  chevronRight: '<polyline points="9 18 15 12 9 6" />',
  menu: '<line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />',
  close: '<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />',
};
</script>
