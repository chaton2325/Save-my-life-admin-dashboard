import api from './api';

export const getMyAvailabilities = async () => {
  const { data } = await api.get('/availabilities/me');
  return data.data.availabilities;
};

export const createAvailability = async (payload) => {
  const { data } = await api.post('/availabilities', payload);
  return data.data.availability;
};

export const updateAvailability = async (id, payload) => {
  const { data } = await api.patch(`/availabilities/${id}`, payload);
  return data.data.availability;
};

export const deleteAvailability = async (id) => {
  await api.delete(`/availabilities/${id}`);
};
