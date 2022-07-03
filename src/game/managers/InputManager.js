import { EventManager } from 'mjolnir.js';

export default class InputManager {
  game;
  keyboardManager;
  pointerManager;

  events = [];
  activeKeys = {};

  constructor(game) {
    this.game = game;

    this.keyboardManager = new EventManager(document.getElementsByTagName('body')[0]);
    this.keyboardManager.on({
      keydown: (event) => this.onDown(event, event.key),
      keyup: (event) => this.onUp(event, event.key),
    });

    this.pointerManager = new EventManager(this.game.app.view);
    this.pointerManager.on({
      pointerdown: (event) => this.onDown(event, 'pointer'),
      pointerup: (event) => this.onUp(event, 'pointer'),
      swipeup: (event) => this.onDown(event, 'swipeup', false),
    });
  }

  onDown(event, key, setKeyActive = true) {
    this.events
      .filter((_event) => _event.keys.includes(key))
      .forEach((_event, index) => {
        if (setKeyActive && index === 0) {
          this.activeKeys[key] = true;
        }
        if (_event.onDown) {
          _event.onDown(event);
        }
      });
  }

  onUp(event, key) {
    this.events
      .filter((_event) => _event.keys.includes(key))
      .forEach((_event, index) => {
        if (index === 0) {
          this.activeKeys[key] = false;
        }
        if (_event.onUp) {
          _event.onUp(event);
        }
      });
  }

  on(
    event = {
      name: '',
      keys: [],
      onDown: () => {},
      onUp: () => {},
    }
  ) {
    this.events.push(event);
  }

  off(name) {
    this.events = this.events.filter((event) => event.name !== name);
  }

  isActive(name) {
    let active = false;
    const event = this.events.find((event) => event.name === name);
    if (event) {
      event.keys.forEach((key) => {
        if (this.activeKeys[key]) {
          active = true;
        }
      });
    }
    return active;
  }

  reset() {
    this.activeKeys = {};
  }
}
