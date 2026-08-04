import api from './api';

export const getClinics = async ({ page = 1, limit = 20, search = '', latitude, longitude } = {}) => {
  const { data } = await api.get('/clinics', { params: { page, limit, search, latitude, longitude } });
  return data.data;
};

export const getClinic = async (id) => {
  const { data } = await api.get(`/clinics/${id}`);
  return data.data.clinic;
};

export const createClinic = async (payload) => {
  const { data } = await api.post('/clinics', payload);
  return data.data.clinic;
};

export const updateClinic = async (id, payload) => {
  const { data } = await api.patch(`/clinics/${id}`, payload);
  return data.data.clinic;
};

export const deleteClinic = async (id) => {
  await api.delete(`/clinics/${id}`);
};
