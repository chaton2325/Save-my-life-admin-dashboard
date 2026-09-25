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
      <AppIcon :name="visible ? 'eyeOff' : 'eye'" size="md" />
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
  padding-right: 48px;
}
.input-icon__toggle {
  position: absolute;
  top: 50%;
  right: 4px;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: var(--radius);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
}
.input-icon__toggle:hover,
.input-icon__toggle:active {
  color: var(--color-text);
  background: var(--color-surface-hover);
}
</style>
