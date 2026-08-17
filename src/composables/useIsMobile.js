import { ref, onBeforeUnmount } from 'vue';

/** Doit rester aligné avec le point de rupture « app shell » de main.css. */
export const MOBILE_QUERY = '(max-width: 900px)';

/** Réactif : vrai tant que l'écran est en mode application mobile. */
export const useIsMobile = (query = MOBILE_QUERY) => {
  const mql = window.matchMedia(query);
  const isMobile = ref(mql.matches);
  const update = (event) => {
    isMobile.value = event.matches;
  };

  mql.addEventListener('change', update);
  onBeforeUnmount(() => mql.removeEventListener('change', update));

  return isMobile;
};
