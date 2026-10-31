<template>
  <div v-if="images.length" class="gallery">
    <button
      v-for="(image, index) in images"
      :key="image.id"
      type="button"
      class="gallery__item"
      :aria-label="`Agrandir — ${image.name}`"
      @click="current = index"
    >
      <img :src="assetUrl(image.imageUrl)" :alt="image.name" loading="lazy" />
      <span class="gallery__name">{{ image.name }}</span>
    </button>
  </div>
  <p v-else class="hint" style="margin: 0">Aucune image dans la galerie pour le moment.</p>

  <ImageLightbox
    v-if="current !== null"
    :src="assetUrl(images[current].imageUrl)"
    :alt="images[current].name"
    :caption="`${images[current].name} (${current + 1}/${images.length})`"
    :navigable="images.length > 1"
    @close="current = null"
    @prev="current = (current - 1 + images.length) % images.length"
    @next="current = (current + 1) % images.length"
  />
</template>

<script setup>
import { ref } from 'vue';
import ImageLightbox from './ImageLightbox.vue';
import { assetUrl } from '../utils/media';

defineProps({ images: { type: Array, default: () => [] } });
const current = ref(null);
</script>

<style scoped>
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: var(--space-3);
}
.gallery__item {
  position: relative;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-primary-soft);
  aspect-ratio: 4 / 3;
  cursor: pointer;
}
.gallery__item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.25s var(--ease);
}
.gallery__item:hover img {
  transform: scale(1.04);
}
.gallery__name {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: var(--space-2) var(--space-3);
  background: linear-gradient(to top, rgba(10, 14, 26, 0.78), transparent);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
@media (max-width: 640px) {
  .gallery {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-2);
  }
}
</style>
