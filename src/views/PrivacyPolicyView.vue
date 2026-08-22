<template>
  <div class="legal-screen">
    <div class="legal-doc">
      <RouterLink :to="backTarget" class="legal-back">
        <AppIcon name="arrowLeft" size="sm" />
        Retour
      </RouterLink>

      <header class="legal-header">
        <span class="avatar avatar--lg" aria-hidden="true">
          <AppIcon name="lock" />
        </span>
        <h1>Politique de confidentialité</h1>
        <p class="legal-subtitle">Save My Life Cameroon — dernière mise à jour : 22 août 2026</p>
      </header>

      <p>
        La confiance des patients repose sur la protection de leurs informations. Save My Life
        Cameroon s'engage à protéger les données personnelles de ses utilisateurs, à recueillir
        leur consentement avant tout partage d'information, à limiter l'accès à ces données aux
        seules personnes autorisées, et à respecter la réglementation camerounaise applicable en
        matière de protection des données. La confidentialité est un principe fondamental de
        notre activité.
      </p>

      <h2>1. Qui sommes-nous</h2>
      <p>
        Save My Life Cameroon est une plateforme qui facilite l'accès aux soins : mise en relation
        des patients avec des professionnels de santé et des cliniques partenaires, prise de
        rendez-vous, suivi du dossier médical et orientation vers le bon spécialiste. Cette
        politique décrit les données que nous traitons lorsque vous utilisez l'application, sur
        <strong>savemylife.mirlab.cloud</strong>.
      </p>

      <h2>2. Données que nous collectons</h2>
      <p>Selon votre profil (patient, médecin ou administrateur), nous traitons :</p>
      <ul>
        <li><strong>Identité et contact</strong> : nom, prénom, numéro de téléphone, email, date de naissance, genre, adresse.</li>
        <li><strong>Informations médicales de base</strong> : groupe sanguin, contact d'urgence, entreprise, assurance — renseignées volontairement dans votre profil.</li>
        <li><strong>Dossier de soins</strong> : rendez-vous, comptes rendus de consultation, ordonnances et prescriptions, disponibilités des médecins.</li>
        <li><strong>Données professionnelles</strong> (médecins) : spécialité, numéro d'ordre, clinique de rattachement.</li>
        <li><strong>Données de connexion</strong> : mot de passe (chiffré), historique de connexion et d'activité, notifications.</li>
      </ul>

      <h2>3. Pourquoi nous les utilisons</h2>
      <ul>
        <li>Vous mettre en relation avec un professionnel de santé et gérer vos rendez-vous ;</li>
        <li>Constituer et faire suivre votre dossier de soins (comptes rendus, ordonnances) ;</li>
        <li>Vous orienter vers la spécialité adaptée à votre besoin ;</li>
        <li>Vous envoyer des rappels et notifications liés à vos rendez-vous ;</li>
        <li>Assurer la sécurité de votre compte et améliorer le service.</li>
      </ul>

      <h2>4. Consentement et partage avec des tiers</h2>
      <p>
        Save My Life Cameroon recueille uniquement les informations nécessaires à l'accompagnement
        des patients et obtient le consentement du patient avant toute transmission d'information à
        un partenaire. Vos informations ne sont communiquées qu'aux professionnels de santé ou
        partenaires concernés par votre prise en charge, et uniquement lorsque cela est nécessaire,
        sauf obligation légale contraire. Nous ne vendons aucune donnée personnelle.
      </p>

      <h2>5. Sécurité</h2>
      <p>
        Nous limitons l'accès à vos données aux seules personnes autorisées et mettons en œuvre des
        mesures de sécurité adaptées pour les protéger contre tout accès non autorisé (connexion
        chiffrée, mots de passe chiffrés, contrôle des accès par rôle).
      </p>

      <h2>6. Confidentialité de nos équipes</h2>
      <p>
        L'ensemble des collaborateurs et partenaires de Save My Life Cameroon est tenu au respect
        de la confidentialité des informations auxquelles ils ont accès dans le cadre de leurs
        missions.
      </p>

      <h2>7. Vos droits</h2>
      <p>
        Vous pouvez à tout moment mettre à jour vos informations depuis votre profil dans
        l'application, ou nous contacter pour demander l'accès, la rectification ou la suppression
        de vos données.
      </p>

      <h2>8. Conservation des données</h2>
      <p>
        Vos données sont conservées le temps nécessaire à votre accompagnement et au bon
        fonctionnement de votre dossier de soins, tant que votre compte est actif.
      </p>

      <h2>9. Modifications de cette politique</h2>
      <p>
        Cette politique peut évoluer ; la date de mise à jour en haut de page indique la version en
        vigueur.
      </p>

      <h2>10. Nous contacter</h2>
      <p>
        Save My Life Cameroon<br />
        Yaoundé, Cameroun<br />
        Téléphone : +237 655 92 89 05 / +237 654 89 46 09<br />
        Email : <a href="mailto:eloundoulandry237@gmail.com">eloundoulandry237@gmail.com</a>
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '../store/auth.store';
import AppIcon from '../components/AppIcon.vue';

const authStore = useAuthStore();
const backTarget = computed(() => (authStore.isAuthenticated ? '/' : '/login'));
</script>

<style scoped>
.legal-screen {
  min-height: 100vh;
  background: var(--color-bg);
  padding: var(--space-6) var(--space-4) var(--space-8);
  display: flex;
  justify-content: center;
}
.legal-doc {
  width: 100%;
  max-width: 720px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-6);
  color: var(--color-text);
  line-height: 1.6;
}
.legal-back {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-text-muted);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: var(--space-5);
}
.legal-back:hover {
  color: var(--color-primary);
}
.legal-header {
  text-align: center;
  margin-bottom: var(--space-6);
}
.legal-header h1 {
  margin: var(--space-3) 0 var(--space-1);
  font-size: 1.4rem;
}
.legal-subtitle {
  color: var(--color-text-muted);
  font-size: 0.88rem;
  margin: 0;
}
.legal-doc h2 {
  font-size: 1.05rem;
  font-weight: 800;
  margin: var(--space-6) 0 var(--space-2);
}
.legal-doc p {
  margin: 0 0 var(--space-3);
}
.legal-doc ul {
  margin: 0 0 var(--space-3);
  padding-left: 1.25rem;
}
.legal-doc li {
  margin-bottom: var(--space-2);
}
.legal-doc a {
  color: var(--color-primary);
}
</style>
