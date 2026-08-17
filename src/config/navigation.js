/**
 * Navigation unique pour la sidebar (desktop) et la tab bar (mobile).
 *
 * Chaque entrée :
 *  - to / icon / label : destination et rendu
 *  - short             : libellé court affiché sous l'icône de la tab bar
 *  - tab               : présent dans la tab bar mobile
 *  - accent            : rendu en bouton d'action mis en avant dans la tab bar
 *  - badge             : 'notifications' pour afficher le compteur de non-lus
 *  - visible           : condition d'affichage (permissions)
 */

const PATIENT_NAV = [
  { to: '/accueil', icon: 'home', label: 'Accueil', short: 'Accueil', tab: true },
  { to: '/rendez-vous', icon: 'calendar', label: 'Mes rendez-vous', short: 'RDV', tab: true },
  {
    to: '/prendre-rendez-vous',
    icon: 'plus',
    label: 'Prendre rendez-vous',
    short: 'Réserver',
    tab: true,
    accent: true,
  },
  {
    to: '/notifications',
    icon: 'bell',
    label: 'Notifications',
    short: 'Alertes',
    tab: true,
    badge: 'notifications',
  },
  { to: '/ordonnances', icon: 'fileText', label: 'Mes ordonnances', short: 'Ordonnances' },
  { to: '/orientation', icon: 'helpCircle', label: 'Quel spécialiste consulter ?', short: 'Orientation' },
];

const DOCTOR_NAV = [
  { to: '/agenda', icon: 'calendar', label: 'Mon agenda', short: 'Agenda', tab: true },
  { to: '/demandes', icon: 'clipboard', label: 'Demandes de rendez-vous', short: 'Demandes', tab: true },
  { to: '/mes-patients', icon: 'users', label: 'Mes patients', short: 'Patients', tab: true },
  {
    to: '/notifications',
    icon: 'bell',
    label: 'Notifications',
    short: 'Alertes',
    tab: true,
    badge: 'notifications',
  },
  { to: '/mes-disponibilites', icon: 'clock', label: 'Mes disponibilités', short: 'Dispos' },
];

const ADMIN_NAV = [
  { to: '/tableau-de-bord', icon: 'home', label: 'Tableau de bord', short: 'Accueil', tab: true },
  { to: '/patients', icon: 'users', label: 'Patients', short: 'Patients', tab: true },
  { to: '/medecins', icon: 'userCheck', label: 'Médecins', short: 'Médecins', tab: true },
  { to: '/cliniques', icon: 'building', label: 'Cliniques', short: 'Cliniques', tab: true },
  {
    to: '/administrateurs',
    icon: 'userPlus',
    label: 'Administrateurs',
    short: 'Admins',
    visible: (auth) => auth.isSuperAdmin,
  },
  {
    to: '/conflits',
    icon: 'alertTriangle',
    label: 'Conflits de rendez-vous',
    short: 'Conflits',
    visible: (auth) => auth.isSuperAdmin || auth.isReadOnlyAdmin,
  },
  { to: '/statistiques', icon: 'activity', label: 'Statistiques', short: 'Stats' },
  {
    to: '/journaux',
    icon: 'fileText',
    label: "Journaux d'activité",
    short: 'Journaux',
    visible: (auth) => auth.isSuperAdmin || auth.isReadOnlyAdmin,
  },
  { to: '/parametres', icon: 'settings', label: 'Paramètres', short: 'Réglages' },
];

/** Nombre maximum d'onglets (hors bouton « Plus ») dans la tab bar. */
export const MAX_TABS = 4;

/** Liens toujours accessibles, regroupés dans le menu « Plus » / bas de sidebar. */
export const ACCOUNT_NAV = [
  { to: '/mot-de-passe', icon: 'lock', label: 'Changer mon mot de passe', short: 'Sécurité' },
];

/** Tous les liens du rôle courant, dans l'ordre d'affichage. */
export const navItemsFor = (auth) => {
  let items = [];
  if (auth.isPatient) items = PATIENT_NAV;
  else if (auth.isDoctor) items = DOCTOR_NAV;
  else if (auth.isAdmin) items = ADMIN_NAV;
  return items.filter((item) => !item.visible || item.visible(auth));
};

/** Les onglets épinglés dans la tab bar mobile. */
export const tabItemsFor = (auth) =>
  navItemsFor(auth)
    .filter((item) => item.tab)
    .slice(0, MAX_TABS);

/** Les liens restants, présentés dans la feuille « Plus ». */
export const moreItemsFor = (auth) => {
  const tabs = tabItemsFor(auth);
  return navItemsFor(auth).filter((item) => !tabs.includes(item));
};
