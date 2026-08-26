import api from './api';

export const getSosTypes = async () => {
  const { data } = await api.get('/sos-types');
  return data.data.sosTypes;
};

export const createSosType = async (payload) => {
  const { data } = await api.post('/sos-types', payload);
  return data.data.sosType;
};

export const updateSosType = async (id, payload) => {
  const { data } = await api.patch(`/sos-types/${id}`, payload);
  return data.data.sosType;
};

export const deleteSosType = async (id) => {
  await api.delete(`/sos-types/${id}`);
};

/** Icônes proposées à l'admin pour illustrer un type d'urgence. */
export const SOS_TYPE_ICONS = [
  'alertTriangle',
  'heartbeat',
  'activity',
  'users',
  'building',
  'helpCircle',
  'phone',
  'mapPin',
  'clipboard',
  'bell',
];
