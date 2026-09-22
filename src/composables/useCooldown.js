import { ref, onBeforeUnmount } from 'vue';

/**
 * Compte à rebours pour l'action « renvoyer le code » : le serveur refuse deux envois
 * à moins d'une minute d'intervalle, on l'annonce plutôt que d'afficher une erreur.
 */
export const useCooldown = (seconds = 60) => {
  const remaining = ref(0);
  let timer;

  const start = () => {
    remaining.value = seconds;
    clearInterval(timer);
    timer = setInterval(() => {
      remaining.value -= 1;
      if (remaining.value <= 0) clearInterval(timer);
    }, 1000);
  };

  onBeforeUnmount(() => clearInterval(timer));

  return { remaining, start };
};
