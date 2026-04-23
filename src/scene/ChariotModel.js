import * as THREE from 'three';
import { createToonMaterial } from '../utils/ToonMaterials.js';

export class ChariotModel {
  constructor(scene) {
    this.group = new THREE.Group();
    this.horses = [];
    this.wingPairs = [];
    this.legSets = [];
    this.wheelL = null;
    this.wheelR = null;
    this.elapsed = 0;

    this._buildChariot();
    this._buildHorses();
    this._buildPhaethon();
    this._buildSunGlow();

    scene.add(this.group);
  }

  _buildChariot() {
    const chariotGroup = new THREE.Group();

    // Platform
    const platformGeo = new THREE.BoxGeometry(1.6, 0.15, 0.9);
    const goldMat = createToonMaterial(0xdaa520);
    const platform = new THREE.Mesh(platformGeo, goldMat);
    platform.position.y = 0;
    chariotGroup.add(platform);

    // Front rail (curved)
    const railGeo = new THREE.TorusGeometry(0.5, 0.04, 8, 16, Math.PI);
    const railMat = createToonMaterial(0xcd853f);
    const frontRail = new THREE.Mesh(railGeo, railMat);
    frontRail.position.set(0.4, 0.3, 0);
    frontRail.rotation.z = Math.PI / 2;
    frontRail.rotation.x = Math.PI / 2;
    chariotGroup.add(frontRail);

    // Side rails
    for (const side of [-1, 1]) {
      const sideRailGeo = new THREE.BoxGeometry(1.0, 0.4, 0.04);
      const sideRail = new THREE.Mesh(sideRailGeo, railMat);
      sideRail.position.set(0, 0.2, side * 0.45);
      chariotGroup.add(sideRail);
    }

    // Wheels
    const wheelGeo = new THREE.TorusGeometry(0.35, 0.05, 8, 24);
    const wheelMat = createToonMaterial(0x8b4513);
    const spokeGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 4);

    for (const side of [-1, 1]) {
      const wheel = new THREE.Group();
      const rim = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.add(rim);

      // Spokes
      for (let i = 0; i < 6; i++) {
        const spoke = new THREE.Mesh(spokeGeo, wheelMat);
        spoke.rotation.z = (i / 6) * Math.PI;
        wheel.add(spoke);
      }

      wheel.position.set(-0.5, -0.15, side * 0.55);
      wheel.rotation.y = Math.PI / 2;
      chariotGroup.add(wheel);

      if (side === -1) this.wheelL = wheel;
      else this.wheelR = wheel;
    }

