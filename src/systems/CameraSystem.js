import * as THREE from 'three';
import { lerp } from '../utils/math.js';

const FOLLOW_BEHIND = 0.2; // radians behind chariot
const FOLLOW_HEIGHT = 5;
const LOOK_AHEAD = 0.12; // radians ahead of chariot
const SMOOTH_SPEED = 3.5;

export class CameraSystem {
  constructor(camera) {
    this.camera = camera;
    this.currentPos = new THREE.Vector3(0, 30, 10);
    this.currentLookAt = new THREE.Vector3(0, 0, 0);
    this.targetPos = new THREE.Vector3();
    this.targetLookAt = new THREE.Vector3();
  }

  update(orbitState, delta) {
    // Camera sits behind and above the chariot
    const behindAngle = orbitState.angle - FOLLOW_BEHIND;
    const camAltitude = orbitState.altitude + FOLLOW_HEIGHT;

    this.targetPos.set(
      Math.cos(behindAngle) * camAltitude,
      Math.sin(behindAngle) * camAltitude,
      (orbitState.lateralOffset || 0) * 0.4
    );

    // Look at a point ahead of chariot
    const aheadAngle = orbitState.angle + LOOK_AHEAD;
    this.targetLookAt.set(
      Math.cos(aheadAngle) * orbitState.altitude,
      Math.sin(aheadAngle) * orbitState.altitude,
      orbitState.lateralOffset || 0
    );

    // Smooth interpolation
    const t = Math.min(1, delta * SMOOTH_SPEED);
    this.currentPos.lerp(this.targetPos, t);
    this.currentLookAt.lerp(this.targetLookAt, t);

    this.camera.position.copy(this.currentPos);
    // Camera up follows radial outward so chariot orientation stays stable through orbit.
    this.camera.up.set(Math.cos(behindAngle), Math.sin(behindAngle), 0);
    this.camera.lookAt(this.currentLookAt);
  }

  reset(orbitState) {
    const behindAngle = orbitState.angle - FOLLOW_BEHIND;
    const camAltitude = orbitState.altitude + FOLLOW_HEIGHT;
    this.currentPos.set(
      Math.cos(behindAngle) * camAltitude,
      Math.sin(behindAngle) * camAltitude,
      0
    );
    this.currentLookAt.set(
      Math.cos(orbitState.angle) * orbitState.altitude,
      Math.sin(orbitState.angle) * orbitState.altitude,
      0
    );
    this.camera.position.copy(this.currentPos);
    this.camera.up.set(Math.cos(behindAngle), Math.sin(behindAngle), 0);
    this.camera.lookAt(this.currentLookAt);
  }
}
