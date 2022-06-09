import { EventManager } from 'mjolnir.js';

export default class InputManager {
  game;
  keyboardManager;
  pointerManager;

  names = [];
  downListeners = [];
  upListeners = [];
  pressed = {};

  constructor(game) {
    this.game = game;

    this.keyboardManager = new EventManager(document.getElementsByTagName('body')[0]);
    this.keyboardManager.on({
      keydown: (event) => {
        console.debug('keydown', event, this);
        if (!this.pressed[event.key]) {
          if (this.upListeners[event.key]) {
            this.pressed[event.key] = true;
            this.pressed[this.names[event.key]] = true;
          }
          if (this.downListeners[event.key]) {
            this.downListeners[event.key](event);
          }
        }
      },
      keyup: (event) => {
        console.debug('keyup', event, this);
        if (this.pressed[event.key]) {
          this.pressed[event.key] = false;
          this.pressed[this.names[event.key]] = false;
          if (this.upListeners[event.key]) {
            this.upListeners[event.key](event);
          }
        }
      },
    });

    this.pointerManager = new EventManager(this.game.app.view);
    this.pointerManager.on({
      pointerdown: (event) => {
        console.debug('pointerdown', event, this);
        if (!this.pressed['pointer']) {
          if (this.upListeners['pointer']) {
            this.pressed['pointer'] = true;
            this.pressed[this.names['pointer']] = true;
          }
          if (this.downListeners['pointer']) {
            this.downListeners['pointer'](event);
          }
        }
      },
      pointerup: (event) => {
        console.debug('pointerup', event, this);
        if (this.pressed['pointer']) {
          this.pressed['pointer'] = false;
          this.pressed[this.names['pointer']] = false;
          if (this.upListeners['pointer']) {
            this.upListeners['pointer'](event);
          }
        }
      },
      swipeup: (event) => {
        console.debug('swipeup', event, this);
        if (this.downListeners['swipeup']) {
          this.downListeners['swipeup'](event);
        }
      },
    });
  }

  on(eventName, subEventList, downListener, upListener = undefined) {
    subEventList.forEach((subEvent) => {
      this.names[subEvent] = eventName;
      if (downListener) {
        this.downListeners[subEvent] = downListener;
      }
      if (upListener) {
        this.pressed[subEvent] = false;
        this.upListeners[subEvent] = upListener;
      }
    });
  }

  reset() {
    this.pressed = {};
  }
}
