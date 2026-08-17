<template>
  <div class="item-row__actions" :class="{ 'item-row__actions--split': collapsed }">
    <!-- Desktop, ou peu d'actions : tout reste visible. -->
    <template v-if="!collapsed">
      <button
        v-for="action in actions"
        :key="action.key"
        type="button"
        class="btn btn--sm"
        :class="action.danger ? 'btn--danger-ghost' : 'btn--ghost'"
        :disabled="action.disabled"
        @click="$emit('select', action.key)"
      >
        <AppIcon v-if="action.icon" :name="action.icon" size="sm" />
        {{ action.label }}
      </button>
    </template>

    <!-- Mobile : action principale + menu, pour garder la ligne courte. -->
    <template v-else>
      <button
        type="button"
        class="btn btn--sm"
        :class="actions[0].danger ? 'btn--danger-ghost' : 'btn--ghost'"
        :disabled="actions[0].disabled"
        @click="$emit('select', actions[0].key)"
      >
        <AppIcon v-if="actions[0].icon" :name="actions[0].icon" size="sm" />
        {{ actions[0].label }}
      </button>
      <button
        type="button"
        class="btn btn--ghost btn--sm btn--icon"
        :aria-label="`Autres actions — ${title}`"
        @click="open = true"
      >
        <AppIcon name="more" size="sm" />
      </button>

      <AppSheet :open="open" :title="title || 'Actions'" @close="open = false">
        <button
          v-for="action in actions"
          :key="action.key"
          type="button"
          class="action-row"
          :class="{ 'action-row--danger': action.danger }"
          :disabled="action.disabled"
          @click="run(action)"
        >
          <span class="action-row__icon">
            <AppIcon :name="action.icon || 'chevronRight'" size="sm" />
          </span>
          {{ action.label }}
        </button>
      </AppSheet>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import AppIcon from './AppIcon.vue';
import AppSheet from './AppSheet.vue';
import { useIsMobile } from '../composables/useIsMobile';

const props = defineProps({
  /** [{ key, label, icon, danger, disabled }] — la première est l'action principale. */
  actions: { type: Array, required: true },
  /** Titre de la feuille : rappelle sur quelle ligne on agit. */
  title: { type: String, default: '' },
  /** Nombre d'actions affichées en ligne avant repli sur mobile. */
  maxInline: { type: Number, default: 2 },
});
const emit = defineEmits(['select']);

const isMobile = useIsMobile();
const open = ref(false);

const collapsed = computed(() => isMobile.value && props.actions.length > props.maxInline);

watch(collapsed, (value) => {
  if (!value) open.value = false;
});

const run = (action) => {
  open.value = false;
  emit('select', action.key);
};
</script>
