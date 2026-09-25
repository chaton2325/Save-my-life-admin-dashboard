import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    // Vite refuse par défaut les requêtes dont l'en-tête Host n'est pas reconnu
    // (protection anti-rebinding DNS) : le domaine public doit être autorisé explicitement.
    allowedHosts: ['smlcam.com', 'www.smlcam.com'],
  },
});
