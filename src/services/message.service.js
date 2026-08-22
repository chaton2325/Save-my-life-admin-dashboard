import api from './api';

export const getMyMessages = async () => {
  const { data } = await api.get('/messages/me');
  return data.data.messages;
};

export const sendMyMessage = async (body) => {
  const { data } = await api.post('/messages/me', { body });
  return data.data.message;
};

export const getMyUnreadCount = async () => {
  const { data } = await api.get('/messages/unread-count/me');
  return data.data.unreadCount;
};

export const getAdminUnreadCount = async () => {
  const { data } = await api.get('/messages/unread-count/admin');
  return data.data.unreadCount;
};

export const getThreads = async () => {
  const { data } = await api.get('/messages/threads');
  return data.data.threads;
};

export const getThread = async (userId) => {
  const { data } = await api.get(`/messages/threads/${userId}`);
  return data.data;
};

export const replyToThread = async (userId, body) => {
  const { data } = await api.post(`/messages/threads/${userId}`, { body });
  return data.data.message;
};
