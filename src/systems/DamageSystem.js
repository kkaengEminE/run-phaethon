import { clamp, smoothstep } from '../utils/math.js';

const DANGER_ALTITUDE = 27;
const SCORCH_ALTITUDE = 22;
const MAX_DAMAGE_RATE = 30; // damage per second at lowest point
const ZEUS_THRESHOLD = 100;

export class DamageSystem {
  constructor() {
    this.reset();
  }

  reset() {
    this.totalDamage = 0;
    this.damageRate = 0;
    this.zeusAnger = 0;
  }

  update(altitude, delta) {
    if (altitude < DANGER_ALTITUDE) {
      const severity = 1 - clamp(
        (altitude - SCORCH_ALTITUDE) / (DANGER_ALTITUDE - SCORCH_ALTITUDE),
        0, 1
      );
      this.damageRate = severity * MAX_DAMAGE_RATE;
      this.totalDamage += this.damageRate * delta;
    } else {
      this.damageRate = 0;
    }

    this.zeusAnger = clamp(this.totalDamage / ZEUS_THRESHOLD, 0, 1);
  }

  getState() {
    return {
      totalDamage: this.totalDamage,
      damageRate: this.damageRate,
      zeusAnger: this.zeusAnger,
      zeusStrike: this.zeusAnger >= 1,
      dangerAltitude: DANGER_ALTITUDE,
    };
  }
}
