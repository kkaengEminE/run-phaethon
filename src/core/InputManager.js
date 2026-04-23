export class InputManager {
  constructor() {
    this.keys = {};
    this.justPressed = {};
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  _onKeyDown(e) {
    if (!this.keys[e.code]) {
      this.justPressed[e.code] = true;
    }
    this.keys[e.code] = true;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
  }

  _onKeyUp(e) {
    this.keys[e.code] = false;
  }

  isDown(code) {
    return !!this.keys[code];
  }

  wasPressed(code) {
    return !!this.justPressed[code];
  }

  update() {
    this.justPressed = {};
  }
}
