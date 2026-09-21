/**
 * Statuts de rendez-vous : libellé au pluriel (statistiques) et couleur de
 * graphique, dans l'ordre d'affichage des légendes.
 */
export const APPOINTMENT_STATUSES = [
  { key: 'confirmed', label: 'Confirmés', color: 'var(--chart-blue)' },
  { key: 'completed', label: 'Terminés', color: 'var(--chart-green)' },
  { key: 'pending', label: 'En attente', color: 'var(--chart-amber)' },
  { key: 'cancelled', label: 'Annulés', color: 'var(--chart-red)' },
  { key: 'refused', label: 'Refusés', color: 'var(--chart-grey)' },
];

/** Répartition prête à afficher : [{ key, label, color, count }], statuts inconnus ignorés. */
export const statusBreakdown = (byStatus = {}) =>
  APPOINTMENT_STATUSES.map((status) => ({ ...status, count: Number(byStatus[status.key]) || 0 }));

/** Part (0-100) des rendez-vous confirmés ou terminés — ceux qui ont abouti. */
export const acceptanceRate = (byStatus = {}, total = 0) => {
  if (!total) return 0;
  const accepted = (Number(byStatus.confirmed) || 0) + (Number(byStatus.completed) || 0);
  return Math.round((accepted / total) * 100);
};
