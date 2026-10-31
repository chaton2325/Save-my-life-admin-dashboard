<template>
  <Modal :title="title" @close="$emit('cancel')">
    <p v-if="loadError" class="alert alert--error">{{ loadError }}</p>
    <template v-else>
      <div v-if="aspects.length > 1" class="cropper-aspects" role="group" aria-label="Format du cadrage">
        <button
          v-for="a in aspects"
          :key="a.label"
          type="button"
          class="btn btn--sm"
          :class="a.ratio === ratio ? 'btn--primary' : 'btn--ghost'"
          @click="ratio = a.ratio"
        >
          {{ a.label }}
        </button>
      </div>

      <div
        ref="viewport"
        class="cropper-viewport"
        :class="{ 'cropper-viewport--round': round }"
        :style="{ aspectRatio: ratio }"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @wheel.prevent="onWheel"
      >
        <img
          v-if="src"
          ref="imgEl"
          :src="src"
          alt=""
          draggable="false"
          class="cropper-image"
          :style="imageStyle"
          @load="onImageLoad"
        />
        <span class="cropper-grid" aria-hidden="true"></span>
      </div>

      <div class="cropper-zoom">
        <AppIcon name="search" size="sm" />
        <input v-model.number="zoom" type="range" min="1" max="4" step="0.01" aria-label="Zoom" @input="onZoom" />
      </div>
      <p class="hint" style="margin: 0">Glissez l'image pour la déplacer, utilisez le curseur pour zoomer.</p>
    </template>

    <template #footer>
      <button class="btn btn--ghost" type="button" @click="$emit('cancel')">Annuler</button>
      <button class="btn btn--primary" type="button" :disabled="!ready || working" @click="confirm">
        {{ working ? 'Traitement...' : 'Valider le cadrage' }}
      </button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import Modal from './Modal.vue';
import AppIcon from './AppIcon.vue';
import { baseScale, clampPosition, centeredPosition, zoomedPosition, cropRect } from '../utils/cropMath';

const props = defineProps({
  /** Fichier image choisi par l'utilisateur */
  file: { type: File, required: true },
  title: { type: String, default: 'Recadrer l’image' },
  /** Choix de formats : [{ label, ratio }] (ratio = largeur / hauteur). Un seul = format imposé. */
  aspects: { type: Array, default: () => [{ label: '1:1', ratio: 1 }] },
  /** Largeur en pixels de l'image produite */
  outputWidth: { type: Number, default: 1280 },
  outputType: { type: String, default: 'image/jpeg' },
  /** Aperçu circulaire (photo de profil) */
  round: { type: Boolean, default: false },
});
const emit = defineEmits(['cropped', 'cancel']);

const viewport = ref(null);
const imgEl = ref(null);
const src = ref('');
const loadError = ref('');
const ratio = ref(props.aspects[0]?.ratio || 1);
const zoom = ref(1);
const natural = ref({ w: 0, h: 0 });
const box = ref({ w: 0, h: 0 });
const pos = ref({ x: 0, y: 0 });
const ready = ref(false);
const working = ref(false);

const scale = computed(() => baseScale(box.value, natural.value) * zoom.value);

const imageStyle = computed(() => ({
  width: `${natural.value.w * scale.value}px`,
  height: `${natural.value.h * scale.value}px`,
  transform: `translate(${pos.value.x}px, ${pos.value.y}px)`,
}));

const clamp = (x, y) => clampPosition(box.value, natural.value, scale.value, x, y);

const measure = () => {
  if (!viewport.value) return;
  box.value = { w: viewport.value.clientWidth, h: viewport.value.clientHeight };
};

const center = () => {
  pos.value = centeredPosition(box.value, natural.value, scale.value);
};

const onImageLoad = async () => {
  natural.value = { w: imgEl.value.naturalWidth, h: imgEl.value.naturalHeight };
  await nextTick();
  measure();
  center();
  ready.value = true;
};

