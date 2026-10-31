<template>
  <div class="media-editor">
    <!-- Couverture -->
    <div class="field">
      <label>Photo de couverture</label>
      <div class="media-cover" :class="{ 'media-cover--empty': !coverSrc }">
        <img v-if="coverSrc" :src="coverSrc" alt="Couverture" />
        <span v-else class="hint" style="margin: 0">Aucune couverture</span>
        <button type="button" class="btn btn--ghost btn--sm media-cover__btn" :disabled="busy === 'cover'" @click="pick('cover')">
          <span v-if="busy === 'cover'" class="spinner spinner--dark"></span>
          <AppIcon v-else name="camera" size="sm" />
          {{ coverSrc ? 'Changer' : 'Ajouter' }}
        </button>
      </div>
    </div>

    <!-- Photo de profil -->
    <div class="field">
      <label>Photo de profil</label>
      <button type="button" class="media-logo" :disabled="busy === 'logo'" aria-label="Changer la photo de profil" @click="pick('logo')">
        <img v-if="logoSrc" :src="logoSrc" alt="Photo de profil" />
        <AppIcon v-else name="building" />
        <span class="media-logo__badge">
          <span v-if="busy === 'logo'" class="spinner"></span>
          <AppIcon v-else name="camera" size="sm" />
        </span>
      </button>
    </div>

    <!-- Galerie -->
    <div class="field">
      <label>Galerie ({{ items.length }})</label>
      <div class="media-grid">
        <div v-for="item in items" :key="item.key" class="media-item">
          <div class="media-item__img">
            <img :src="item.src" :alt="item.name" loading="lazy" />
            <button
              type="button"
              class="media-item__remove"
              :aria-label="`Supprimer ${item.name}`"
              :disabled="busy === item.key"
              @click="remove(item)"
            >
              <AppIcon name="x" size="sm" />
            </button>
          </div>
          <input
            v-model="item.name"
            type="text"
            maxlength="120"
            class="media-item__name"
            aria-label="Nom de l'image"
            @change="rename(item)"
            @keydown.enter.prevent="$event.target.blur()"
          />
        </div>
        <button type="button" class="media-add" :disabled="busy === 'add'" @click="pick('gallery')">
          <span v-if="busy === 'add'" class="spinner spinner--dark"></span>
          <AppIcon v-else name="plus" />
          <span>Ajouter une image</span>
        </button>
      </div>
      <p v-if="error" class="alert alert--error" style="margin-top: var(--space-2)">{{ error }}</p>
    </div>

    <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp" class="media-file" @change="onFile" />

    <ImageCropper
      v-if="cropping"
      :file="cropping.file"
      :title="cropConfig.title"
      :aspects="cropConfig.aspects"
      :output-width="cropConfig.width"
      :output-type="cropConfig.type"
      :round="cropConfig.round"
      @cancel="cropping = null"
      @cropped="onCropped"
    />

    <!-- Nom obligatoire pour toute image de galerie -->
    <Modal v-if="naming" title="Nommer l'image" @close="cancelNaming">
      <img :src="naming.preview" alt="" class="naming-preview" />
      <div class="field">
        <label>Nom de l'image</label>
        <input
          ref="nameInput"
          v-model="naming.name"
          type="text"
          maxlength="120"
          placeholder="ex: Salle d'attente, Chambre double, Entrée principale"
          @keydown.enter.prevent="confirmNaming"
        />
      </div>
      <template #footer>
        <button class="btn btn--ghost" type="button" @click="cancelNaming">Annuler</button>
        <button class="btn btn--primary" type="button" :disabled="!naming.name.trim()" @click="confirmNaming">Ajouter</button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
/**
 * Gère couverture, photo de profil et galerie d'une clinique.
 * - Mode « direct » (prop `clinic`) : chaque action est envoyée immédiatement à l'API.
 * - Mode « brouillon » (pas de `clinic`) : les images recadrées sont gardées dans `modelValue`
 *   et envoyées par le parent une fois la clinique créée (voir uploadDraftMedia).
 */
