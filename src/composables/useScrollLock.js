import { watch, onBeforeUnmount } from 'vue';

let lockCount = 0;

const lock = () => {
  lockCount += 1;
  document.body.classList.add('is-locked');
};

const unlock = () => {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) document.body.classList.remove('is-locked');
};

/**
 * Empêche le défilement de la page tant qu'une modale / feuille est ouverte.
 * `source` peut être un ref booléen (feuille pilotée par une prop) ou `true`
 * pour verrouiller pendant toute la durée de vie du composant.
 */
export const useScrollLock = (source = true) => {
  let locked = false;

  const apply = (value) => {
    if (value && !locked) {
      locked = true;
      lock();
    } else if (!value && locked) {
      locked = false;
      unlock();
    }
  };

  if (source === true) {
    apply(true);
  } else {
    watch(source, apply, { immediate: true });
  }

  onBeforeUnmount(() => apply(false));
};
