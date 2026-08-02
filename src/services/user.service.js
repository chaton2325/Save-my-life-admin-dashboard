import api from './api';

export const updateMe = async (payload) => {
  const { data } = await api.patch('/users/me', payload);
  return data.data.user;
};
