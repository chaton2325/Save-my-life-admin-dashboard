import api from './api';

export const login = async ({ phoneNumber, password }) => {
  const { data } = await api.post('/auth/login', { phoneNumber, password });
  return data.data;
};
