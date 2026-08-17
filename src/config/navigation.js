/**
 * Navigation unique pour la sidebar (desktop) et la tab bar (mobile).
 *
 * Chaque entrée :
 *  - to / icon / label : destination et rendu
 *  - short             : libellé court affiché sous l'icône de la tab bar
 *  - section           : regroupement dans la sidebar et la feuille « Plus »
 *  - tab               : présent dans la tab bar mobile
 *  - accent            : rendu en bouton d'action mis en avant dans la tab bar
 *  - badge             : 'notifications' pour afficher le compteur de non-lus
 *  - visible           : condition d'affichage (permissions)
 *
 * L'ordre du tableau fixe l'ordre des onglets ; la sidebar, elle, regroupe par
 * section en conservant l'ordre d'apparition.
 */

const PATIENT_NAV = [
  { to: '/accueil', icon: 'home', label: 'Accueil', short: 'Accueil', section: 'Ma santé', tab: true },
  {
    to: '/rendez-vous',
    icon: 'calendar',
    label: 'Mes rendez-vous',
    short: 'RDV',
    section: 'Ma santé',
    tab: true,
  },
  {
    to: '/prendre-rendez-vous',
    icon: 'plus',
    label: 'Prendre rendez-vous',
    short: 'Réserver',
    section: 'Ma santé',
    tab: true,
    accent: true,
  },
  {
    to: '/notifications',
    icon: 'bell',
    label: 'Notifications',
    short: 'Alertes',
    section: 'Suivi',
    tab: true,
    badge: 'notifications',
  },
  {
    to: '/ordonnances',
    icon: 'fileText',
    label: 'Mes ordonnances',
    short: 'Ordonnances',
    section: 'Suivi',
  },
  {
    to: '/orientation',
    icon: 'helpCircle',
    label: 'Trouver un spécialiste',
    short: 'Orientation',
    section: 'Suivi',
  },
];

const DOCTOR_NAV = [
  { to: '/agenda', icon: 'calendar', label: 'Mon agenda', short: 'Agenda', section: 'Consultations', tab: true },
  {
    to: '/demandes',
    icon: 'clipboard',
    label: 'Demandes de rendez-vous',
    short: 'Demandes',
    section: 'Consultations',
    tab: true,
  },
  {
    to: '/mes-patients',
    icon: 'users',
    label: 'Mes patients',
    short: 'Patients',
    section: 'Consultations',
    tab: true,
  },
  {
    to: '/notifications',
    icon: 'bell',
    label: 'Notifications',
    short: 'Alertes',
    section: 'Mon organisation',
    tab: true,
    badge: 'notifications',
  },
  {
    to: '/mes-disponibilites',
    icon: 'clock',
    label: 'Mes disponibilités',
    short: 'Dispos',
    section: 'Mon organisation',
  },
];

const ADMIN_NAV = [
  {
    to: '/tableau-de-bord',
    icon: 'home',
    label: 'Tableau de bord',
    short: 'Accueil',
    section: 'Pilotage',
    tab: true,
  },
  { to: '/patients', icon: 'users', label: 'Patients', short: 'Patients', section: 'Annuaire', tab: true },
  { to: '/medecins', icon: 'userCheck', label: 'Médecins', short: 'Médecins', section: 'Annuaire', tab: true },
  { to: '/cliniques', icon: 'building', label: 'Cliniques', short: 'Cliniques', section: 'Annuaire', tab: true },
  {
    to: '/administrateurs',
    icon: 'userPlus',
    label: 'Administrateurs',
    short: 'Admins',
    section: 'Administration',
    visible: (auth) => auth.isSuperAdmin,
  },
  {
    to: '/conflits',
    icon: 'alertTriangle',
    label: 'Conflits de rendez-vous',
    short: 'Conflits',
    section: 'Pilotage',
    visible: (auth) => auth.isSuperAdmin || auth.isReadOnlyAdmin,
  },
  { to: '/statistiques', icon: 'activity', label: 'Statistiques', short: 'Stats', section: 'Pilotage' },
  {
    to: '/journaux',
    icon: 'fileText',
    label: "Journaux d'activité",
    short: 'Journaux',
    section: 'Pilotage',
    visible: (auth) => auth.isSuperAdmin || auth.isReadOnlyAdmin,
  },
  {
    to: '/parametres',
    icon: 'settings',
    label: 'Paramètres',
    short: 'Réglages',
    section: 'Administration',
  },
];

/** Nombre maximum d'onglets (hors bouton « Plus ») dans la tab bar. */
export const MAX_TABS = 4;

/** Liens toujours accessibles, regroupés dans le menu « Plus » / bas de sidebar. */
export const ACCOUNT_NAV = [
  { to: '/mot-de-passe', icon: 'lock', label: 'Mot de passe', short: 'Sécurité' },
];

/** Tous les liens du rôle courant, dans l'ordre d'affichage. */
export const navItemsFor = (auth) => {
  let items = [];
  if (auth.isPatient) items = PATIENT_NAV;
  else if (auth.isDoctor) items = DOCTOR_NAV;
  else if (auth.isAdmin) items = ADMIN_NAV;
  return items.filter((item) => !item.visible || item.visible(auth));
};

/** Les mêmes liens, regroupés par section pour la sidebar. */
export const navSectionsFor = (auth) => {
  const sections = [];
  navItemsFor(auth).forEach((item) => {
    const label = item.section || 'Menu';
    const section = sections.find((s) => s.label === label);
    if (section) section.items.push(item);
    else sections.push({ label, items: [item] });
  });
  return sections;
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