import { ref, reactive, computed, nextTick, onMounted, onBeforeUnmount } from 'vue';
import AppIcon from './AppIcon.vue';
import Modal from './Modal.vue';
import ImageCropper from './ImageCropper.vue';
import * as clinicService from '../services/clinic.service';
import { assetUrl } from '../utils/media';

const props = defineProps({
  clinic: { type: Object, default: null },
  modelValue: { type: Object, default: () => ({ logo: null, cover: null, gallery: [] }) },
});
const emit = defineEmits(['update:modelValue', 'clinic-updated']);

const direct = computed(() => !!props.clinic);
const fileInput = ref(null);
const nameInput = ref(null);
const target = ref(null);
const cropping = ref(null);
const naming = ref(null);
const busy = ref('');
const error = ref('');
const remoteGallery = ref([]);
const previews = new Map(); // File -> blob URL
let keySeq = 0;

const CROPS = {
  logo: { title: 'Recadrer la photo de profil', aspects: [{ label: '1:1', ratio: 1 }], width: 512, type: 'image/png', round: false },
  cover: { title: 'Recadrer la couverture', aspects: [{ label: '16:7', ratio: 16 / 7 }], width: 1600, type: 'image/jpeg', round: false },
  gallery: {
    title: 'Recadrer l’image',
    aspects: [
      { label: '4:3', ratio: 4 / 3 },
      { label: '16:9', ratio: 16 / 9 },
      { label: '1:1', ratio: 1 },
    ],
    width: 1280,
    type: 'image/jpeg',
    round: false,
  },
};
const cropConfig = computed(() => CROPS[target.value] || CROPS.gallery);

const previewOf = (file) => {
  if (!previews.has(file)) previews.set(file, URL.createObjectURL(file));
  return previews.get(file);
};

const coverSrc = computed(() =>
  direct.value ? assetUrl(props.clinic.coverUrl) : props.modelValue.cover ? previewOf(props.modelValue.cover) : ''
);
const logoSrc = computed(() =>
  direct.value ? assetUrl(props.clinic.logoUrl) : props.modelValue.logo ? previewOf(props.modelValue.logo) : ''
);

// Éléments affichés dans la grille, quel que soit le mode.
const draftItems = reactive(new Map());
const items = computed(() => {
  if (direct.value) {
    return remoteGallery.value.map((img) => reactive({ key: img.id, id: img.id, name: img.name, src: assetUrl(img.imageUrl), saved: img.name }));
  }
  return props.modelValue.gallery.map((g) => {
    if (!draftItems.has(g.key)) draftItems.set(g.key, reactive({ key: g.key, name: g.name, src: previewOf(g.file) }));
    return draftItems.get(g.key);
  });
});

const pick = (kind) => {
  target.value = kind;
  error.value = '';
  fileInput.value.click();
};

const onFile = (e) => {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  if (file.size > 25 * 1024 * 1024) {
    error.value = 'Image trop volumineuse (25 Mo maximum avant recadrage).';
    return;
  }
  cropping.value = { file };
};

const setDraft = (patch) => emit('update:modelValue', { ...props.modelValue, ...patch });

const onCropped = async (file) => {
  cropping.value = null;
  const kind = target.value;
  if (kind === 'gallery') {
    naming.value = { file, preview: URL.createObjectURL(file), name: '' };
    await nextTick();
    nameInput.value?.focus();
    return;
  }
  if (!direct.value) {
    setDraft({ [kind]: file });
    return;
  }
  busy.value = kind;
  try {
    const updated =
      kind === 'logo'
        ? await clinicService.uploadClinicLogo(props.clinic.id, file)
        : await clinicService.uploadClinicCover(props.clinic.id, file);
    emit('clinic-updated', { logoUrl: updated.logoUrl, coverUrl: updated.coverUrl });
  } catch (err) {
    error.value = err.response?.data?.message || 'Impossible d’envoyer cette image.';
  } finally {
    busy.value = '';
  }
};

