import * as THREE from 'three';

let gradientMap3 = null;
let gradientMap5 = null;

function createToonGradient(steps) {
  const colors = new Uint8Array(steps);
  for (let i = 0; i < steps; i++) {
    colors[i] = (i / (steps - 1)) * 255;
  }
  const texture = new THREE.DataTexture(colors, steps, 1, THREE.RedFormat);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.needsUpdate = true;
  return texture;
}

export function getGradientMap(steps = 3) {
  if (steps === 3) {
    if (!gradientMap3) gradientMap3 = createToonGradient(3);
    return gradientMap3;
  }
  if (steps === 5) {
    if (!gradientMap5) gradientMap5 = createToonGradient(5);
    return gradientMap5;
  }
  return createToonGradient(steps);
}

export function createToonMaterial(color, options = {}) {
  const steps = options.steps || 3;
  delete options.steps;
  return new THREE.MeshToonMaterial({
    color,
    gradientMap: getGradientMap(steps),
    ...options,
  });
}

export function addOutline(mesh, scale = 1.04, color = 0x000000) {
  const outlineGeo = mesh.geometry.clone();
  const outlineMat = new THREE.MeshBasicMaterial({
    color,
    side: THREE.BackSide,
  });
  const outline = new THREE.Mesh(outlineGeo, outlineMat);
  outline.scale.setScalar(scale);
  mesh.add(outline);
  return outline;
}
