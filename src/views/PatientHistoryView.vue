<template>
  <div class="page">
    <div class="page-header">
      <div>
        <RouterLink to="/mes-patients" class="page-back">
          <AppIcon name="arrowLeft" size="sm" />
          Mes patients
        </RouterLink>
        <h1>{{ patientName || 'Historique du patient' }}</h1>
        <p class="page-subtitle">Historique médical et ordonnances</p>
      </div>
    </div>

    <div class="dash-grid kpi-strip">
      <div class="tile tile--brand kpi span-6">
        <div class="kpi__head">
          <span class="kpi__label">Comptes rendus</span>
          <span class="kpi__icon"><AppIcon name="clipboard" /></span>
        </div>
        <div>
          <p class="kpi__value">{{ loadingHistory ? '–' : consultations.length }}</p>
          <p class="kpi__meta">consultations documentées</p>
        </div>
      </div>
      <div class="tile kpi span-6">
        <div class="kpi__head">
          <span class="kpi__label">Ordonnances</span>
          <span class="kpi__icon"><AppIcon name="fileText" /></span>
        </div>
        <div>
          <p class="kpi__value">{{ loadingPrescriptions ? '–' : prescriptions.length }}</p>
          <p class="kpi__meta">prescriptions émises</p>
        </div>
      </div>
    </div>

    <div class="card card--flush">
      <div class="card__toolbar">
        <h2 class="card__title">Comptes rendus de consultation <span class="count-chip">{{ consultations.length }}</span></h2>
      </div>
      <p v-if="loadingHistory" class="state-message"><span class="spinner spinner--dark"></span> Chargement...</p>
      <div v-else class="item-list">
        <div v-for="report in consultations" :key="report.id" class="item-row">
          <div class="date-chip date-chip--completed item-row__lead" aria-hidden="true">
            <span class="date-chip__day">{{ dateParts(report.createdAt).day }}</span>
            <span class="date-chip__month">{{ dateParts(report.createdAt).month }}</span>
            <span class="date-chip__time">{{ dateParts(report.createdAt).time }}</span>
          </div>
          <div class="item-row__main">
            <div class="item-row__heading">
              <span class="item-row__title">{{ report.doctor?.firstName }} {{ report.doctor?.lastName }}</span>
              <span v-if="report.diagnosis" class="chip">{{ report.diagnosis }}</span>
            </div>
            <span v-if="report.notes" class="item-row__meta">{{ report.notes }}</span>
          </div>
        </div>
        <p v-if="consultations.length === 0" class="empty">Aucun compte rendu.</p>
      </div>
    </div>

    <div class="card card--flush" style="margin-top: var(--space-4)">
      <div class="card__toolbar">
        <h2 class="card__title">Ordonnances <span class="count-chip">{{ prescriptions.length }}</span></h2>
      </div>
      <p v-if="loadingPrescriptions" class="state-message"><span class="spinner spinner--dark"></span> Chargement...</p>
      <div v-else class="item-list">
        <div v-for="p in prescriptions" :key="p.id" class="item-row">
          <span class="lead-icon item-row__lead"><AppIcon name="fileText" /></span>
          <div class="item-row__main">
            <div class="meta-list">
              <span class="meta-item"><AppIcon name="calendar" size="sm" />{{ formatDate(p.issuedAt) }}</span>
            </div>
            <div class="chips">
              <span v-for="(m, index) in p.medications || []" :key="index" class="chip">{{ m.name }}</span>
            </div>
          </div>
        </div>
        <p v-if="prescriptions.length === 0" class="empty">Aucune ordonnance.</p>
      </div>
    </div>

    <CreatePanel title="Nouvelle ordonnance" trigger-label="Nouvelle ordonnance" icon="fileText">
      <div v-for="(med, index) in medications" :key="index" class="form-grid" style="margin-bottom: var(--space-3)">
        <div class="field">
          <label>Médicament</label>
          <input v-model="med.name" type="text" placeholder="Nom du médicament" />
        </div>
        <div class="field">
          <label>Dosage</label>
          <input v-model="med.dosage" type="text" placeholder="ex: 500mg" />
        </div>
        <div class="field">
          <label>Fréquence</label>
          <input v-model="med.frequency" type="text" placeholder="ex: 3x/jour" />
        </div>
        <div class="field" style="display: flex; align-items: flex-end; gap: var(--space-2)">
          <div style="flex: 1">
            <label>Durée</label>
            <input v-model="med.duration" type="text" placeholder="ex: 5 jours" />
          </div>
          <button v-if="medications.length > 1" class="btn btn--danger-ghost btn--icon" @click="medications.splice(index, 1)">
            <AppIcon name="x" size="sm" />
          </button>
        </div>
      </div>
      <button class="btn btn--ghost btn--sm" style="margin-bottom: var(--space-4)" @click="addMedication">
        <AppIcon name="plus" size="sm" /> Ajouter un médicament
      </button>

      <div class="field">
        <label>Notes</label>
        <textarea v-model="notes" placeholder="Instructions générales..."></textarea>
      </div>

      <p v-if="prescError" class="alert alert--error">{{ prescError }}</p>
      <p v-if="prescSuccess" class="alert alert--success">{{ prescSuccess }}</p>
      <button class="btn btn--primary btn--block" :disabled="prescLoading" @click="submitPrescription">
        <span v-if="prescLoading" class="spinner"></span>
        {{ prescLoading ? 'Enregistrement...' : "Créer l'ordonnance" }}
      </button>
    </CreatePanel>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import * as consultationService from '../services/consultation.service';
