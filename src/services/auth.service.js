import api from './api';

export const register = async ({ firstName, lastName, phoneNumber, email, password }) => {
  const { data } = await api.post('/auth/register', { firstName, lastName, phoneNumber, email, password });
  return data.data;
};

/** Envoie un code par email. Le compte est désigné par son email ou, à défaut, son téléphone. */
export const resendCode = async ({ email, phoneNumber }) => {
  const { data } = await api.post('/auth/resend-code', { email, phoneNumber });
  return data.data;
};

/** Valide le code reçu par email (inscription ou connexion par code) et renvoie la session. */
export const verifyCode = async ({ email, phoneNumber, code }) => {
  const { data } = await api.post('/auth/verify-code', { email, phoneNumber, code });
  return data.data;
};

export const login = async ({ phoneNumber, password }) => {
  const { data } = await api.post('/auth/login', { phoneNumber, password });
  return data.data;
};

/** Compte connecté : demande l'ajout d'un email, un code part vers cette nouvelle adresse. */
export const requestEmail = async (email) => {
  const { data } = await api.post('/auth/email', { email });
  return data.data;
};

/** Compte connecté : confirme l'email en attente avec le code reçu. Renvoie l'utilisateur à jour. */
export const confirmEmail = async (code) => {
  const { data } = await api.post('/auth/email/confirm', { code });
  return data.data.user;
};

export const changePassword = async ({ currentPassword, newPassword }) => {
  await api.patch('/auth/change-password', { currentPassword, newPassword });
};
