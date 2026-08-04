import api from './api';

export const requestOrientation = async ({ description, latitude, longitude }) => {
  const { data } = await api.post('/orientation', { description, latitude, longitude });
  return data.data;
};
