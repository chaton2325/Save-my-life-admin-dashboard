<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Alerte SOS médicale</h1>
        <p class="page-subtitle" v-if="step !== 'result'">Étape {{ stepIndex + 1 }} / {{ steps.length }}</p>
      </div>
    </div>

    <!-- Étape 1 : localisation -->
    <div v-if="step === 'localisation'" class="card card--narrow">
      <h2 class="section-title" style="margin-top: 0">Votre position</h2>
      <p>Elle nous aide à vous orienter vers les structures d'urgence les plus proches.</p>

      <div class="field-hint" v-if="!position">
        <AppIcon name="mapPin" size="sm" />
        <span>Autorisez la géolocalisation pour une orientation plus précise.</span>
      </div>
      <button
        v-if="!position"
        type="button"
        class="btn btn--ghost"
        :disabled="locating"
        @click="requestLocation"
      >
        <span v-if="locating" class="spinner spinner--dark"></span>
        <AppIcon v-else name="mapPin" size="sm" />
        {{ locating ? 'Localisation en cours...' : 'Autoriser la géolocalisation' }}
      </button>
      <p v-else class="alert alert--success">Position obtenue.</p>
      <p v-if="geoError" class="alert alert--warning">{{ geoError }}</p>

      <button class="btn btn--danger btn--block" style="margin-top: var(--space-4)" @click="next">
        {{ position ? 'Continuer' : 'Continuer sans localisation' }}
      </button>
    </div>

    <!-- Étape 2 : type d'urgence -->
    <div v-else-if="step === 'type'" class="card card--narrow">
      <h2 class="section-title" style="margin-top: 0">Quel type d'urgence ?</h2>
      <p v-if="loadingTypes" class="state-message"><span class="spinner spinner--dark"></span> Chargement...</p>
      <p v-else-if="typesError" class="alert alert--error">{{ typesError }}</p>
      <template v-else>
        <div class="sos-type-grid">
          <button
            v-for="t in sosTypes"
            :key="t.value"
            type="button"
            class="sos-type-btn"
            :class="{ 'is-selected': type === t.value }"
            @click="type = t.value"
          >
            <AppIcon :name="t.icon" />
            {{ t.label }}
          </button>
        </div>

        <div class="field" style="margin-top: var(--space-4)">
          <label>Précisions (optionnel)</label>
          <textarea v-model="description" rows="3" placeholder="Décrivez brièvement la situation"></textarea>
        </div>

        <button class="btn btn--danger btn--block" style="margin-top: var(--space-4)" :disabled="!type" @click="next">
          Continuer
        </button>
      </template>
    </div>

    <!-- Étape 3 : personnes à prévenir -->
    <div v-else-if="step === 'contact'" class="card card--narrow">
      <h2 class="section-title" style="margin-top: 0">Personne à prévenir</h2>

      <template v-if="authStore.user?.emergencyContactPhone">
        <p><strong>{{ authStore.user.emergencyContactName || 'Contact' }}</strong> — {{ authStore.user.emergencyContactPhone }}</p>
        <p class="hint">Cette personne pourra être appelée depuis l'écran suivant.</p>
      </template>
      <template v-else>
        <p class="alert alert--warning">Aucun contact d'urgence enregistré. Vous pouvez en ajouter un maintenant, ou continuer sans.</p>
        <div class="form-grid">
          <div class="field">
            <label>Nom</label>
            <input v-model="contactName" type="text" />
          </div>
          <div class="field">
            <label>Téléphone</label>
            <input v-model="contactPhone" type="tel" />
          </div>
        </div>
        <button v-if="contactName && contactPhone" class="btn btn--ghost btn--block" :disabled="savingContact" @click="saveContact">
          <span v-if="savingContact" class="spinner spinner--dark"></span>
          Enregistrer ce contact
        </button>
      </template>

      <button class="btn btn--danger btn--block" style="margin-top: var(--space-4)" @click="next">Continuer</button>
    </div>

    <!-- Étape 4 : récapitulatif + envoi -->
    <div v-else-if="step === 'recap'" class="card card--narrow">
      <h2 class="section-title" style="margin-top: 0">Confirmer l'alerte</h2>
      <ul class="sos-recap">
        <li><strong>Type :</strong> {{ typeLabel }}</li>
        <li><strong>Position :</strong> {{ position ? 'transmise' : 'non transmise' }}</li>
        <li><strong>Contact d'urgence :</strong> {{ authStore.user?.emergencyContactPhone || 'aucun' }}</li>
      </ul>
      <p v-if="submitError" class="alert alert--error">{{ submitError }}</p>
      <button class="btn btn--danger btn--block" :disabled="submitting" @click="submit">
        <span v-if="submitting" class="spinner"></span>
        <AppIcon v-else name="alertTriangle" />
        {{ submitting ? 'Envoi en cours...' : "Envoyer l'alerte SOS" }}
      </button>
    </div>

    <!-- Résultat : orientation + suivi -->
    <template v-else-if="step === 'result'">
      <p class="alert alert--success">
        Alerte envoyée — l'équipe Save My Life a été prévenue et suit votre situation.
      </p>

      <div v-if="authStore.user?.emergencyContactPhone" class="card card--narrow">
        <h2 class="section-title" style="margin-top: 0">Prévenir votre contact</h2>
        <a class="btn btn--primary btn--block" :href="telHref(authStore.user.emergencyContactPhone)">
          <AppIcon name="phone" size="sm" />
          Appeler {{ authStore.user.emergencyContactName || 'mon contact' }}
        </a>
      </div>

      <h2 class="section-title">Structures d'urgence à proximité</h2>
      <div class="item-list">
        <div v-for="entry in emergencyClinics" :key="entry.clinic.id" class="card">
          <div class="item-row__main" style="margin-bottom: var(--space-3)">
            <span class="item-row__title">{{ entry.clinic.name }}</span>
            <span class="item-row__meta">
              {{ entry.clinic.address }}<template v-if="entry.clinic.city"> — {{ entry.clinic.city }}</template>
              <template v-if="entry.distanceKm != null"> · {{ entry.distanceKm.toFixed(1) }} km</template>
            </span>
          </div>
          <a
            v-if="entry.clinic.phoneNumbers?.[0]"
            class="btn btn--ghost btn--sm"
            :href="telHref(entry.clinic.phoneNumbers[0])"
          >
            <AppIcon name="phone" size="sm" />
            {{ entry.clinic.phoneNumbers[0] }}
          </a>
        </div>
        <p v-if="emergencyClinics.length === 0" class="empty">
          Aucune structure d'urgence référencée à proximité pour le moment.
        </p>
      </div>

      <h2 class="section-title">Suivi</h2>
      <div class="card card--narrow">
        <p>
          Statut actuel :
          <span class="badge" :class="SOS_STATUS_BADGE[sosRequest.status]">{{ SOS_STATUS_LABELS[sosRequest.status] }}</span>
        </p>
        <RouterLink to="/mes-urgences" class="btn btn--ghost btn--block">Voir l'historique de mes alertes</RouterLink>
        <RouterLink to="/accueil" class="btn btn--primary btn--block" style="margin-top: var(--space-3)">Retour à l'accueil</RouterLink>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../store/auth.store';