    // Axle
    const axleGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.2, 6);
    const axle = new THREE.Mesh(axleGeo, wheelMat);
    axle.position.set(-0.5, -0.15, 0);
    axle.rotation.x = Math.PI / 2;
    chariotGroup.add(axle);

    this.chariotBody = chariotGroup;
    this.group.add(chariotGroup);
  }

  _buildHorses() {
    const bodyMat = createToonMaterial(0xfff8dc); // cream
    const maneMat = createToonMaterial(0xffd700); // golden mane
    const wingMat = createToonMaterial(0xffeedd, { side: THREE.DoubleSide });

    const positions = [
      { x: 2.2, z: -0.35 },
      { x: 2.2, z: 0.35 },
      { x: 2.8, z: -0.2 },
      { x: 2.8, z: 0.2 },
    ];

    positions.forEach((pos, idx) => {
      const horse = new THREE.Group();

      // Body
      const bodyGeo = new THREE.CapsuleGeometry(0.12, 0.45, 4, 8);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.rotation.z = Math.PI / 2;
      horse.add(body);

      // Head
      const headGeo = new THREE.SphereGeometry(0.09, 8, 8);
      const head = new THREE.Mesh(headGeo, bodyMat);
      head.position.set(0.35, 0.08, 0);
      horse.add(head);

      // Snout
      const snoutGeo = new THREE.ConeGeometry(0.05, 0.12, 6);
      const snout = new THREE.Mesh(snoutGeo, bodyMat);
      snout.position.set(0.45, 0.06, 0);
      snout.rotation.z = -Math.PI / 2;
      horse.add(snout);

      // Mane
      const maneGeo = new THREE.BoxGeometry(0.2, 0.08, 0.06);
      const mane = new THREE.Mesh(maneGeo, maneMat);
      mane.position.set(0.15, 0.15, 0);
      horse.add(mane);

      // Legs (4 per horse)
      const legGeo = new THREE.CylinderGeometry(0.025, 0.02, 0.25, 4);
      const legMat = createToonMaterial(0xfff0d0);
      const legs = [];
      const legOffsets = [
        { x: 0.15, z: -0.08 },
        { x: 0.15, z: 0.08 },
        { x: -0.15, z: -0.08 },
        { x: -0.15, z: 0.08 },
      ];
      legOffsets.forEach((lo) => {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(lo.x, -0.2, lo.z);
        horse.add(leg);
        legs.push(leg);
      });
      this.legSets.push(legs);

      // Wings (pair per horse)
      const wingShape = new THREE.Shape();
      wingShape.moveTo(0, 0);
      wingShape.lineTo(0.3, 0.2);
      wingShape.lineTo(0.25, 0.45);
      wingShape.lineTo(0.1, 0.35);
      wingShape.lineTo(0, 0.15);
      wingShape.lineTo(0, 0);
      const wingGeo = new THREE.ShapeGeometry(wingShape);

      const wingL = new THREE.Mesh(wingGeo, wingMat);
      wingL.position.set(0, 0.1, -0.15);
      wingL.rotation.x = -0.4;
      horse.add(wingL);

      const wingR = new THREE.Mesh(wingGeo, wingMat);
      wingR.position.set(0, 0.1, 0.15);
      wingR.rotation.x = 0.4;
      wingR.scale.z = -1;
      horse.add(wingR);

      this.wingPairs.push({ left: wingL, right: wingR });

      horse.position.set(pos.x, 0, pos.z);
      this.horses.push(horse);
      this.group.add(horse);
    });

    // Reins from chariot to horses
    const reinMat = createToonMaterial(0x8b6914);
    this.horses.forEach((horse) => {
      const reinGeo = new THREE.CylinderGeometry(0.01, 0.01, horse.position.x - 0.5, 4);
      const rein = new THREE.Mesh(reinGeo, reinMat);
      rein.rotation.z = Math.PI / 2;
      rein.position.set((horse.position.x + 0.5) / 2, 0.05, horse.position.z * 0.6);
      this.group.add(rein);
    });
  }

  _buildPhaethon() {
    const phaethon = new THREE.Group();

    // Body (robe)
    const bodyGeo = new THREE.CapsuleGeometry(0.08, 0.25, 4, 8);
    const robeMat = createToonMaterial(0xff6600);
    const body = new THREE.Mesh(bodyGeo, robeMat);
    body.position.y = 0.25;
    phaethon.add(body);

    // Head
    const headGeo = new THREE.SphereGeometry(0.07, 8, 8);
    const skinMat = createToonMaterial(0xffdbac);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 0.48;
    phaethon.add(head);

    // Hair
    const hairGeo = new THREE.SphereGeometry(0.075, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.6);
    const hairMat = createToonMaterial(0x3d1c00);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 0.5;
    phaethon.add(hair);

    // Sun crown / halo
    const crownGeo = new THREE.TorusGeometry(0.12, 0.015, 8, 24);
    const crownMat = createToonMaterial(0xffdd00, { emissive: 0xffaa00, emissiveIntensity: 0.5 });
    const crown = new THREE.Mesh(crownGeo, crownMat);
    crown.position.y = 0.56;
    crown.rotation.x = Math.PI / 2;
    phaethon.add(crown);

    // Crown rays
    for (let i = 0; i < 8; i++) {
      const rayGeo = new THREE.ConeGeometry(0.015, 0.1, 4);
      const ray = new THREE.Mesh(rayGeo, crownMat);
      const angle = (i / 8) * Math.PI * 2;
      ray.position.set(
        Math.cos(angle) * 0.12,
        0.56,
        Math.sin(angle) * 0.12
      );
      ray.rotation.z = -angle + Math.PI / 2;
      ray.rotation.x = Math.PI / 2;
      phaethon.add(ray);
    }

    // Arms (extended forward holding reins)
    const armGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 4);
    const armMat = createToonMaterial(0xffdbac);
    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(armGeo, armMat);
      arm.position.set(0.2, 0.3, side * 0.08);
      arm.rotation.z = Math.PI / 2.5;
      phaethon.add(arm);
    }

    phaethon.position.set(-0.2, 0.08, 0);
    this.phaethon = phaethon;
    this.group.add(phaethon);
  }

  _buildSunGlow() {
    // Point light on the chariot (it IS the sun)
    this.sunPointLight = new THREE.PointLight(0xffdd44, 2, 30);
    this.sunPointLight.position.set(0, 0.5, 0);
    this.group.add(this.sunPointLight);

    // Glow sphere
    const glowGeo = new THREE.SphereGeometry(1.5, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffaa33,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    });
    this.sunGlow = new THREE.Mesh(glowGeo, glowMat);
    this.sunGlow.position.y = 0.3;
    this.group.add(this.sunGlow);
  }

  update(orbitState, delta) {
    this.elapsed += delta;

    // Position chariot on orbit
    const x = Math.cos(orbitState.angle) * orbitState.altitude;
    const y = Math.sin(orbitState.angle) * orbitState.altitude;
    const z = orbitState.lateralOffset || 0;
    this.group.position.set(x, y, z);

    // Orient chariot tangent to orbit (facing forward).
    // X=π base flip makes local +Y point radially outward (head toward sky, not Earth).
    const tangentAngle = orbitState.angle + Math.PI / 2;
    this.group.rotation.x = Math.PI + (orbitState.lateralVelocity || 0) * 0.3;
    this.group.rotation.y = -(orbitState.velocityAlt || 0) * 0.02;
    this.group.rotation.z = tangentAngle;

    // Animate horse legs (gallop)
    this.legSets.forEach((legs, horseIdx) => {
      const phase = horseIdx * 0.5;
      legs.forEach((leg, legIdx) => {
        const legPhase = legIdx < 2 ? 0 : Math.PI;
        leg.rotation.x = Math.sin(this.elapsed * 8 + phase + legPhase) * 0.4;
      });
    });

    // Animate wings (flap)
    this.wingPairs.forEach((pair, idx) => {
      const flapAngle = Math.sin(this.elapsed * 3 + idx * 0.7) * 0.3;
      pair.left.rotation.x = -0.4 + flapAngle;
      pair.right.rotation.x = 0.4 - flapAngle;
    });

    // Spin wheels
    if (this.wheelL) this.wheelL.rotation.z += delta * 5;
    if (this.wheelR) this.wheelR.rotation.z += delta * 5;

    // Pulse sun glow
    const pulse = 1 + Math.sin(this.elapsed * 2) * 0.15;
    this.sunGlow.scale.setScalar(pulse);
  }

  getWorldPosition() {
    return this.group.position.clone();
  }
}
