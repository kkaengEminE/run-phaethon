import * as THREE from 'three';
import { Renderer } from './Renderer.js';
import { InputManager } from './InputManager.js';
import { EarthScene } from '../scene/EarthScene.js';
import { ChariotModel } from '../scene/ChariotModel.js';
import { GroundObjects } from '../scene/GroundObjects.js';
import { ZeusModel } from '../scene/ZeusModel.js';
import { FireEffect } from '../scene/FireEffect.js';
import { OrbitPhysics } from '../systems/OrbitPhysics.js';
import { CameraSystem } from '../systems/CameraSystem.js';
import { DamageSystem } from '../systems/DamageSystem.js';
import { ZeusSystem } from '../systems/ZeusSystem.js';
import { HUD } from '../ui/HUD.js';
import { GameScreens } from '../ui/GameScreens.js';

const EARTH_RADIUS = 20;

const State = {
  TITLE: 'TITLE',
  PLAYING: 'PLAYING',
  WIN: 'WIN',
  LOSE_CRASH: 'LOSE_CRASH',
  LOSE_ZEUS: 'LOSE_ZEUS',
};

export class Game {
  constructor() {
    const canvas = document.getElementById('game-canvas');
    this.renderer = new Renderer(canvas);
    this.input = new InputManager();
    this.clock = new THREE.Clock();

    const { scene, camera } = this.renderer;

    // Scene elements
    this.earth = new EarthScene(scene);
    this.chariot = new ChariotModel(scene);
    this.groundObjects = new GroundObjects(scene);
    this.zeusModel = new ZeusModel(scene);
    this.fireEffect = new FireEffect(scene);

    // Reparent Zeus as a camera child so he sits like an always-visible
    // satellite in the upper-left of the viewport regardless of orbit angle.
    scene.add(camera);
    this.zeusModel.group.removeFromParent();
    camera.add(this.zeusModel.group);
    this.zeusModel.group.position.set(-7, 5, -14);
    this.zeusModel.group.scale.setScalar(2.5);
    this.zeusModel.group.visible = false;

    // Systems
    this.physics = new OrbitPhysics();
    this.cameraSystem = new CameraSystem(camera);
    this.damageSystem = new DamageSystem();
    this.zeusSystem = new ZeusSystem(scene, this.zeusModel, this.renderer.bloomPass);

    // UI
    this.hud = new HUD();
    this.screens = new GameScreens();

    // State
    this.state = State.TITLE;
    this.playTime = 0;
    this.fireSpawnTimer = 0;
  }

  start() {
    this.screens.showTitle();
    this.hud.hide();

    // Set initial camera to look at Earth
    this.renderer.camera.position.set(0, 0, 45);
    this.renderer.camera.lookAt(0, 0, 0);

    this._loop();
  }

  _loop() {
    requestAnimationFrame(() => this._loop());

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    switch (this.state) {
      case State.TITLE:
        this._updateTitle(delta, elapsed);
        break;
      case State.PLAYING:
        this._updatePlaying(delta, elapsed);
        break;
      case State.WIN:
      case State.LOSE_CRASH:
      case State.LOSE_ZEUS:
        this._updateGameOver(delta, elapsed);
        break;
    }

    this.renderer.render();
    this.input.update();
  }

  _updateTitle(delta, elapsed) {
    // Gentle camera orbit for title screen
    const angle = elapsed * 0.1;
    this.renderer.camera.position.set(
      Math.cos(angle) * 45,
      Math.sin(angle * 0.5) * 10 + 10,
      Math.sin(angle) * 45
    );
    this.renderer.camera.up.set(0, 1, 0);
    this.renderer.camera.lookAt(0, 0, 0);

    // Earth lighting update
    this.earth.update(this.renderer.camera.position, elapsed);

    if (this.input.wasPressed('Space')) {
      this._startGame();
    }
  }

  _startGame() {
    this.state = State.PLAYING;
    this.playTime = 0;

    this.physics.reset();
    this.damageSystem.reset();
    this.zeusSystem.reset();
    this.fireEffect.reset();
    this.groundObjects.reset();

    const orbitState = this.physics.getState();
    this.cameraSystem.reset(orbitState);

    this.zeusModel.group.visible = true;

    this.screens.hideAll();
    this.hud.show();
  }

  _updatePlaying(delta, elapsed) {
    // Physics
    this.physics.update(delta, this.input);
    const orbitState = this.physics.getState();

    // Update chariot model position
    this.chariot.update(orbitState, delta);
    const chariotPos = this.chariot.getWorldPosition();

    // Camera
    this.cameraSystem.update(orbitState, delta);

    // Earth lighting follows chariot (chariot = sun)
    this.earth.update(chariotPos, elapsed);

    // Damage system
    this.damageSystem.update(orbitState.altitude, delta);
    const damageState = this.damageSystem.getState();

    // Fire effects when damaging
    if (damageState.damageRate > 0) {
      this.fireSpawnTimer += delta;
      const spawnRate = 0.05 + (1 - damageState.damageRate / 30) * 0.15;
      if (this.fireSpawnTimer >= spawnRate) {
        this.fireSpawnTimer = 0;
        // Spawn fire at ground below chariot
        const groundPos = chariotPos.clone().normalize().multiplyScalar(EARTH_RADIUS + 0.5);
        this.fireEffect.spawn(groundPos, Math.ceil(damageState.damageRate / 5));

        // Burn nearby ground objects
        this.groundObjects.burnNearbyObjects(orbitState.angle, 0.3);
      }
    }
    this.fireEffect.update(delta);

    // Zeus system
    this.zeusModel.update(damageState.zeusAnger, delta);
    this.zeusSystem.update(damageState, chariotPos, delta);

    // HUD
    this.hud.update(orbitState, damageState);

    // Track play time
    this.playTime += delta;

    // Check win/lose
    if (orbitState.orbitComplete) {
      this.state = State.WIN;
      this.hud.hide();
      this.screens.showWin({
        damage: damageState.totalDamage,
        time: this.playTime,
      });
    } else if (orbitState.crashed) {
      this.state = State.LOSE_CRASH;
      this.hud.hide();
      this.screens.showLose('crash', {
        damage: damageState.totalDamage,
        progress: orbitState.orbitProgress,
      });
    } else if (this.zeusSystem.isStrikeComplete()) {
      this.state = State.LOSE_ZEUS;
      this.hud.hide();
      this.screens.showLose('zeus', {
        damage: damageState.totalDamage,
        progress: orbitState.orbitProgress,
      });
    }

    // Screen shake during Zeus warning or bolt
    if (this.zeusSystem.isWarning() || this.zeusSystem.strikeAnimating) {
      const intensity = this.zeusSystem.strikeAnimating ? 0.3 : 0.1;
      this.renderer.camera.position.x += (Math.random() - 0.5) * intensity;
      this.renderer.camera.position.y += (Math.random() - 0.5) * intensity;
    }
  }

  _updateGameOver(delta, elapsed) {
    // Keep rendering the scene but frozen
    this.earth.update(this.chariot.getWorldPosition(), elapsed);
    this.fireEffect.update(delta);

    if (this.input.wasPressed('Space')) {
      this._startGame();
    }
  }
}
