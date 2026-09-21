const NARROW_NBSP = String.fromCharCode(0x202f);
const NBSP = String.fromCharCode(0xa0);

/**
 * Nombre en français avec séparateur de milliers. L'espace fine insécable de
 * Intl est absente de certaines polices et s'y écrase : on la remplace par
 * une espace insécable ordinaire.
 */
export const formatNumber = (value) =>
  Number(value || 0).toLocaleString('fr-FR').replaceAll(NARROW_NBSP, NBSP);

/** Date du jour pour l'en-tête d'un tableau de bord : « Lundi 21 septembre ». */
export const todayLabel = () => {
  const label = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

/** Initiales (2 lettres) d'une personne : « Amina Nkodo » -> « AN ». */
export const initialsOf = (person) =>
  ((person?.firstName?.[0] || '') + (person?.lastName?.[0] || '')).toUpperCase();

/** Jour + mois court + heure d'une date, pour la pastille de date d'une ligne. */
export const dateParts = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { day: '–', month: '', time: '' };
  return {
    day: String(date.getDate()),
    month: date.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', ''),
    time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  };
};
