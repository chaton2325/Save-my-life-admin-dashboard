import api from './api';

export const register = async ({ firstName, lastName, phoneNumber, password }) => {
  const { data } = await api.post('/auth/register', { firstName, lastName, phoneNumber, password });
  return data.data;
};

export const resendCode = async (phoneNumber) => {
  const { data } = await api.post('/auth/resend-code', { phoneNumber });
  return data.data;
};

export const verifyPhone = async ({ phoneNumber, code }) => {
  const { data } = await api.post('/auth/verify-phone', { phoneNumber, code });
  return data.data;
};

export const login = async ({ phoneNumber, password }) => {
  const { data } = await api.post('/auth/login', { phoneNumber, password });
  return data.data;
};

export const changePassword = async ({ currentPassword, newPassword }) => {
  await api.patch('/auth/change-password', { currentPassword, newPassword });
};