import * as sosService from '../services/sos.service';
import * as sosTypeService from '../services/sosType.service';
import * as userService from '../services/user.service';
import AppIcon from '../components/AppIcon.vue';
import { SOS_STATUS_LABELS, SOS_STATUS_BADGE } from '../services/sos.service';

const authStore = useAuthStore();

const steps = ['localisation', 'type', 'contact', 'recap', 'result'];
const step = ref('localisation');
const stepIndex = computed(() => steps.indexOf(step.value));

const position = ref(null);
const locating = ref(false);
const geoError = ref('');

const sosTypes = ref([]);
const loadingTypes = ref(false);
const typesError = ref('');

const type = ref('');
const description = ref('');

const contactName = ref('');
const contactPhone = ref('');
const savingContact = ref(false);

const submitting = ref(false);
const submitError = ref('');
const sosRequest = ref(null);
const emergencyClinics = ref([]);

const typeLabel = computed(() => sosTypes.value.find((t) => t.value === type.value)?.label || '');

const telHref = (phone) => `tel:${phone.replace(/\s+/g, '')}`;

const fetchTypes = async () => {
  loadingTypes.value = true;
  typesError.value = '';
  try {
    sosTypes.value = await sosTypeService.getSosTypes();
  } catch (err) {
    typesError.value = err.response?.data?.message || "Impossible de charger les types d'urgence.";
  } finally {
    loadingTypes.value = false;
  }
};

onMounted(fetchTypes);

const requestLocation = () => {
  if (!navigator.geolocation) {
    geoError.value = "La géolocalisation n'est pas disponible sur cet appareil.";
    return;
  }
  locating.value = true;
  geoError.value = '';
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      locating.value = false;
      position.value = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    },
    () => {
      locating.value = false;
      geoError.value = 'Position indisponible — vous pouvez continuer sans.';
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
};

const next = () => {
  const currentIndex = steps.indexOf(step.value);
  step.value = steps[currentIndex + 1];
};

const saveContact = async () => {
  savingContact.value = true;
  try {
    const user = await userService.updateMe({
      emergencyContactName: contactName.value,
      emergencyContactPhone: contactPhone.value,
    });
    authStore.setSession(user, authStore.token);
  } finally {
    savingContact.value = false;
  }
};

const submit = async () => {
  submitting.value = true;
  submitError.value = '';
  try {
    const result = await sosService.createSos({
      type: type.value,
      description: description.value.trim() || undefined,
      latitude: position.value?.latitude,
      longitude: position.value?.longitude,
    });
    sosRequest.value = result.sosRequest;
    emergencyClinics.value = result.emergencyClinics;
    step.value = 'result';
  } catch (err) {
    submitError.value = err.response?.data?.message || "Impossible d'envoyer l'alerte. Réessayez.";
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.sos-type-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}
.sos-type-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-2);
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
  cursor: pointer;
}
.sos-type-btn.is-selected {
  border-color: var(--color-error);
  background: var(--color-error-bg);
  color: var(--color-error);
}
.sos-recap {
  list-style: none;
  padding: 0;
  margin: 0 0 var(--space-4);
}
.sos-recap li {
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--color-border);
}
</style>
