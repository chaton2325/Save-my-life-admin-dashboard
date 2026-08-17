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

    <h2 class="section-title">Comptes rendus de consultation</h2>
    <div class="card">
      <p v-if="loadingHistory" class="state-message"><span class="spinner spinner--dark"></span> Chargement...</p>
      <div v-else class="item-list">
        <div v-for="report in consultations" :key="report.id" class="item-row" style="align-items: flex-start">
          <div class="item-row__main">
            <span class="item-row__title">{{ formatDate(report.createdAt) }} — Dr {{ report.doctor?.firstName }} {{ report.doctor?.lastName }}</span>
            <span v-if="report.diagnosis" class="item-row__meta">Diagnostic : {{ report.diagnosis }}</span>
            <span class="item-row__meta">{{ report.notes }}</span>
          </div>
        </div>
        <p v-if="consultations.length === 0" class="empty">Aucun compte rendu.</p>
      </div>
    </div>

    <h2 class="section-title">Ordonnances</h2>
    <div class="card">
      <p v-if="loadingPrescriptions" class="state-message"><span class="spinner spinner--dark"></span> Chargement...</p>
      <div v-else class="item-list">
        <div v-for="p in prescriptions" :key="p.id" class="item-row">
          <div class="item-row__main">
            <span class="item-row__title">{{ formatDate(p.issuedAt) }}</span>
            <span class="item-row__meta">{{ (p.medications || []).map((m) => m.name).join(', ') }}</span>
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
