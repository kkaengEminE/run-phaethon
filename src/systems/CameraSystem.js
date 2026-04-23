import * as THREE from 'three';

const FOLLOW_BEHIND = 0.2; // radians behind chariot
const FOLLOW_HEIGHT = 5;
const LOOK_AHEAD = 0.12; // radians ahead of chariot

export class CameraSystem {
  constructor(camera) {
    this.camera = camera;
  }

  _apply(orbitState) {
    const a = orbitState.angle;
    const alt = orbitState.altitude;
    const lat = orbitState.lateralOffset || 0;

    const behindAngle = a - FOLLOW_BEHIND;
    const camAltitude = alt + FOLLOW_HEIGHT;
    const aheadAngle = a + LOOK_AHEAD;

    this.camera.position.set(
      Math.cos(behindAngle) * camAltitude,
      Math.sin(behindAngle) * camAltitude,
      lat * 0.4
    );

    // Camera up = chariot's up (radial outward at chariot's angle).
    // This keeps the chariot visually fixed upright across the whole orbit.
    this.camera.up.set(Math.cos(a), Math.sin(a), 0);

    this.camera.lookAt(
      Math.cos(aheadAngle) * alt,
      Math.sin(aheadAngle) * alt,
      lat
    );
  }

  update(orbitState, delta) {
    this._apply(orbitState);
  }

  reset(orbitState) {
    this._apply(orbitState);
  }
}
