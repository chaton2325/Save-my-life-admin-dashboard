import { defineStore } from 'pinia';
import * as authService from '../services/auth.service';
import { TOKEN_KEY, USER_KEY } from '../services/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) || null,
    user: JSON.parse(localStorage.getItem(USER_KEY) || 'null'),
  }),

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    isPatient: (state) => state.user?.role === 'patient',
    isDoctor: (state) => state.user?.role === 'medecin',
    isAdmin: (state) => state.user?.role === 'admin',
    isSuperAdmin: (state) => state.user?.role === 'admin' && state.user?.adminLevel === 'super_admin',
    isReadOnlyAdmin: (state) => state.user?.role === 'admin' && state.user?.adminLevel === 'read_only',
    canManageDoctors: (state) =>
      state.user?.role === 'admin' &&
      ['super_admin', 'doctor_manager'].includes(state.user?.adminLevel),
    canAssignPatients: (state) =>
      state.user?.role === 'admin' &&
      ['super_admin', 'patient_assigner'].includes(state.user?.adminLevel),
  },

  actions: {
    setSession(user, token) {
      this.token = token;
      this.user = user;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    },

    async login(phoneNumber, password) {
      const { user, token } = await authService.login({ phoneNumber, password });
      this.setSession(user, token);
    },

    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    },
  },
});
