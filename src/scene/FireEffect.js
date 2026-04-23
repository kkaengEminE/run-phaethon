import * as THREE from 'three';

const MAX_PARTICLES = 300;

export class FireEffect {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.spawnTimer = 0;

    // Create particle system
    this.positions = new Float32Array(MAX_PARTICLES * 3);
    this.colors = new Float32Array(MAX_PARTICLES * 3);
    this.sizes = new Float32Array(MAX_PARTICLES);
    this.ages = new Float32Array(MAX_PARTICLES);
    this.lifetimes = new Float32Array(MAX_PARTICLES);
    this.velocities = [];
    this.activeCount = 0;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.ages[i] = -1; // inactive
      this.lifetimes[i] = 1;
      this.velocities.push(new THREE.Vector3());
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
    geo.setAttribute('size', new THREE.Float32BufferAttribute(this.sizes, 1));

    const mat = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(geo, mat);
    scene.add(this.points);
  }

  spawn(position, count) {
    for (let n = 0; n < count; n++) {
      // Find inactive particle
      let idx = -1;
      for (let i = 0; i < MAX_PARTICLES; i++) {
        if (this.ages[i] < 0) {
          idx = i;
          break;
        }
      }
      if (idx === -1) return;

      const outDir = position.clone().normalize();

      this.positions[idx * 3] = position.x + (Math.random() - 0.5) * 0.5;
      this.positions[idx * 3 + 1] = position.y + (Math.random() - 0.5) * 0.5;
      this.positions[idx * 3 + 2] = position.z + (Math.random() - 0.5) * 0.5;

      // Velocity: outward from Earth + some random spread
      this.velocities[idx].copy(outDir).multiplyScalar(1.5 + Math.random() * 2);
      this.velocities[idx].x += (Math.random() - 0.5) * 0.5;
      this.velocities[idx].y += (Math.random() - 0.5) * 0.5;
      this.velocities[idx].z += (Math.random() - 0.5) * 0.5;

      this.ages[idx] = 0;
      this.lifetimes[idx] = 0.5 + Math.random() * 1.5;
      this.sizes[idx] = 0.2 + Math.random() * 0.3;

      // Start color: yellow
      this.colors[idx * 3] = 1;
      this.colors[idx * 3 + 1] = 0.8;
      this.colors[idx * 3 + 2] = 0.2;
    }
  }

  update(delta) {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (this.ages[i] < 0) continue;

      this.ages[i] += delta;
      const t = this.ages[i] / this.lifetimes[i];

      if (t >= 1) {
        this.ages[i] = -1;
        this.positions[i * 3] = 0;
        this.positions[i * 3 + 1] = 0;
        this.positions[i * 3 + 2] = 0;
        this.sizes[i] = 0;
        continue;
      }

      // Move
      this.positions[i * 3] += this.velocities[i].x * delta;
      this.positions[i * 3 + 1] += this.velocities[i].y * delta;
      this.positions[i * 3 + 2] += this.velocities[i].z * delta;

      // Color: yellow → orange → red → dark
      if (t < 0.3) {
        this.colors[i * 3] = 1;
        this.colors[i * 3 + 1] = 0.8 - t * 2;
        this.colors[i * 3 + 2] = 0.2 * (1 - t * 3);
      } else if (t < 0.6) {
        this.colors[i * 3] = 1 - (t - 0.3) * 2;
        this.colors[i * 3 + 1] = 0.2 * (1 - (t - 0.3) * 3);
        this.colors[i * 3 + 2] = 0;
      } else {
        this.colors[i * 3] = 0.4 * (1 - t);
        this.colors[i * 3 + 1] = 0;
        this.colors[i * 3 + 2] = 0;
      }

      // Fade size
      this.sizes[i] *= (1 - delta * 0.5);
    }

    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;
    this.points.geometry.attributes.size.needsUpdate = true;
  }

  reset() {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.ages[i] = -1;
      this.sizes[i] = 0;
      this.positions[i * 3] = 0;
      this.positions[i * 3 + 1] = 0;
      this.positions[i * 3 + 2] = 0;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.size.needsUpdate = true;
  }
}
