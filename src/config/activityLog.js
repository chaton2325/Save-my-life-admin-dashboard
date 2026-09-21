/** Libellés et icônes des actions du journal d'activité (tableau de bord + journal). */
const ACTION_LABELS = {
  'admin.appoint_admin': 'A nommé un administrateur',
  'admin.register_doctor': 'A enregistré un médecin',
  'admin.update_doctor': 'A modifié un médecin',
  'admin.activate_doctor': 'A réactivé un médecin',
  'admin.deactivate_doctor': 'A restreint l’accès à un médecin',
  'admin.delete_doctor': 'A supprimé un médecin',
  'admin.assign_patient_doctor': 'A assigné un patient à un médecin',
  'appointment.resolve_conflict': 'A résolu un conflit de rendez-vous',
};

export const actionLabel = (action) => ACTION_LABELS[action] || action;

export const logIcon = (action) => {
  if (action.includes('delete')) return 'trash';
  if (action.includes('conflict')) return 'check';
  if (action.includes('register') || action.includes('appoint')) return 'userPlus';
  if (action.includes('assign') || action.includes('activate')) return 'userCheck';
  return 'edit';
};
