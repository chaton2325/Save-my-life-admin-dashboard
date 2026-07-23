import { defineStore } from 'pinia';
import * as authService from '../services/auth.service';
import { TOKEN_KEY, USER_KEY } from '../services/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) || null,
    user: JSON.parse(localStorage.getItem(USER_KEY) || 'null'),
  }),

  getters: {
    isAuthenticated: (state) => !!state.token && state.user?.role === 'admin',
  },

  actions: {
    async login(phoneNumber, password) {
      const { user, token } = await authService.login({ phoneNumber, password });
      if (user.role !== 'admin') {
        throw new Error('Accès réservé aux administrateurs.');
      }
      this.token = token;
      this.user = user;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    },

    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    },
  },
});
