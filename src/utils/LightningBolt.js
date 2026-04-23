import * as THREE from 'three';

export function createLightningBolt(start, end, options = {}) {
  const {
    generations = 6,
    maxOffset = 1.5,
    branchChance = 0.3,
    branchLength = 0.4,
    thickness = 0.06,
  } = options;

  const points = subdivide(start, end, generations, maxOffset);
  const branches = [];

  for (let i = 1; i < points.length - 1; i++) {
    if (Math.random() < branchChance) {
      const dir = new THREE.Vector3()
        .subVectors(points[i + 1], points[i])
        .normalize();
      const perpX = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
      const branchEnd = points[i].clone().add(
        perpX.multiplyScalar((Math.random() - 0.5) * 4)
          .add(dir.multiplyScalar(branchLength * points[i].distanceTo(end)))
      );
      const branchPoints = subdivide(points[i], branchEnd, 3, maxOffset * 0.5);
      branches.push(branchPoints);
    }
  }

  const group = new THREE.Group();

  // Main bolt
  group.add(createBoltMesh(points, thickness));

  // Branches
  branches.forEach(bp => {
    group.add(createBoltMesh(bp, thickness * 0.5));
  });

  // Glow bolt (wider, transparent)
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x8888ff,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
  });
  const glowGeo = createRibbonGeometry(points, thickness * 4);
  group.add(new THREE.Mesh(glowGeo, glowMat));

  return { group, points, branches };
}

function subdivide(start, end, generations, maxOffset) {
  let points = [start.clone(), end.clone()];

  for (let g = 0; g < generations; g++) {
    const newPoints = [points[0]];
    for (let i = 0; i < points.length - 1; i++) {
      const mid = new THREE.Vector3().lerpVectors(points[i], points[i + 1], 0.5);
      const offset = maxOffset / Math.pow(2, g * 0.7);
      mid.x += (Math.random() - 0.5) * offset;
      mid.y += (Math.random() - 0.5) * offset;
      mid.z += (Math.random() - 0.5) * offset * 0.5;
      newPoints.push(mid);
      newPoints.push(points[i + 1]);
    }
    points = newPoints;
  }

  return points;
}

function createBoltMesh(points, thickness) {
  const geo = createRibbonGeometry(points, thickness);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
  });
  return new THREE.Mesh(geo, mat);
}

function createRibbonGeometry(points, width) {
  const vertices = [];
  const indices = [];

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const halfW = width * 0.5;
    vertices.push(p.x - halfW, p.y, p.z);
    vertices.push(p.x + halfW, p.y, p.z);

    if (i < points.length - 1) {
      const base = i * 2;
      indices.push(base, base + 1, base + 2);
      indices.push(base + 1, base + 3, base + 2);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}
