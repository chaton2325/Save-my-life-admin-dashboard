<template>
  <Modal :title="clinic.name" @close="$emit('close')">
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
          <div v-for="doctor in clinic.doctors" :key="doctor.id">
            Dr {{ doctor.firstName }} {{ doctor.lastName }} — {{ doctor.speciality || 'Médecine générale' }}
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

defineProps({ clinic: { type: Object, required: true } });
defineEmits(['close']);
</script>
