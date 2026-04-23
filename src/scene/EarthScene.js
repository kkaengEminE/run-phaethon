import * as THREE from 'three';
import { createToonMaterial } from '../utils/ToonMaterials.js';

const EARTH_RADIUS = 20;

export class EarthScene {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this._createEarth();
    this._createAtmosphere();
    this._createSkyDome();
    this._createStars();
    this._createLighting();
    scene.add(this.group);
  }

  _createEarth() {
    // Earth with toon-shaded custom look: green land patches on blue ocean
    const geo = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);

    const earthMat = new THREE.ShaderMaterial({
      uniforms: {
        uSunDir: { value: new THREE.Vector3(1, 0, 0) },
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        varying vec2 vUv;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uSunDir;
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        varying vec2 vUv;

        // Simple hash noise
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 4; i++) {
            v += a * noise(p);
            p *= 2.0;
            a *= 0.5;
          }
          return v;
        }

        void main() {
          // Land/ocean distribution
          float n = fbm(vUv * 8.0 + 0.5);
          float isLand = smoothstep(0.42, 0.48, n);

          // Base colors
          vec3 oceanColor = vec3(0.1, 0.35, 0.6);
          vec3 landGreen = vec3(0.2, 0.55, 0.15);
          vec3 landBrown = vec3(0.5, 0.35, 0.15);
          vec3 snowColor = vec3(0.9, 0.92, 0.95);

          // Biome variation
          float biome = fbm(vUv * 12.0 + 3.0);
          vec3 landColor = mix(landGreen, landBrown, smoothstep(0.4, 0.6, biome));

          // Polar snow caps
          float polar = abs(vUv.y - 0.5) * 2.0;
          landColor = mix(landColor, snowColor, smoothstep(0.75, 0.9, polar));
          oceanColor = mix(oceanColor, snowColor * 0.8, smoothstep(0.85, 0.95, polar));

          vec3 baseColor = mix(oceanColor, landColor, isLand);

          // Toon-stepped lighting (3 steps)
          float NdotL = dot(vNormal, normalize(uSunDir));
          float light;
          if (NdotL > 0.5) light = 1.0;
          else if (NdotL > -0.1) light = 0.6;
          else light = 0.3;

          vec3 color = baseColor * light;

          // Atmosphere rim
          vec3 viewDir = normalize(cameraPosition - vWorldPos);
          float rim = 1.0 - max(dot(viewDir, vNormal), 0.0);
          rim = pow(rim, 3.0);
          color += vec3(0.3, 0.5, 1.0) * rim * 0.5;

          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });

    this.earthMesh = new THREE.Mesh(geo, earthMat);
    this.group.add(this.earthMesh);
  }

  _createAtmosphere() {
    const geo = new THREE.SphereGeometry(EARTH_RADIUS * 1.02, 48, 48);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uSunDir: { value: new THREE.Vector3(1, 0, 0) },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uSunDir;
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        void main() {
          vec3 viewDir = normalize(cameraPosition - vWorldPos);
          float rim = 1.0 - max(dot(viewDir, vNormal), 0.0);
          rim = pow(rim, 4.0);

          float sunFacing = max(dot(vNormal, normalize(uSunDir)), 0.0);
          vec3 color = mix(vec3(0.2, 0.4, 0.8), vec3(0.6, 0.8, 1.0), sunFacing);

          gl_FragColor = vec4(color, rim * 0.4);
        }
      `,
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: false,
    });
    this.atmosphereMesh = new THREE.Mesh(geo, mat);
    this.group.add(this.atmosphereMesh);
  }

  _createSkyDome() {
    const geo = new THREE.SphereGeometry(200, 32, 32);
    const mat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vWorldPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vWorldPos;
        void main() {
          float y = normalize(vWorldPos).y;
          vec3 top = vec3(0.02, 0.02, 0.08);
          vec3 mid = vec3(0.05, 0.05, 0.15);
          vec3 bot = vec3(0.08, 0.04, 0.12);
          vec3 color = mix(bot, mid, smoothstep(-0.3, 0.2, y));
          color = mix(color, top, smoothstep(0.2, 0.8, y));
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });
    this.group.add(new THREE.Mesh(geo, mat));
  }

  _createStars() {
    const count = 2000;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 150 + Math.random() * 40;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      sizes[i] = 0.5 + Math.random() * 1.5;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.8,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8,
    });
    this.group.add(new THREE.Points(geo, mat));
  }

  _createLighting() {
    // Ambient for base illumination
    this.ambientLight = new THREE.AmbientLight(0x404060, 0.3);
    this.scene.add(this.ambientLight);

    // Directional light follows the chariot (the sun)
    this.sunLight = new THREE.DirectionalLight(0xffeecc, 1.5);
    this.sunLight.position.set(1, 0, 0);
    this.scene.add(this.sunLight);
  }

  update(chariotPosition, elapsed) {
    // Update sun direction to match chariot position (chariot IS the sun)
    if (chariotPosition) {
      const sunDir = chariotPosition.clone().normalize();
      this.sunLight.position.copy(sunDir.multiplyScalar(50));
      this.earthMesh.material.uniforms.uSunDir.value.copy(chariotPosition).normalize();
      this.atmosphereMesh.material.uniforms.uSunDir.value.copy(chariotPosition).normalize();
    }
    this.earthMesh.material.uniforms.uTime.value = elapsed;
  }
}