// Zoom centré sur le milieu du cadre.
const setZoom = (next) => {
  const oldScale = scale.value;
  zoom.value = Math.min(4, Math.max(1, next));
  pos.value = zoomedPosition(box.value, natural.value, oldScale, scale.value, pos.value);
};
const onZoom = () => setZoom(zoom.value);
const onWheel = (e) => setZoom(zoom.value - e.deltaY * 0.002);

let drag = null;
const onPointerDown = (e) => {
  if (!ready.value) return;
  viewport.value.setPointerCapture(e.pointerId);
  drag = { x: e.clientX, y: e.clientY, px: pos.value.x, py: pos.value.y };
};
const onPointerMove = (e) => {
  if (!drag) return;
  pos.value = clamp(drag.px + e.clientX - drag.x, drag.py + e.clientY - drag.y);
};
const onPointerUp = () => {
  drag = null;
};

// Changement de format ou de taille d'écran : on remesure et on recentre.
watch(ratio, async () => {
  await nextTick();
  measure();
  zoom.value = 1;
  center();
});
const onResize = () => {
  if (!ready.value) return;
  // L'échelle de base dépend du cadre : on garde le point central de l'image.
  const old = { box: box.value, scale: scale.value };
  measure();
  const cx = (old.box.w / 2 - pos.value.x) / old.scale;
  const cy = (old.box.h / 2 - pos.value.y) / old.scale;
  pos.value = clamp(box.value.w / 2 - cx * scale.value, box.value.h / 2 - cy * scale.value);
};

const confirm = async () => {
  working.value = true;
  try {
    const { sx, sy, sw, sh, outW, outH } = cropRect(box.value, scale.value, pos.value, props.outputWidth);
    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (props.outputType === 'image/jpeg') {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, outW, outH);
    }
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(imgEl.value, sx, sy, sw, sh, 0, 0, outW, outH);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, props.outputType, 0.9));
    if (!blob) throw new Error('empty');
    const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
    const base = props.file.name.replace(/\.[^.]+$/, '') || 'image';
    emit('cropped', new File([blob], `${base}.${ext}`, { type: blob.type }));
  } catch {
    loadError.value = 'Impossible de recadrer cette image.';
  } finally {
    working.value = false;
  }
};

onMounted(() => {
  if (!props.file.type.startsWith('image/')) {
    loadError.value = 'Ce fichier n’est pas une image.';
    return;
  }
  src.value = URL.createObjectURL(props.file);
  window.addEventListener('resize', onResize);
});
onBeforeUnmount(() => {
  if (src.value) URL.revokeObjectURL(src.value);
  window.removeEventListener('resize', onResize);
});
</script>

<style scoped>
.cropper-aspects {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}
.cropper-viewport {
  position: relative;
  width: 100%;
  max-height: 50vh;
  margin: 0 auto;
  overflow: hidden;
  background: #111827;
  border-radius: var(--radius-lg);
  cursor: grab;
  touch-action: none;
  user-select: none;
}
.cropper-viewport:active {
  cursor: grabbing;
}
.cropper-viewport--round {
  border-radius: 50%;
  max-width: 320px;
}
.cropper-image {
  position: absolute;
  top: 0;
  left: 0;
  max-width: none;
  pointer-events: none;
}
.cropper-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.85);
  background:
    linear-gradient(to right, transparent 33.2%, rgba(255, 255, 255, 0.35) 33.3%, transparent 33.5%, transparent 66.5%, rgba(255, 255, 255, 0.35) 66.6%, transparent 66.8%),
    linear-gradient(to bottom, transparent 33.2%, rgba(255, 255, 255, 0.35) 33.3%, transparent 33.5%, transparent 66.5%, rgba(255, 255, 255, 0.35) 66.6%, transparent 66.8%);
}
.cropper-zoom {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin: var(--space-3) 0 var(--space-2);
}
.cropper-zoom input {
  flex: 1;
  padding: 0;
}
</style>
