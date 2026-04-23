import { clamp } from '../utils/math.js';

const EARTH_RADIUS = 20;
const START_ALTITUDE = 30;
const MIN_ALTITUDE = EARTH_RADIUS;
const MAX_ALTITUDE = 38;
const DANGER_ALTITUDE = 27;

const GRAVITY = 6.0;
const JUMP_FORCE = 4.5;
const JUMP_COOLDOWN = 0.15;
const STEER_ALT_FORCE = 8.0;
const BASE_ANGULAR_SPEED = 0.25;
const TURN_ACCEL = 0.12;
const MAX_ANGULAR_SPEED = 0.45;
const MIN_ANGULAR_SPEED = 0.12;
const ANGULAR_DRAG = 1.5;
const ALT_DRAG = 0.8;
const LATERAL_FORCE = 3.0;
const LATERAL_DRAG = 2.0;
const MAX_LATERAL = 3.0;

// Horse bolting
const BOLT_MIN_INTERVAL = 8;
const BOLT_MAX_INTERVAL = 18;
const BOLT_MIN_DURATION = 0.8;
const BOLT_MAX_DURATION = 2.5;
const BOLT_FORCE = 6.0;

export class OrbitPhysics {
  constructor() {
    this.reset();
  }

  reset() {
    this.angle = 0;
    this.startAngle = 0;
    this.altitude = START_ALTITUDE;
    this.velocityAngle = BASE_ANGULAR_SPEED;
    this.velocityAlt = 0;
    this.lateralOffset = 0;
    this.lateralVelocity = 0;
    this.orbitComplete = false;
    this.crashed = false;
    this.jumpCooldown = 0;
    this.orbitProgress = 0;
    this.totalAngleTraveled = 0;

    // Horse bolting state
    this.boltTimer = this._nextBoltInterval();
    this.bolting = false;
    this.boltDuration = 0;
    this.boltTimeLeft = 0;
    this.boltAltForce = 0;
    this.boltLateralForce = 0;
    this.boltAngularForce = 0;
  }

  _nextBoltInterval() {
    return BOLT_MIN_INTERVAL + Math.random() * (BOLT_MAX_INTERVAL - BOLT_MIN_INTERVAL);
  }

  update(delta, input) {
    if (this.orbitComplete || this.crashed) return;

    // Clamp delta to prevent physics explosion on tab-switch
    delta = Math.min(delta, 0.05);

    // --- Jump (spacebar) ---
    this.jumpCooldown -= delta;
    if (input.wasPressed('Space') && this.jumpCooldown <= 0) {
      this.velocityAlt += JUMP_FORCE;
      this.jumpCooldown = JUMP_COOLDOWN;
    }

    // --- Up/Down steering ---
    if (input.isDown('ArrowUp')) {
      this.velocityAlt += STEER_ALT_FORCE * delta;
    }
    if (input.isDown('ArrowDown')) {
      this.velocityAlt -= STEER_ALT_FORCE * delta * 0.5;
    }

    // --- Left/Right steering (orbital speed) ---
    if (input.isDown('ArrowLeft')) {
      this.lateralVelocity -= LATERAL_FORCE * delta;
    }
    if (input.isDown('ArrowRight')) {
      this.lateralVelocity += LATERAL_FORCE * delta;
    }

    // --- Horse bolting ---
    this._updateBolting(delta);

    // --- Gravity (always pulls toward Earth center = lowers altitude) ---
    this.velocityAlt -= GRAVITY * delta;

    // --- Drag ---
    this.velocityAlt *= (1 - ALT_DRAG * delta);
    this.velocityAngle += (BASE_ANGULAR_SPEED - this.velocityAngle) * ANGULAR_DRAG * delta;
    this.lateralVelocity *= (1 - LATERAL_DRAG * delta);

    // --- Integration ---
    this.altitude += this.velocityAlt * delta;
    this.angle += this.velocityAngle * delta;
    this.lateralOffset += this.lateralVelocity * delta;

    // --- Clamp angular speed ---
    this.velocityAngle = clamp(this.velocityAngle, MIN_ANGULAR_SPEED, MAX_ANGULAR_SPEED);

    // --- Clamp lateral offset ---
    this.lateralOffset = clamp(this.lateralOffset, -MAX_LATERAL, MAX_LATERAL);

    // --- Altitude soft ceiling ---
    if (this.altitude > MAX_ALTITUDE) {
      this.velocityAlt -= (this.altitude - MAX_ALTITUDE) * 2 * delta;
    }

    // --- Check crash ---
    if (this.altitude <= MIN_ALTITUDE) {
      this.altitude = MIN_ALTITUDE;
      this.crashed = true;
      return;
    }

    // --- Orbit progress ---
    this.totalAngleTraveled = this.angle - this.startAngle;
    this.orbitProgress = clamp(this.totalAngleTraveled / (Math.PI * 2), 0, 1);

    if (this.totalAngleTraveled >= Math.PI * 2) {
      this.orbitComplete = true;
    }
  }

  _updateBolting(delta) {
    if (this.bolting) {
      this.boltTimeLeft -= delta;
      this.velocityAlt += this.boltAltForce * delta;
      this.lateralVelocity += this.boltLateralForce * delta;
      this.velocityAngle += this.boltAngularForce * delta;

      if (this.boltTimeLeft <= 0) {
        this.bolting = false;
        this.boltTimer = this._nextBoltInterval() * (1 - this.orbitProgress * 0.5);
      }
    } else {
      this.boltTimer -= delta;
      if (this.boltTimer <= 0) {
        this.bolting = true;
        this.boltDuration = BOLT_MIN_DURATION + Math.random() * (BOLT_MAX_DURATION - BOLT_MIN_DURATION);
        this.boltTimeLeft = this.boltDuration;

        // Random bolt direction
        this.boltAltForce = (Math.random() - 0.5) * BOLT_FORCE * 2;
        this.boltLateralForce = (Math.random() - 0.5) * BOLT_FORCE;
        this.boltAngularForce = (Math.random() - 0.5) * 0.1;
      }
    }
  }

  getState() {
    return {
      angle: this.angle,
      altitude: this.altitude,
      velocityAngle: this.velocityAngle,
      velocityAlt: this.velocityAlt,
      lateralOffset: this.lateralOffset,
      lateralVelocity: this.lateralVelocity,
      orbitProgress: this.orbitProgress,
      orbitComplete: this.orbitComplete,
      crashed: this.crashed,
      bolting: this.bolting,
      dangerZone: this.altitude < DANGER_ALTITUDE,
    };
  }
}
