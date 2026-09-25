<template>
  <Modal :title="clinic.name" @close="$emit('close')">
    <Avatar
      v-if="clinic.logoUrl"
      size="lg"
      shape="square"
      :photo-url="clinic.logoUrl"
      :label="clinic.name"
      style="margin-bottom: var(--space-4)"
    />
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
      <label>Localisation</label>
      <LocationPicker :model-value="{ latitude: clinic.latitude, longitude: clinic.longitude }" readonly />
    </div>
  </Modal>
</template>

<script setup>
import Modal from './Modal.vue';
import LocationPicker from './LocationPicker.vue';
import Avatar from './Avatar.vue';
import { doctorLabel, initialsOf } from '../utils/format';

defineProps({ clinic: { type: Object, required: true } });
defineEmits(['close']);
</script>

<style scoped>
.clinic-doctor-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}
</style>
