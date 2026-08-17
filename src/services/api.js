import axios from 'axios';

export const TOKEN_KEY = 'sml_admin_token';
export const USER_KEY = 'sml_admin_user';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Pas de réponse du tout : serveur éteint, coupure réseau, DNS...
    // Sans ça, l'écran affiche le « Network Error » brut d'axios.
    if (!error.response && error.code !== 'ERR_CANCELED') {
      error.message =
        error.code === 'ECONNABORTED'
          ? 'Le serveur met trop de temps à répondre. Réessayez dans un instant.'
          : 'Serveur injoignable. Vérifiez votre connexion internet, puis réessayez.';
    }

    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Message à afficher pour une erreur d'API.
 * Le message du serveur prime ; sans réponse du tout, on explique la panne
 * réseau plutôt que d'afficher un message générique qui masque la cause.
 */
export const errorMessageOf = (error, fallback) =>
  error?.response?.data?.message || (error && !error.response ? error.message : null) || fallback;

export default api;
