import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { baseScale, clampPosition, centeredPosition, zoomedPosition, cropRect } from '../src/utils/cropMath.js';

const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

describe('baseScale', () => {
  test('image paysage dans un cadre carré : la hauteur détermine l’échelle', () => {
    close(baseScale({ w: 400, h: 400 }, { w: 2000, h: 1000 }), 0.4);
  });
  test('image portrait dans un cadre large : la largeur détermine l’échelle', () => {
    close(baseScale({ w: 400, h: 175 }, { w: 1000, h: 2000 }), 0.4);
  });
  test('valeurs vides : 1 (pas de division par zéro)', () => {
    assert.equal(baseScale({ w: 0, h: 0 }, { w: 0, h: 0 }), 1);
  });
});

describe('l’image couvre toujours le cadre', () => {
  const box = { w: 400, h: 300 };
  const natural = { w: 2000, h: 1000 };
  const scale = 0.4; // image affichée 800x400 dans un cadre 400x300

  test('échelle de base : 0.3 (la hauteur limite), image 600x300', () => {
    close(baseScale(box, natural), 0.3);
  });
  test('centrage', () => {
    assert.deepEqual(centeredPosition(box, natural, scale), { x: -200, y: -50 });
  });
  test('ne laisse pas de vide à gauche/en haut', () => {
    assert.deepEqual(clampPosition(box, natural, scale, 50, 50), { x: 0, y: 0 });
  });
  test('ne laisse pas de vide à droite/en bas', () => {
    assert.deepEqual(clampPosition(box, natural, scale, -9999, -9999), { x: -400, y: -100 });
  });
  test('position valide inchangée', () => {
    assert.deepEqual(clampPosition(box, natural, scale, -100, -20), { x: -100, y: -20 });
  });
});

describe('zoomedPosition', () => {
  const box = { w: 400, h: 400 };
  const natural = { w: 1000, h: 1000 };

  test('zoom depuis le centre : le centre de l’image reste au centre', () => {
    const s1 = baseScale(box, natural);
    const p1 = centeredPosition(box, natural, s1);
    const s2 = s1 * 2;
    const p2 = zoomedPosition(box, natural, s1, s2, p1);
    // point image au centre du cadre avant/après
    close((box.w / 2 - p1.x) / s1, (box.w / 2 - p2.x) / s2);
    close((box.h / 2 - p1.y) / s1, (box.h / 2 - p2.y) / s2);
  });

  test('dézoom : la position est recadrée dans les limites', () => {
    const s = baseScale(box, natural);
    const p = zoomedPosition(box, natural, s * 3, s, { x: -500, y: -500 });
    assert.deepEqual(p, { x: 0, y: 0 }); // à l'échelle de base l'image = cadre exactement
  });
});

describe('cropRect', () => {
  const box = { w: 400, h: 300 };

  test('recadrage en haut à gauche, zoom 1 sur image 2000x1500', () => {
    const scale = 0.2; // image affichée 400x300
    const r = cropRect(box, scale, { x: 0, y: 0 }, 1280);
    assert.deepEqual([r.sx, r.sy, r.sw, r.sh], [0, 0, 2000, 1500]);
    assert.equal(r.outW, 1280);
    assert.equal(r.outH, 960); // ratio 4:3 conservé
  });

  test('décalage converti en coordonnées de l’image source', () => {
    const r = cropRect(box, 0.5, { x: -100, y: -50 }, 1280);
    assert.equal(r.sx, 200);
    assert.equal(r.sy, 100);
    assert.equal(r.sw, 800);
    assert.equal(r.sh, 600);
  });

  test('pas d’agrandissement : sortie limitée à la résolution de la zone', () => {
    const r = cropRect(box, 1, { x: 0, y: 0 }, 1280); // zone source de 400 px seulement
    assert.equal(r.outW, 400);
    assert.equal(r.outH, 300);
  });

  test('ratio de sortie = ratio du cadre (cadre 16:7)', () => {
    const r = cropRect({ w: 640, h: 280 }, 0.4, { x: 0, y: 0 }, 1600);
    close(r.outW / r.outH, 640 / 280, 0.01);
  });
});
