import api from './api';

export const getMyNotifications = async ({ page = 1, limit = 20, unreadOnly = false } = {}) => {
  const { data } = await api.get('/notifications/me', { params: { page, limit, unreadOnly } });
  return data.data;
};

export const markAsRead = async (id) => {
  const { data } = await api.patch(`/notifications/${id}/read`);
  return data.data;
};

export const markAllAsRead = async () => {
  await api.patch('/notifications/read-all');
};
