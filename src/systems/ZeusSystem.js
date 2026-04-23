import * as THREE from 'three';
import { createLightningBolt } from '../utils/LightningBolt.js';

export class ZeusSystem {
  constructor(scene, zeusModel, bloomPass) {
    this.scene = scene;
    this.zeusModel = zeusModel;
    this.bloomPass = bloomPass;
    this.strikeTriggered = false;
    this.strikeAnimating = false;
    this.strikeProgress = 0;
    this.strikeDuration = 1.5;
    this.boltGroup = null;
    this.flashOverlay = null;
    this.warningTimer = 0;
    this.warningActive = false;
  }

  update(damageState, chariotPosition, delta) {
    if (this.strikeAnimating) {
      this._animateStrike(delta);
      return;
    }

    // Warning phase: anger near 100%
    if (damageState.zeusAnger >= 0.9 && !this.warningActive && !this.strikeTriggered) {
      this.warningActive = true;
      this.warningTimer = 1.5; // 1.5 second warning
    }

    if (this.warningActive) {
      this.warningTimer -= delta;
      // Screen shake during warning
      if (this.warningTimer <= 0) {
        this._startStrike(chariotPosition);
      }
    }

    // Check if strike should trigger
    if (damageState.zeusStrike && !this.strikeTriggered && !this.warningActive) {
      this.warningActive = true;
      this.warningTimer = 1.0;
    }
  }

  _startStrike(chariotPosition) {
    this.strikeTriggered = true;
    this.strikeAnimating = true;
    this.strikeProgress = 0;
    this.warningActive = false;

    // Create lightning bolt from Zeus to chariot
    const zeusPos = this.zeusModel.getWorldPosition();
    const { group } = createLightningBolt(zeusPos, chariotPosition.clone(), {
      generations: 7,
      maxOffset: 3,
      branchChance: 0.4,
      thickness: 0.12,
    });

    this.boltGroup = group;
    this.scene.add(this.boltGroup);

    // Boost bloom for flash effect
    if (this.bloomPass) {
      this.bloomPass.strength = 3.0;
    }
  }

  _animateStrike(delta) {
    this.strikeProgress += delta / this.strikeDuration;

    if (this.strikeProgress < 0.3) {
      // Flash phase - bolt is visible, bright
      if (this.boltGroup) {
        this.boltGroup.visible = true;
        // Flicker
        this.boltGroup.visible = Math.random() > 0.1;
      }
    } else if (this.strikeProgress < 0.7) {
      // Fade phase
      if (this.boltGroup) {
        this.boltGroup.traverse((child) => {
          if (child.isMesh && child.material.opacity !== undefined) {
            child.material.opacity *= 0.95;
          }
        });
      }
      // Return bloom to normal
      if (this.bloomPass) {
        this.bloomPass.strength = Math.max(0.6, this.bloomPass.strength * 0.9);
      }
    } else {
      // Cleanup
      if (this.boltGroup) {
        this.scene.remove(this.boltGroup);
        this.boltGroup = null;
      }
      if (this.bloomPass) {
        this.bloomPass.strength = 0.6;
      }
    }

    if (this.strikeProgress >= 1) {
      this.strikeAnimating = false;
    }
  }

  isStrikeComplete() {
    return this.strikeTriggered && !this.strikeAnimating;
  }

  isWarning() {
    return this.warningActive;
  }

  reset() {
    this.strikeTriggered = false;
    this.strikeAnimating = false;
    this.strikeProgress = 0;
    this.warningActive = false;
    this.warningTimer = 0;
    if (this.boltGroup) {
      this.scene.remove(this.boltGroup);
      this.boltGroup = null;
    }
    if (this.bloomPass) {
      this.bloomPass.strength = 0.6;
    }
  }
}
