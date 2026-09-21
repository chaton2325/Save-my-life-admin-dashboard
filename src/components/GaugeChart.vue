<template>
  <figure class="gauge" :style="color ? { '--gauge-color': color } : null">
    <svg viewBox="0 0 200 116" role="img" :aria-label="`${label} : ${clamped} %`">
      <path class="gauge__track" d="M 22 100 A 78 78 0 0 1 178 100" pathLength="100" />
      <path
        class="gauge__fill"
        d="M 22 100 A 78 78 0 0 1 178 100"
        pathLength="100"
        :stroke-dasharray="`${clamped} 100`"
      />
      <g class="gauge__needle" :style="{ transform: `rotate(${angle}deg)` }">
        <line x1="100" y1="100" x2="100" y2="38" />
      </g>
      <circle class="gauge__hub" cx="100" cy="100" r="9" />
      <text class="gauge__bound" x="22" y="115" text-anchor="middle">0%</text>
      <text class="gauge__bound" x="178" y="115" text-anchor="middle">100%</text>
    </svg>
    <p class="gauge__value">{{ clamped }}<span class="gauge__unit">%</span></p>
    <figcaption v-if="label" class="gauge__label">{{ label }}</figcaption>
  </figure>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  /** Pourcentage de 0 à 100. */
  value: { type: Number, default: 0 },
  label: { type: String, default: '' },
  /** Couleur de l'arc (par défaut : bleu de la marque). */
  color: { type: String, default: '' },
});

const clamped = computed(() => Math.min(100, Math.max(0, Math.round(props.value || 0))));
// -90° = aiguille vers la gauche (0 %), +90° = vers la droite (100 %)
const angle = computed(() => -90 + clamped.value * 1.8);
</script>
