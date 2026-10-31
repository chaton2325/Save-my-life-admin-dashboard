<template>
  <Modal :title="clinic.name" @close="$emit('close')">
    <div class="clinic-hero" :class="{ 'clinic-hero--no-cover': !full.coverUrl }">
      <img v-if="full.coverUrl" class="clinic-hero__cover" :src="assetUrl(full.coverUrl)" :alt="`Couverture — ${clinic.name}`" />
      <Avatar
        v-if="full.logoUrl"
        class="clinic-hero__logo"
        size="lg"
        shape="square"
        :photo-url="full.logoUrl"
        :label="clinic.name"
      />
    </div>
    <dl class="profile-list">
      <div class="profile-row">
        <dt>Statut</dt>
        <dd>
          <span class="badge" :class="clinic.isActive ? 'badge--completed' : 'badge--cancelled'">
            {{ clinic.isActive ? 'Active' : 'Désactivée' }}
          </span>
        </dd>
      </div>
      <div class="profile-row">
        <dt>Adresse</dt>
        <dd>{{ clinic.address }}<template v-if="clinic.city"> — {{ clinic.city }}</template></dd>
      </div>
      <div class="profile-row" v-if="clinic.phoneNumbers?.length">
        <dt>Téléphone(s)</dt>
        <dd>{{ clinic.phoneNumbers.join(', ') }}</dd>
      </div>
      <div class="profile-row" v-if="clinic.openingHours">
        <dt>Horaires</dt>
        <dd>{{ clinic.openingHours }}</dd>
      </div>
      <div class="profile-row" v-if="clinic.services?.length">
        <dt>Services</dt>
        <dd>{{ clinic.services.join(', ') }}</dd>
      </div>
      <div class="profile-row" v-if="clinic.doctors?.length">
        <dt>Médecins</dt>
        <dd>
          <div v-for="doctor in clinic.doctors" :key="doctor.id" class="clinic-doctor-row">
            <Avatar size="sm" :photo-url="doctor.photoUrl" :label="doctorLabel(doctor)" :initials="initialsOf(doctor)" />
            <span>{{ doctorLabel(doctor) }} — {{ doctor.speciality || 'Médecine générale' }}</span>
          </div>
        </dd>
      </div>
    </dl>

    <div class="field" style="margin-top: var(--space-4)">
      <label>Galerie</label>
      <p v-if="loadingGallery" class="hint" style="margin: 0"><span class="spinner spinner--dark"></span> Chargement...</p>
      <ClinicGallery v-else :images="gallery" />
    </div>

    <div class="field" style="margin-top: var(--space-4)">
      <label>Localisation</label>
      <LocationPicker :model-value="{ latitude: clinic.latitude, longitude: clinic.longitude }" readonly />
    </div>
  </Modal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import Modal from './Modal.vue';
import LocationPicker from './LocationPicker.vue';
import Avatar from './Avatar.vue';
import ClinicGallery from './ClinicGallery.vue';
import { doctorLabel, initialsOf } from '../utils/format';
import { assetUrl } from '../utils/media';
import * as clinicService from '../services/clinic.service';

const props = defineProps({ clinic: { type: Object, required: true } });
defineEmits(['close']);

// La liste des cliniques ne contient pas la galerie : on la charge à l'ouverture.
const gallery = ref(props.clinic.gallery || []);
const loadingGallery = ref(!props.clinic.gallery);
const fetched = ref(null);
const full = computed(() => ({ ...props.clinic, ...(fetched.value || {}) }));

onMounted(async () => {
  try {
    const clinic = await clinicService.getClinic(props.clinic.id);
    fetched.value = clinic;
    gallery.value = clinic.gallery || [];
  } catch {
    // On garde ce que l'on a déjà ; la galerie s'affichera vide.
  } finally {
    loadingGallery.value = false;
  }
});
</script>

<style scoped>
.clinic-hero {
  position: relative;
  margin: 0 0 var(--space-4);
}
.clinic-hero__cover {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 7;
  object-fit: cover;
  border-radius: var(--radius-lg);
  background: var(--color-primary-soft);
}
.clinic-hero__logo {
  border: 3px solid var(--color-surface);
  background: var(--color-surface);
}
.clinic-hero:not(.clinic-hero--no-cover) .clinic-hero__logo {
  position: absolute;
  left: var(--space-4);
  bottom: calc(var(--space-5) * -1);
}
.clinic-hero:not(.clinic-hero--no-cover) {
  margin-bottom: calc(var(--space-5) + var(--space-4));
}

.clinic-doctor-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}
</style>
