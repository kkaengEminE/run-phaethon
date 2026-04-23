import * as THREE from 'three';
import { createToonMaterial } from '../utils/ToonMaterials.js';

export class ZeusModel {
  constructor(scene) {
    this.group = new THREE.Group();
    this.scene = scene;

    this._buildClouds();
    this._buildZeus();

    // Position Zeus high above Earth at a fixed location
    this.group.position.set(-15, 35, 5);
    this.group.scale.setScalar(1.2);
    scene.add(this.group);

    this.anger = 0;
    this.shakeTime = 0;
  }

  _buildClouds() {
    const cloudMat = createToonMaterial(0xcccccc, { transparent: true, opacity: 0.85 });
    const darkCloudMat = createToonMaterial(0x666666, { transparent: true, opacity: 0.85 });

    this.cloudMeshes = [];
    const positions = [
      [0, 0, 0, 1.2],
      [-0.8, 0.2, 0.3, 0.8],
      [0.9, -0.1, -0.2, 0.9],
      [-0.3, 0.4, -0.5, 0.7],
      [0.5, 0.3, 0.4, 0.6],
      [-1.2, -0.2, 0.1, 0.5],
      [1.3, 0.1, 0.2, 0.5],
    ];

    positions.forEach(([x, y, z, s]) => {
      const geo = new THREE.SphereGeometry(s, 8, 8);
      const mesh = new THREE.Mesh(geo, cloudMat.clone());
      mesh.position.set(x, y, z);
      this.cloudMeshes.push(mesh);
      this.group.add(mesh);
    });

    this.cloudMat = cloudMat;
    this.darkCloudMat = darkCloudMat;
  }

  _buildZeus() {
    const zeus = new THREE.Group();

    // Body/robe
    const robeMat = createToonMaterial(0xeeeeff);
    const robeGeo = new THREE.CapsuleGeometry(0.2, 0.5, 4, 8);
    const robe = new THREE.Mesh(robeGeo, robeMat);
    robe.position.y = 0.5;
    zeus.add(robe);

    // Head
    const skinMat = createToonMaterial(0xffdbac);
    const headGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 0.9;
    zeus.add(head);

    // Beard
    const beardMat = createToonMaterial(0xcccccc);
    const beardGeo = new THREE.ConeGeometry(0.12, 0.2, 6);
    const beard = new THREE.Mesh(beardGeo, beardMat);
    beard.position.set(0, 0.75, 0.08);
    beard.rotation.x = 0.2;
    zeus.add(beard);

    // Laurel crown
    const crownMat = createToonMaterial(0xffd700);
    const crownGeo = new THREE.TorusGeometry(0.12, 0.02, 6, 16);
    const crown = new THREE.Mesh(crownGeo, crownMat);
    crown.position.y = 1.0;
    crown.rotation.x = Math.PI / 2;
    zeus.add(crown);

    // Right arm (raises when angry)
    const armGeo = new THREE.CylinderGeometry(0.04, 0.03, 0.35, 6);
    this.rightArm = new THREE.Mesh(armGeo, skinMat);
    this.rightArm.position.set(0.25, 0.65, 0);
    this.rightArm.geometry.translate(0, 0.175, 0); // pivot at shoulder
    zeus.add(this.rightArm);

    // Lightning bolt in hand (small static prop)
    const boltGroup = new THREE.Group();
    const boltMat = new THREE.MeshBasicMaterial({ color: 0xffff88 });
    const boltGeo = new THREE.ConeGeometry(0.03, 0.25, 4);
    const bolt1 = new THREE.Mesh(boltGeo, boltMat);
    bolt1.position.y = 0.35;
    boltGroup.add(bolt1);
    const bolt2 = new THREE.Mesh(boltGeo, boltMat);
    bolt2.position.y = 0.15;
    bolt2.rotation.z = Math.PI;
    bolt2.scale.set(0.7, 0.7, 0.7);
    boltGroup.add(bolt2);

    this.boltProp = boltGroup;
    this.boltProp.visible = false;
    this.rightArm.add(this.boltProp);

    zeus.position.y = 0.5;
    this.zeusBody = zeus;
    this.group.add(zeus);
  }

  update(zeusAnger, delta) {
    this.anger = zeusAnger;
    this.shakeTime += delta;

    // Arm raise based on anger
    const armAngle = -this.anger * Math.PI * 0.6; // raise arm
    this.rightArm.rotation.z = armAngle;

    // Show bolt prop when anger > 50%
    this.boltProp.visible = this.anger > 0.5;

    // Cloud color: white → dark gray as anger increases
    this.cloudMeshes.forEach((mesh) => {
      const gray = 0.8 - this.anger * 0.6;
      mesh.material.color.setRGB(gray, gray, gray + 0.05);
    });

    // Shake when angry
    if (this.anger > 0.6) {
      const shakeIntensity = (this.anger - 0.6) * 0.15;
      this.zeusBody.position.x = Math.sin(this.shakeTime * 20) * shakeIntensity;
      this.zeusBody.position.z = Math.cos(this.shakeTime * 15) * shakeIntensity * 0.5;
    } else {
      this.zeusBody.position.x = 0;
      this.zeusBody.position.z = 0;
    }
  }

  getWorldPosition() {
    const pos = new THREE.Vector3();
    this.rightArm.getWorldPosition(pos);
    return pos;
  }
}
