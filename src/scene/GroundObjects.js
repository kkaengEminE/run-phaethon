import * as THREE from 'three';
import { createToonMaterial } from '../utils/ToonMaterials.js';

const EARTH_RADIUS = 20;

export class GroundObjects {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.burnStates = []; // track burned state per object
    this.objectAngles = []; // angular position of each object for proximity checks

    this._createTrees(150);
    this._createHouses(50);
    this._createPeople(40);
    this._createCows(25);
    this._createGroundHorses(15);

    scene.add(this.group);
  }

  _placeOnSphere(mesh, theta, phi) {
    const r = EARTH_RADIUS + 0.01;
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    mesh.position.set(x, y, z);

    // Orient outward
    const outDir = new THREE.Vector3(x, y, z).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, outDir);
    mesh.quaternion.copy(quat);

    return { x, y, z, theta, phi };
  }

  _randomSpherePos() {
    const theta = Math.random() * Math.PI * 2;
    // Avoid poles (phi 0 and PI) - keep objects in mid-latitudes
    const phi = 0.3 + Math.random() * (Math.PI - 0.6);
    return { theta, phi };
  }

  _createTrees(count) {
    const trunkMat = createToonMaterial(0x8b4513);
    const leafMat = createToonMaterial(0x228b22);
    const darkLeafMat = createToonMaterial(0x006400);

    for (let i = 0; i < count; i++) {
      const tree = new THREE.Group();

      // Trunk
      const trunkGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.5, 6);
      tree.add(new THREE.Mesh(trunkGeo, trunkMat));

      // Crown - varied shapes
      const variant = Math.random();
      if (variant < 0.5) {
        // Cone tree (pine)
        const crownGeo = new THREE.ConeGeometry(0.25, 0.6, 6);
        const crown = new THREE.Mesh(crownGeo, darkLeafMat);
        crown.position.y = 0.5;
        tree.add(crown);
      } else {
        // Round tree
        const crownGeo = new THREE.SphereGeometry(0.25, 6, 6);
        const crown = new THREE.Mesh(crownGeo, leafMat);
        crown.position.y = 0.5;
        tree.add(crown);
      }

      const scale = 0.6 + Math.random() * 0.8;
      tree.scale.setScalar(scale);

      const { theta, phi } = this._randomSpherePos();
      const pos = this._placeOnSphere(tree, theta, phi);
      this.group.add(tree);

      const angle2d = Math.atan2(pos.y, pos.x);
      this.objectAngles.push(angle2d);
      this.burnStates.push({ burned: false, obj: tree, type: 'tree' });
    }
  }

  _createHouses(count) {
    const wallMat = createToonMaterial(0xdeb887);
    const roofMat = createToonMaterial(0xb22222);

    for (let i = 0; i < count; i++) {
      const house = new THREE.Group();

      // Walls
      const wallGeo = new THREE.BoxGeometry(0.35, 0.25, 0.3);
      const walls = new THREE.Mesh(wallGeo, wallMat);
      walls.position.y = 0.125;
      house.add(walls);

      // Roof
      const roofGeo = new THREE.ConeGeometry(0.3, 0.2, 4);
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.y = 0.35;
      roof.rotation.y = Math.PI / 4;
      house.add(roof);

      const scale = 0.6 + Math.random() * 0.5;
      house.scale.setScalar(scale);

      const { theta, phi } = this._randomSpherePos();
      const pos = this._placeOnSphere(house, theta, phi);
      this.group.add(house);

      const angle2d = Math.atan2(pos.y, pos.x);
      this.objectAngles.push(angle2d);
      this.burnStates.push({ burned: false, obj: house, type: 'house' });
    }
  }

  _createPeople(count) {
    const skinMat = createToonMaterial(0xffdbac);
    const clothMats = [
      createToonMaterial(0x4169e1),
      createToonMaterial(0xdc143c),
      createToonMaterial(0x32cd32),
      createToonMaterial(0x9370db),
    ];

    for (let i = 0; i < count; i++) {
      const person = new THREE.Group();

      // Body
      const bodyGeo = new THREE.CapsuleGeometry(0.04, 0.12, 4, 6);
      const body = new THREE.Mesh(bodyGeo, clothMats[i % clothMats.length]);
      body.position.y = 0.1;
      person.add(body);

      // Head
      const headGeo = new THREE.SphereGeometry(0.04, 6, 6);
      const head = new THREE.Mesh(headGeo, skinMat);
      head.position.y = 0.22;
      person.add(head);

      const scale = 0.7 + Math.random() * 0.4;
      person.scale.setScalar(scale);

      const { theta, phi } = this._randomSpherePos();
      const pos = this._placeOnSphere(person, theta, phi);
      this.group.add(person);

      const angle2d = Math.atan2(pos.y, pos.x);
      this.objectAngles.push(angle2d);
      this.burnStates.push({ burned: false, obj: person, type: 'person' });
    }
  }

  _createCows(count) {
    const whiteMat = createToonMaterial(0xffffff);
    const spotMat = createToonMaterial(0x222222);

    for (let i = 0; i < count; i++) {
      const cow = new THREE.Group();

      // Body
      const bodyGeo = new THREE.BoxGeometry(0.3, 0.15, 0.15);
      const body = new THREE.Mesh(bodyGeo, whiteMat);
      body.position.y = 0.12;
      cow.add(body);

      // Head
      const headGeo = new THREE.SphereGeometry(0.07, 6, 6);
      const head = new THREE.Mesh(headGeo, whiteMat);
      head.position.set(0.18, 0.15, 0);
      cow.add(head);

      // Spots
      const spotGeo = new THREE.SphereGeometry(0.05, 4, 4);
      const spot = new THREE.Mesh(spotGeo, spotMat);
      spot.position.set(0.05, 0.2, 0.04);
      cow.add(spot);

      // Legs
      const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 4);
      [[-0.1, -0.05], [-0.1, 0.05], [0.1, -0.05], [0.1, 0.05]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(legGeo, whiteMat);
        leg.position.set(lx, 0.02, lz);
        cow.add(leg);
      });

      const scale = 0.6 + Math.random() * 0.3;
      cow.scale.setScalar(scale);

      const { theta, phi } = this._randomSpherePos();
      const pos = this._placeOnSphere(cow, theta, phi);
      this.group.add(cow);

      const angle2d = Math.atan2(pos.y, pos.x);
      this.objectAngles.push(angle2d);
      this.burnStates.push({ burned: false, obj: cow, type: 'cow' });
    }
  }

  _createGroundHorses(count) {
    const horseMat = createToonMaterial(0xcd853f);

    for (let i = 0; i < count; i++) {
      const horse = new THREE.Group();

      // Body
      const bodyGeo = new THREE.CapsuleGeometry(0.06, 0.25, 4, 6);
      const body = new THREE.Mesh(bodyGeo, horseMat);
      body.rotation.z = Math.PI / 2;
      body.position.y = 0.12;
      horse.add(body);

      // Head
      const headGeo = new THREE.SphereGeometry(0.05, 6, 6);
      const head = new THREE.Mesh(headGeo, horseMat);
      head.position.set(0.18, 0.16, 0);
      horse.add(head);

      // Legs
      const legGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.12, 4);
      [[-0.08, -0.03], [-0.08, 0.03], [0.08, -0.03], [0.08, 0.03]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(legGeo, horseMat);
        leg.position.set(lx, 0.02, lz);
        horse.add(leg);
      });

      const scale = 0.6 + Math.random() * 0.4;
      horse.scale.setScalar(scale);

      const { theta, phi } = this._randomSpherePos();
      const pos = this._placeOnSphere(horse, theta, phi);
      this.group.add(horse);

      const angle2d = Math.atan2(pos.y, pos.x);
      this.objectAngles.push(angle2d);
      this.burnStates.push({ burned: false, obj: horse, type: 'horse' });
    }
  }

  // Get objects near a given angle (for fire effects)
  getObjectsNearAngle(angle, range) {
    const result = [];
    for (let i = 0; i < this.objectAngles.length; i++) {
      let diff = Math.abs(this.objectAngles[i] - angle);
      if (diff > Math.PI) diff = Math.PI * 2 - diff;
      if (diff < range) {
        result.push(this.burnStates[i]);
      }
    }
    return result;
  }

  // Burn objects near the chariot when damage is happening
  burnNearbyObjects(angle, range) {
    const burnedMat = createToonMaterial(0x1a1a1a);
    const charredMat = createToonMaterial(0x333333);

    const nearby = this.getObjectsNearAngle(angle, range);
    let burnedCount = 0;
    nearby.forEach((state) => {
      if (!state.burned) {
        state.burned = true;
        burnedCount++;
        // Turn all children dark
        state.obj.traverse((child) => {
          if (child.isMesh) {
            child.material = Math.random() > 0.5 ? burnedMat : charredMat;
          }
        });
      }
    });
    return burnedCount;
  }

  reset() {
    // Remove and recreate (simplest approach)
    this.scene.remove(this.group);
    this.burnStates = [];
    this.objectAngles = [];
    this.group = new THREE.Group();

    this._createTrees(150);
    this._createHouses(50);
    this._createPeople(40);
    this._createCows(25);
    this._createGroundHorses(15);

    this.scene.add(this.group);
  }
}
