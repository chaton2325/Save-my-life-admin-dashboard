import api from './api';

export const getSpecialities = async () => {
  const { data } = await api.get('/specialities');
  return data.data.specialities;
};

export const createSpeciality = async (name) => {
  const { data } = await api.post('/specialities', { name });
  return data.data.speciality;
};

export const updateSpeciality = async (id, payload) => {
  const { data } = await api.patch(`/specialities/${id}`, payload);
  return data.data.speciality;
};

export const deleteSpeciality = async (id) => {
  await api.delete(`/specialities/${id}`);
};
