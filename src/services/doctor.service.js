import api from './api';

export const getDoctors = async ({ page = 1, limit = 20, search = '', speciality = '' } = {}) => {
  const { data } = await api.get('/doctors', { params: { page, limit, search, speciality } });
  return data.data;
};

export const getDoctor = async (id) => {
  const { data } = await api.get(`/doctors/${id}`);
  return data.data.doctor;
};

export const getDoctorAvailability = async (id, date = '') => {
  const { data } = await api.get(`/doctors/${id}/availability`, { params: date ? { date } : {} });
  return data.data;
};

export const getMyPatients = async ({ page = 1, limit = 20, search = '' } = {}) => {
  const { data } = await api.get('/doctors/me/patients', { params: { page, limit, search } });
  return data.data;
};

export const registerDoctor = async (payload) => {
  const { data } = await api.post('/doctors', payload);
  return data.data.doctor;
};

export const updateDoctor = async (id, payload) => {
  const { data } = await api.patch(`/doctors/${id}`, payload);
  return data.data.doctor;
};
