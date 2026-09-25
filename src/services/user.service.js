import api from './api';

export const updateMe = async (payload) => {
  const { data } = await api.patch('/users/me', payload);
  return data.data.user;
};

export const uploadMyPhoto = async (file) => {
  const form = new FormData();
  form.append('image', file);
  const { data } = await api.post('/users/me/photo', form);
  return data.data.user;
};