import * as prescriptionService from '../services/prescription.service';
import AppIcon from '../components/AppIcon.vue';
import CreatePanel from '../components/CreatePanel.vue';
import { dateParts } from '../utils/format';

const route = useRoute();
const patientId = route.params.id;

const consultations = ref([]);
const prescriptions = ref([]);
const loadingHistory = ref(false);
const loadingPrescriptions = ref(false);

const medications = ref([{ name: '', dosage: '', frequency: '', duration: '' }]);
const notes = ref('');
const prescLoading = ref(false);
const prescError = ref('');
const prescSuccess = ref('');

const patientName = computed(() => {
  const from = consultations.value[0]?.patient || prescriptions.value[0]?.patient;
  return from ? `${from.firstName} ${from.lastName}` : '';
});

const formatDate = (value) => new Date(value).toLocaleDateString('fr-FR', { dateStyle: 'long' });

const fetchHistory = async () => {
  loadingHistory.value = true;
  try {
    const result = await consultationService.getPatientHistory(patientId, { limit: 50 });
    consultations.value = result.consultations;
  } finally {
    loadingHistory.value = false;
  }
};

const fetchPrescriptions = async () => {
  loadingPrescriptions.value = true;
  try {
    const result = await prescriptionService.getPatientPrescriptions(patientId, { limit: 50 });
    prescriptions.value = result.prescriptions;
  } finally {
    loadingPrescriptions.value = false;
  }
};

const addMedication = () => medications.value.push({ name: '', dosage: '', frequency: '', duration: '' });

const submitPrescription = async () => {
  prescLoading.value = true;
  prescError.value = '';
  prescSuccess.value = '';
  try {
    await prescriptionService.createPrescription({
      patientId,
      medications: medications.value.filter((m) => m.name.trim()),
      notes: notes.value,
    });
    prescSuccess.value = 'Ordonnance créée avec succès.';
    medications.value = [{ name: '', dosage: '', frequency: '', duration: '' }];
    notes.value = '';
    await fetchPrescriptions();
  } catch (err) {
    prescError.value = err.response?.data?.message || 'Impossible de créer cette ordonnance.';
  } finally {
    prescLoading.value = false;
  }
};

onMounted(() => {
  fetchHistory();
  fetchPrescriptions();
});
</script>
