<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Bienvenue, {{ authStore.user?.firstName }}</h1>
        <p class="page-subtitle">Votre espace personnel Save My Life</p>
      </div>
    </div>

    <div class="card card--narrow">
      <dl class="profile-list">
        <div class="profile-row">
          <dt>Nom complet</dt>
          <dd>{{ authStore.user?.firstName }} {{ authStore.user?.lastName }}</dd>
        </div>
        <div class="profile-row">
          <dt>Téléphone</dt>
          <dd>{{ authStore.user?.phoneNumber }}</dd>
        </div>
        <div class="profile-row">
          <dt>Statut</dt>
          <dd>Numéro vérifié</dd>
        </div>
      </dl>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '../store/auth.store';

const authStore = useAuthStore();
</script>
