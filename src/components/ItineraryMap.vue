<template>
  <div ref="mapEl" class="itinerary-map"></div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, watch, ref } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const props = defineProps({
  origin: { type: Object, default: null }, // { latitude, longitude }
  destination: { type: Object, required: true }, // { latitude, longitude, label }
});

const mapEl = ref(null);
let map = null;
let originMarker = null;
let destinationMarker = null;
let line = null;

const render = () => {
  if (!map) return;
  if (destinationMarker) {
    destinationMarker.remove();
    destinationMarker = null;
  }
  if (originMarker) {
    originMarker.remove();
    originMarker = null;
  }
  if (line) {
    line.remove();
    line = null;
  }

  destinationMarker = L.marker([props.destination.latitude, props.destination.longitude]).addTo(map);
  if (props.destination.label) destinationMarker.bindPopup(props.destination.label).openPopup();

  if (props.origin) {
    originMarker = L.circleMarker([props.origin.latitude, props.origin.longitude], {
      radius: 8,
      color: '#1d4ed8',
      fillColor: '#3b82f6',
      fillOpacity: 0.9,
      weight: 2,
    })
      .addTo(map)
      .bindPopup('Votre position');

    line = L.polyline(
      [
        [props.origin.latitude, props.origin.longitude],
        [props.destination.latitude, props.destination.longitude],
      ],
      { color: '#1d4ed8', dashArray: '6 8', weight: 3 }
    ).addTo(map);

    map.fitBounds(line.getBounds(), { padding: [30, 30] });
  } else {
    map.setView([props.destination.latitude, props.destination.longitude], 14);
  }
};

onMounted(() => {
  map = L.map(mapEl.value);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map);
  render();
});

onBeforeUnmount(() => {
  if (map) map.remove();
});

watch(() => [props.origin, props.destination], render, { deep: true });
</script>

<style scoped>
.itinerary-map {
  height: 280px;
  border-radius: var(--radius);
  overflow: hidden;
  border: 1px solid var(--color-border);
}
</style>
