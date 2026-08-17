<template>
  <div class="location-picker">
    <div ref="mapEl" class="location-picker__map"></div>
    <div class="form-grid" style="margin-top: var(--space-3)">
      <div class="field">
        <label>Latitude</label>
        <input :value="modelValue.latitude" type="number" step="0.000001" :readonly="readonly" @input="onLatInput" />
      </div>
      <div class="field">
        <label>Longitude</label>
        <input :value="modelValue.longitude" type="number" step="0.000001" :readonly="readonly" @input="onLngInput" />
      </div>
    </div>
    <button
      v-if="!readonly"
      type="button"
      class="btn btn--ghost btn--sm"
      :disabled="locating"
      @click="useCurrentPosition"
    >
      <span v-if="locating" class="spinner spinner--dark"></span>
      <AppIcon v-else name="mapPin" size="sm" />
      {{ locating ? 'Localisation...' : 'Utiliser ma position actuelle' }}
    </button>
    <p v-if="geoError" class="hint" style="color: var(--color-error)">{{ geoError }}</p>
    <p v-if="!readonly" class="hint">Cliquez sur la carte ou déplacez le repère pour ajuster la position.</p>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import AppIcon from './AppIcon.vue';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const props = defineProps({
  modelValue: { type: Object, required: true },
  readonly: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue']);

const DEFAULT_CENTER = [3.848, 11.502];
const mapEl = ref(null);
let map = null;
let marker = null;
const locating = ref(false);
const geoError = ref('');

const setPosition = (lat, lng, { silent } = {}) => {
  if (!silent) {
    emit('update:modelValue', { latitude: lat, longitude: lng });
  }
  if (marker) {
    marker.setLatLng([lat, lng]);
  } else if (map) {
    marker = L.marker([lat, lng], { draggable: !props.readonly }).addTo(map);
    if (!props.readonly) {
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        emit('update:modelValue', { latitude: pos.lat, longitude: pos.lng });
      });
    }
  }
  if (map) {
    map.setView([lat, lng], map.getZoom() < 10 ? 14 : map.getZoom());
  }
};

onMounted(() => {
  const hasValue = props.modelValue.latitude != null && props.modelValue.longitude != null;
  const center = hasValue ? [props.modelValue.latitude, props.modelValue.longitude] : DEFAULT_CENTER;
  map = L.map(mapEl.value).setView(center, hasValue ? 14 : 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map);

  if (hasValue) {
    setPosition(props.modelValue.latitude, props.modelValue.longitude, { silent: true });
  }

  if (!props.readonly) {
    map.on('click', (e) => setPosition(e.latlng.lat, e.latlng.lng));
  }
});

onBeforeUnmount(() => {
  if (map) map.remove();
});

watch(
  () => [props.modelValue.latitude, props.modelValue.longitude],
  ([lat, lng]) => {
    if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) return;
    if (marker) {
      const current = marker.getLatLng();
      if (Math.abs(current.lat - lat) < 1e-9 && Math.abs(current.lng - lng) < 1e-9) return;
    }
    setPosition(lat, lng, { silent: true });
  }
);

const onLatInput = (e) => {
  const lat = parseFloat(e.target.value);
  if (!Number.isNaN(lat)) emit('update:modelValue', { latitude: lat, longitude: props.modelValue.longitude });
};
const onLngInput = (e) => {
  const lng = parseFloat(e.target.value);
  if (!Number.isNaN(lng)) emit('update:modelValue', { latitude: props.modelValue.latitude, longitude: lng });
};

const useCurrentPosition = () => {
  if (!navigator.geolocation) {
    geoError.value = "La géolocalisation n'est pas disponible sur cet appareil.";
    return;
  }
  locating.value = true;
  geoError.value = '';
  navigator.geolocation.getCurrentPosition(
    (position) => {
      locating.value = false;
      emit('update:modelValue', { latitude: position.coords.latitude, longitude: position.coords.longitude });
    },
    () => {
      locating.value = false;
      geoError.value =
        'Impossible de récupérer votre position. Autorisez la géolocalisation ou saisissez les coordonnées manuellement.';
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
};
</script>

<style scoped>
.location-picker__map {
  height: 260px;
  border-radius: var(--radius);
  overflow: hidden;
  border: 1px solid var(--color-border);
}
@media (max-width: 640px) {
  .location-picker__map {
    height: 200px;
  }
}
</style>
