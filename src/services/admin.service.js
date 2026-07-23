import api from './api';

export const getPatients = async ({ page = 1, limit = 10, search = '' } = {}) => {
  const { data } = await api.get('/admin/patients', { params: { page, limit, search } });
  return data.data;
};

export const appointAdmin = async (phoneNumber) => {
  const { data } = await api.post('/admin/administrators', { phoneNumber });
  return data.data;
};
