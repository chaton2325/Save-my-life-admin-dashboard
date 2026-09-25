import api from './api';

export const getPatients = async ({ page = 1, limit = 10, search = '' } = {}) => {
  const { data } = await api.get('/admin/patients', { params: { page, limit, search } });
  return data.data;
};

export const appointAdmin = async (phoneNumber, adminLevel) => {
  const { data } = await api.post('/admin/administrators', { phoneNumber, adminLevel });
  return data.data;
};

export const getStats = async () => {
  const { data } = await api.get('/admin/stats');
  return data.data;
};

export const getActivityLogs = async ({ page = 1, limit = 20 } = {}) => {
  const { data } = await api.get('/admin/activity-logs', { params: { page, limit } });
  return data.data;
};

export const updatePatientStatus = async (id, isActive) => {
  const { data } = await api.patch(`/admin/patients/${id}/status`, { isActive });
  return data.data.patient;
};

export const deletePatient = async (id) => {
  await api.delete(`/admin/patients/${id}`);
};
