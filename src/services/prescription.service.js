import api from './api';

export const createPrescription = async (payload) => {
  const { data } = await api.post('/prescriptions', payload);
  return data.data.prescription;
};

export const getMyPrescriptions = async ({ page = 1, limit = 20 } = {}) => {
  const { data } = await api.get('/prescriptions/me', { params: { page, limit } });
  return data.data;
};

export const getPatientPrescriptions = async (patientId, { page = 1, limit = 20 } = {}) => {
  const { data } = await api.get(`/prescriptions/patient/${patientId}`, { params: { page, limit } });
  return data.data;
};

export const downloadPrescription = async (id) => {
  const response = await api.get(`/prescriptions/${id}/download`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `ordonnance-${id}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
