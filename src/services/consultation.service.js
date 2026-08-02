import api from './api';

export const createConsultationReport = async (payload) => {
  const { data } = await api.post('/consultations', payload);
  return data.data.report;
};

export const getMyConsultations = async ({ page = 1, limit = 20 } = {}) => {
  const { data } = await api.get('/consultations/me', { params: { page, limit } });
  return data.data;
};

export const getPatientHistory = async (patientId, { page = 1, limit = 20 } = {}) => {
  const { data } = await api.get(`/consultations/patient/${patientId}`, { params: { page, limit } });
  return data.data;
};
