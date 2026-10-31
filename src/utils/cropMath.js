/**
 * Calculs purs du recadrage (aucune dépendance au DOM, donc testables).
 * box = { w, h } : taille du cadre visible ; natural = { w, h } : taille réelle de l'image ;
 * pos = { x, y } : position du coin haut-gauche de l'image dans le cadre (<= 0).
 */

/** Échelle minimale pour que l'image couvre entièrement le cadre. */
export const baseScale = (box, natural) => {
  if (!natural.w || !natural.h || !box.w || !box.h) return 1;
  return Math.max(box.w / natural.w, box.h / natural.h);
};

/** Empêche de laisser du vide dans le cadre. */
export const clampPosition = (box, natural, scale, x, y) => {
  const dw = natural.w * scale;
  const dh = natural.h * scale;
  return {
    x: Math.min(0, Math.max(box.w - dw, x)),
    y: Math.min(0, Math.max(box.h - dh, y)),
  };
};

/** Position qui centre l'image dans le cadre. */
export const centeredPosition = (box, natural, scale) =>
  clampPosition(box, natural, scale, (box.w - natural.w * scale) / 2, (box.h - natural.h * scale) / 2);

/** Nouvelle position après un changement d'échelle, en gardant le centre du cadre fixe. */
export const zoomedPosition = (box, natural, oldScale, newScale, pos) => {
  const cx = (box.w / 2 - pos.x) / oldScale;
  const cy = (box.h / 2 - pos.y) / oldScale;
  return clampPosition(box, natural, newScale, box.w / 2 - cx * newScale, box.h / 2 - cy * newScale);
};

/**
 * Zone de l'image source à découper + taille de sortie.
 * La largeur de sortie ne dépasse jamais la résolution réelle de la zone (pas d'agrandissement).
 */
export const cropRect = (box, scale, pos, outputWidth) => {
  const sw = box.w / scale;
  const sh = box.h / scale;
  const outW = Math.min(outputWidth, Math.round(sw));
  return {
    sx: (0 - pos.x) / scale, // évite -0
    sy: (0 - pos.y) / scale,
    sw,
    sh,
    outW,
    outH: Math.round((outW * box.h) / box.w),
  };
};
