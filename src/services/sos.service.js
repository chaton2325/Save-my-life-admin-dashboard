import api from './api';

export const createSos = async (payload) => {
  const { data } = await api.post('/sos', payload);
  return data.data;
};

export const getMySosRequests = async () => {
  const { data } = await api.get('/sos/me');
  return data.data.sosRequests;
};

export const getSosRequest = async (id) => {
  const { data } = await api.get(`/sos/${id}`);
  return data.data.sosRequest;
};

export const getAllSosRequests = async ({ status, page = 1, limit = 20 } = {}) => {
  const { data } = await api.get('/sos', { params: { status, page, limit } });
  return data.data;
};

export const updateSosStatus = async (id, payload) => {
  const { data } = await api.patch(`/sos/${id}`, payload);
  return data.data.sosRequest;
};

export const SOS_STATUS_LABELS = {
  nouveau: 'Nouveau',
  en_cours: 'En cours',
  oriente: 'Orienté',
  resolu: 'Résolu',
  annule: 'Annulé',
};

export const SOS_STATUS_BADGE = {
  nouveau: 'badge--pending',
  en_cours: 'badge--neutral',
  oriente: 'badge--confirmed',
  resolu: 'badge--completed',
  annule: 'badge--cancelled',
};