const cancelNaming = () => {
  if (naming.value) URL.revokeObjectURL(naming.value.preview);
  naming.value = null;
};

const confirmNaming = async () => {
  const name = naming.value?.name.trim();
  if (!name) return;
  const { file } = naming.value;
  cancelNaming();
  if (!direct.value) {
    setDraft({ gallery: [...props.modelValue.gallery, { key: `d${++keySeq}`, name, file }] });
    return;
  }
  busy.value = 'add';
  try {
    const image = await clinicService.addGalleryImage(props.clinic.id, file, name);
    remoteGallery.value = [...remoteGallery.value, image];
  } catch (err) {
    error.value = err.response?.data?.message || 'Impossible d’ajouter cette image.';
  } finally {
    busy.value = '';
  }
};

const rename = async (item) => {
  const name = item.name.trim();
  if (!direct.value) {
    if (!name) item.name = props.modelValue.gallery.find((g) => g.key === item.key)?.name || '';
    else setDraft({ gallery: props.modelValue.gallery.map((g) => (g.key === item.key ? { ...g, name } : g)) });
    return;
  }
  if (!name) {
    item.name = item.saved;
    return;
  }
  try {
    const image = await clinicService.renameGalleryImage(props.clinic.id, item.id, name);
    remoteGallery.value = remoteGallery.value.map((g) => (g.id === item.id ? image : g));
  } catch (err) {
    item.name = item.saved;
    error.value = err.response?.data?.message || 'Impossible de renommer cette image.';
  }
};

const remove = async (item) => {
  if (!direct.value) {
    setDraft({ gallery: props.modelValue.gallery.filter((g) => g.key !== item.key) });
    draftItems.delete(item.key);
    return;
  }
  busy.value = item.key;
  try {
    await clinicService.deleteGalleryImage(props.clinic.id, item.id);
    remoteGallery.value = remoteGallery.value.filter((g) => g.id !== item.id);
  } catch (err) {
    error.value = err.response?.data?.message || 'Impossible de supprimer cette image.';
  } finally {
    busy.value = '';
  }
};

onMounted(async () => {
  if (!direct.value) return;
  try {
    remoteGallery.value = await clinicService.getClinicGallery(props.clinic.id);
  } catch (err) {
    error.value = err.response?.data?.message || 'Impossible de charger la galerie.';
  }
});
onBeforeUnmount(() => {
  previews.forEach((url) => URL.revokeObjectURL(url));
  if (naming.value) URL.revokeObjectURL(naming.value.preview);
});
</script>

<style scoped>
.media-file {
  display: none;
}
.media-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 7;
  border-radius: var(--radius-lg);
  border: 1px dashed var(--color-border-strong);
  background: var(--color-primary-soft);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.media-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.media-cover__btn {
  position: absolute;
  right: var(--space-2);
  bottom: var(--space-2);
  background: var(--color-surface);
}
.media-logo {
  position: relative;
  width: 88px;
  height: 88px;
  padding: 0;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-primary-soft);
  color: var(--color-primary-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.media-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: calc(var(--radius-lg) - 2px);
}
.media-logo__badge {
  position: absolute;
  right: -6px;
  bottom: -6px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--color-surface);
}
.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--space-3);
}
.media-item__img {
  position: relative;
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-primary-soft);
}
.media-item__img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.media-item__remove {
  position: absolute;
  top: var(--space-1);
  right: var(--space-1);
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: rgba(10, 14, 26, 0.65);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.media-item__name {
  margin-top: var(--space-2);
  width: 100%;
  font-size: 0.85rem;
}
.media-add {
  aspect-ratio: 4 / 3;
  border: 2px dashed var(--color-border-strong);
  border-radius: var(--radius-lg);
  background: transparent;
  color: var(--color-primary-dark);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
}
.media-add:hover {
  background: var(--color-primary-soft);
}
.naming-preview {
  display: block;
  width: 100%;
  max-height: 40vh;
  object-fit: contain;
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-4);
  background: var(--color-primary-soft);
}
@media (max-width: 640px) {
  .media-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-2);
  }
}
</style>
