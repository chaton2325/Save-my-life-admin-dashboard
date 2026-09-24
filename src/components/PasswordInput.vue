<template>
  <div class="input-icon input-icon--password">
    <AppIcon name="lock" size="sm" />
    <input v-model="model" :type="visible ? 'text' : 'password'" v-bind="$attrs" />
    <button
      type="button"
      class="input-icon__toggle"
      :aria-label="visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
      tabindex="-1"
      @click="visible = !visible"
    >
      <AppIcon :name="visible ? 'eyeOff' : 'eye'" size="sm" />
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import AppIcon from './AppIcon.vue';

defineOptions({ inheritAttrs: false });
const model = defineModel({ type: String, default: '' });
const visible = ref(false);
</script>

<style scoped>
.input-icon--password input {
  padding-right: 42px;
}
.input-icon__toggle {
  position: absolute;
  right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border: none;
  background: transparent;
  color: var(--color-text-faint);
  cursor: pointer;
}
.input-icon__toggle:hover {
  color: var(--color-text-muted);
}
</style>
