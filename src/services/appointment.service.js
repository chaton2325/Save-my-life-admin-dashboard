import api from './api';

export const bookAppointment = async (payload) => {
  const { data } = await api.post('/appointments', payload);
  return data.data.appointment;
};

export const getMyAppointments = async ({ page = 1, limit = 20, status = '' } = {}) => {
  const { data } = await api.get('/appointments/me', { params: { page, limit, status } });
  return data.data;
};

export const getAgenda = async ({ page = 1, limit = 20, status = '', from = '', to = '' } = {}) => {
  const { data } = await api.get('/appointments/agenda', { params: { page, limit, status, from, to } });
  return data.data;
};

export const rescheduleAppointment = async (id, payload) => {
  const { data } = await api.patch(`/appointments/${id}`, payload);
  return data.data.appointment;
};

export const cancelAppointment = async (id, cancelReason = '') => {
  const { data } = await api.delete(`/appointments/${id}`, { data: { cancelReason } });
  return data.data.appointment;
};

export const validateAppointment = async (id) => {
  const { data } = await api.patch(`/appointments/${id}/validate`);
  return data.data.appointment;
};

export const refuseAppointment = async (id, refusalReason = '') => {
  const { data } = await api.patch(`/appointments/${id}/refuse`, { refusalReason });
  return data.data.appointment;
};

export const getAllAppointments = async (params = {}) => {
  const { data } = await api.get('/appointments', { params });
  return data.data;
};

export const getConflicts = async () => {
  const { data } = await api.get('/appointments/conflicts');
  return data.data.conflicts;
};

export const resolveConflict = async (payload) => {
  const { data } = await api.post('/appointments/resolve-conflict', payload);
  return data.data;
};
