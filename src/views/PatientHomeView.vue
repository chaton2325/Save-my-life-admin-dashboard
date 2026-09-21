<template>
  <div class="page">
    <div class="dash-grid">
      <section class="tile tile--brand hero span-8">
        <p class="hero__date">{{ today }}</p>
        <div class="identity">
          <span class="avatar avatar--lg" aria-hidden="true">{{ initials }}</span>
          <div>
            <h1>Bonjour, {{ authStore.user?.firstName }}</h1>
            <p class="identity__meta">
              <span v-if="authStore.user?.phoneNumber">{{ authStore.user.phoneNumber }}</span>
              <span class="badge badge--completed">Numéro vérifié</span>
            </p>
          </div>
        </div>
      </section>

      <RouterLink to="/urgence" class="tile tile--sos tile--link sos-tile span-4">
        <span class="sos-tile__icon"><AppIcon name="alertTriangle" size="lg" /></span>
        <span class="sos-tile__text">
          <span class="sos-tile__title">URGENCE</span>
          <span class="sos-tile__desc">Signaler une urgence médicale</span>
        </span>
      </RouterLink>
    </div>

    <div class="dash-grid">
      <RouterLink
        v-for="item in counters"
        :key="item.to"
        :to="item.to"
        class="tile tile--link kpi span-3"
        :class="{ 'tile--highlight': item.highlight && item.value > 0 }"
      >
        <div class="kpi__head">
          <span class="kpi__label">{{ item.label }}</span>
          <span class="kpi__icon"><AppIcon :name="item.icon" /></span>
        </div>
        <p class="kpi__value">{{ item.value === null ? '–' : item.value }}</p>
      </RouterLink>
    </div>

    <h2 class="section-title">Besoin d'un professionnel de santé ?</h2>
    <div class="quick-link-grid">
      <RouterLink to="/prendre-rendez-vous" class="quick-link-card">
        <span class="quick-link-card__icon"><AppIcon name="search" /></span>
        <span>
          <span class="quick-link-card__label">Je sais quel médecin consulter</span>
          <span class="quick-link-card__desc">Rechercher un médecin par nom ou spécialité</span>
        </span>
      </RouterLink>
      <RouterLink to="/orientation" class="quick-link-card">
        <span class="quick-link-card__icon"><AppIcon name="helpCircle" /></span>
        <span>
          <span class="quick-link-card__label">Je ne sais pas quel spécialiste consulter</span>
          <span class="quick-link-card__desc">Décrivez votre besoin, nous vous orientons</span>
        </span>
      </RouterLink>
    </div>

    <h2 class="section-title">Mon profil</h2>
    <div class="dash-grid">
      <section class="tile span-4">
        <div class="tile__head">
          <h2 class="tile__title">Profil complété</h2>
        </div>
        <GaugeChart :value="completion" :label="`${filledCount} information(s) sur ${totalCount}`" />
      </section>

      <details class="disclosure span-8">
        <summary class="disclosure__summary">
          <span class="quick-link-card__icon"><AppIcon name="user" /></span>
          <span class="disclosure__text">
            <span class="disclosure__title">Compléter mes informations</span>
            <span class="disclosure__hint">{{ profileHint }}</span>
          </span>
          <AppIcon name="chevronRight" class="disclosure__chevron" />
        </summary>

        <div class="disclosure__body">
          <div class="form-grid">
            <div class="field">
              <label>Email</label>
              <input v-model="form.email" type="email" placeholder="vous@exemple.com" />
            </div>
            <div class="field">
              <label>Date de naissance</label>
              <input v-model="form.birthDate" type="date" />
            </div>
            <div class="field">
              <label>Genre</label>
              <select v-model="form.gender">
                <option value="">Non précisé</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div class="field">
              <label>Groupe sanguin</label>
              <input v-model="form.bloodType" type="text" placeholder="ex: O+" />
            </div>
          </div>
          <div class="field">
            <label>Adresse</label>
            <input v-model="form.address" type="text" />
          </div>
          <div class="form-grid">
            <div class="field">
              <label>Entreprise</label>
              <input v-model="form.employer" type="text" placeholder="Votre employeur" />
            </div>
            <div class="field">
              <label>Assurance</label>
              <input v-model="form.insuranceProvider" type="text" placeholder="ex: CNPS, mutuelle..." />
            </div>
          </div>
          <div class="form-grid">
            <div class="field">
              <label>Contact d'urgence — nom</label>
              <input v-model="form.emergencyContactName" type="text" />
            </div>
            <div class="field">
              <label>Contact d'urgence — téléphone</label>
              <input v-model="form.emergencyContactPhone" type="tel" />
            </div>
          </div>

          <p v-if="successMessage" class="alert alert--success">{{ successMessage }}</p>
          <p v-if="errorMessage" class="alert alert--error">{{ errorMessage }}</p>

          <button class="btn btn--primary btn--block" :disabled="loading" @click="handleSubmit">
            <span v-if="loading" class="spinner"></span>
            {{ loading ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../store/auth.store';
import * as userService from '../services/user.service';
import * as appointmentService from '../services/appointment.service';
import * as prescriptionService from '../services/prescription.service';
import * as notificationService from '../services/notification.service';
import * as messageService from '../services/message.service';
import { todayLabel } from '../utils/format';
import AppIcon from '../components/AppIcon.vue';
import GaugeChart from '../components/GaugeChart.vue';

const authStore = useAuthStore();
const loading = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

const form = ref({
  email: authStore.user?.email || '',
  birthDate: authStore.user?.birthDate || '',
  gender: authStore.user?.gender || '',
  address: authStore.user?.address || '',
  bloodType: authStore.user?.bloodType || '',
  employer: authStore.user?.employer || '',
  insuranceProvider: authStore.user?.insuranceProvider || '',
  emergencyContactName: authStore.user?.emergencyContactName || '',
  emergencyContactPhone: authStore.user?.emergencyContactPhone || '',
});

const initials = computed(() => {
  const first = authStore.user?.firstName?.[0] || '';
  const last = authStore.user?.lastName?.[0] || '';
  return (first + last).toUpperCase();
});

const today = todayLabel();

// Indique d'un coup d'œil ce qu'il reste à renseigner, sans ouvrir le formulaire.
const totalCount = computed(() => Object.keys(form.value).length);
const missingCount = computed(
  () => Object.values(form.value).filter((value) => !String(value || '').trim()).length
);
const filledCount = computed(() => totalCount.value - missingCount.value);
const completion = computed(() => Math.round((filledCount.value / totalCount.value) * 100));

// Compteurs de l'accueil : null tant que la valeur n'est pas connue (ou si elle échoue).
const counts = ref({ appointments: null, prescriptions: null, notifications: null, messages: null });
const counters = computed(() => [
  { to: '/rendez-vous', icon: 'calendar', label: 'Rendez-vous confirmés', value: counts.value.appointments },
  { to: '/ordonnances', icon: 'fileText', label: 'Ordonnances', value: counts.value.prescriptions },
  { to: '/notifications', icon: 'bell', label: 'Notifications non lues', value: counts.value.notifications, highlight: true },
  { to: '/messagerie', icon: 'messageCircle', label: 'Messages non lus', value: counts.value.messages, highlight: true },
]);

onMounted(async () => {
  const [appointments, prescriptions, notifications, messages] = await Promise.allSettled([
    appointmentService.getMyAppointments({ limit: 1, status: 'confirmed' }),
    prescriptionService.getMyPrescriptions({ limit: 1 }),
    notificationService.getMyNotifications({ limit: 1 }),
    messageService.getMyUnreadCount(),
  ]);
  counts.value = {
    appointments: appointments.status === 'fulfilled' ? appointments.value.pagination?.total ?? 0 : null,
    prescriptions: prescriptions.status === 'fulfilled' ? prescriptions.value.pagination?.total ?? 0 : null,
    notifications: notifications.status === 'fulfilled' ? notifications.value.unreadCount ?? 0 : null,
    messages: messages.status === 'fulfilled' ? messages.value ?? 0 : null,
  };
});

const profileHint = computed(() => {
  if (missingCount.value === 0) return 'Toutes vos informations sont renseignées';
  return `${missingCount.value} information(s) à renseigner — email, groupe sanguin, assurance...`;
});

const handleSubmit = async () => {
  loading.value = true;
  successMessage.value = '';
  errorMessage.value = '';
  try {
    const payload = Object.fromEntries(
      Object.entries(form.value).map(([key, value]) => [key, value === '' ? null : value])
    );
    const user = await userService.updateMe(payload);
    authStore.setSession(user, authStore.token);
    successMessage.value = 'Informations mises à jour.';
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Impossible de mettre à jour vos informations.';
  } finally {
    loading.value = false;
  }
};
</script>
