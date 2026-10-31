import api from './api';

export const getClinics = async ({ page = 1, limit = 20, search = '', latitude, longitude } = {}) => {
  const { data } = await api.get('/clinics', { params: { page, limit, search, latitude, longitude } });
  return data.data;
};

export const getClinic = async (id) => {
  const { data } = await api.get(`/clinics/${id}`);
  return data.data.clinic;
};

export const createClinic = async (payload) => {
  const { data } = await api.post('/clinics', payload);
  return data.data.clinic;
};

export const updateClinic = async (id, payload) => {
  const { data } = await api.patch(`/clinics/${id}`, payload);
  return data.data.clinic;
};

export const uploadClinicLogo = async (id, file) => {
  const form = new FormData();
  form.append('image', file);
  const { data } = await api.post(`/clinics/${id}/logo`, form);
  return data.data.clinic;
};

export const uploadClinicCover = async (id, file) => {
  const form = new FormData();
  form.append('image', file);
  const { data } = await api.post(`/clinics/${id}/cover`, form);
  return data.data.clinic;
};

export const getClinicGallery = async (id) => {
  const { data } = await api.get(`/clinics/${id}/gallery`);
  return data.data.images;
};

// `name` est ajouté avant `image` pour que multer le lise dans req.body.
export const addGalleryImage = async (id, file, name) => {
  const form = new FormData();
  form.append('name', name);
  form.append('image', file);
  const { data } = await api.post(`/clinics/${id}/gallery`, form);
  return data.data.image;
};

export const renameGalleryImage = async (id, imageId, name) => {
  const { data } = await api.patch(`/clinics/${id}/gallery/${imageId}`, { name });
  return data.data.image;
};

export const deleteGalleryImage = async (id, imageId) => {
  await api.delete(`/clinics/${id}/gallery/${imageId}`);
};

export const deleteClinic =async (id) => {
  await api.delete(`/clinics/${id}`);
};
