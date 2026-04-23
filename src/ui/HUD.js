export class HUD {
  constructor() {
    this.hud = document.getElementById('hud');
    this.orbitBar = document.getElementById('orbit-bar');
    this.orbitText = document.getElementById('orbit-text');
    this.damageFill = document.getElementById('damage-fill');
    this.zeusFace = document.getElementById('zeus-face');
    this.altitudeText = document.getElementById('altitude-text');
  }

  show() {
    this.hud.style.display = 'block';
  }

  hide() {
    this.hud.style.display = 'none';
  }

  update(orbitState, damageState) {
    // Orbit progress
    const pct = Math.floor(orbitState.orbitProgress * 100);
    this.orbitBar.style.width = pct + '%';
    this.orbitText.textContent = pct + '%';

    // Damage meter
    const dmgPct = Math.floor(damageState.zeusAnger * 100);
    this.damageFill.style.height = dmgPct + '%';

    // Zeus face
    const anger = damageState.zeusAnger;
    if (anger < 0.15) {
      this.zeusFace.textContent = '😐';
      this.zeusFace.style.transform = '';
    } else if (anger < 0.4) {
      this.zeusFace.textContent = '😠';
      this.zeusFace.style.transform = '';
    } else if (anger < 0.7) {
      this.zeusFace.textContent = '😡';
      this.zeusFace.style.transform = '';
    } else if (anger < 0.9) {
      this.zeusFace.textContent = '🤬';
      this.zeusFace.style.transform = `rotate(${Math.sin(Date.now() * 0.02) * 5}deg)`;
    } else {
      this.zeusFace.textContent = '⚡';
      this.zeusFace.style.transform = `scale(${1 + Math.sin(Date.now() * 0.05) * 0.2})`;
    }

    // Altitude indicator
    const alt = orbitState.altitude;
    if (alt < 24) {
      this.altitudeText.textContent = 'DANGER';
      this.altitudeText.style.background = 'rgba(200, 0, 0, 0.7)';
      this.altitudeText.style.borderColor = 'rgba(255, 0, 0, 0.5)';
    } else if (alt < 28) {
      this.altitudeText.textContent = 'CAUTION';
      this.altitudeText.style.background = 'rgba(180, 150, 0, 0.7)';
      this.altitudeText.style.borderColor = 'rgba(255, 200, 0, 0.5)';
    } else {
      this.altitudeText.textContent = 'SAFE';
      this.altitudeText.style.background = 'rgba(0, 100, 0, 0.6)';
      this.altitudeText.style.borderColor = 'rgba(0, 255, 0, 0.3)';
    }

    // Warning flash
    if (damageState.zeusAnger >= 0.9) {
      this.hud.style.borderColor = `rgba(255, 0, 0, ${0.3 + Math.sin(Date.now() * 0.01) * 0.3})`;
    }
  }
}
