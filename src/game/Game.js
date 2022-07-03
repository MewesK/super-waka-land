import { Container, Loader, Rectangle, UPDATE_PRIORITY } from 'pixi.js';

import { DEBUG } from './Utilities';
import Background from './Background';
import Player from './Player';
import Map from './Map';
import HUD from './HUD';
import InputManager from './managers/InputManager';
import OverlayManager, { OverlayType } from './managers/OverlayManager';
import SoundManager, { MusicType, SoundType } from './managers/SoundManager';

export default class Game {
  DEFAULT_DIFFICULTY = localStorage.getItem('DIFFICULTY') || 1;
  DEFAULT_MUSIC_VOLUME = localStorage.getItem('MUSIC_VOLUME') || 0.3;
  DEFAULT_EFFECTS_VOLUME = localStorage.getItem('EFFECTS_VOLUME') || 0.7;

  app;
  container;

  // Rendering layers
  background;
  map;
  player;
  hud;

  // Managers
  inputManager;
  overlayManager;
  soundManager;

  // Properties
  started = false;
  paused = false;
  difficulty = this.DEFAULT_DIFFICULTY;

  score = 0;
  boosts = 0;

  constructor(app) {
    this.app = app;

    // Rendering layers
    this.background = new Background(this);
    this.map = new Map(this);
    this.player = new Player(this);
    this.hud = new HUD(this);

    // Managers
    this.overlayManager = new OverlayManager(this);
    this.inputManager = new InputManager(this);
    this.soundManager = new SoundManager(this);

    // Create container
    this.container = new Container();
    this.container.filterArea = new Rectangle(0, 0, this.app.screen.width, this.app.screen.height);
    this.app.stage.addChild(this.container);
    this.container.addChild(this.background.container);
    this.container.addChild(this.map.container);
    this.container.addChild(this.player.container);
    this.container.addChild(this.hud.container);

    // Register event listeners
    this.inputManager.on({
      name: 'jump',
      keys: ['s', 'pointer', ' '],
      onDown: () => {
        if (this.started && !this.paused && !this.player.dead && !this.player.airborne) {
          this.player.startJump();
        }
      },
      onUp: () => {
        if (this.started && !this.paused && !this.player.dead && this.player.airborne) {
          this.player.endJump();
        }
      },
    });
    this.inputManager.on({
      name: 'boost',
      keys: ['d', 'swipeup', 'Shift'],
      onDown: () => {
        if (this.started && !this.paused && !this.player.dead && this.boosts > 0) {
          this.increaseScore(50);
          this.increaseBoost(-1);
          this.player.startBoost();
        }
      },
    });
    this.inputManager.on({
      name: 'reset',
      keys: ['r'],
      onUp: () => this.reset(),
    });
    this.inputManager.on({
      name: 'settings',
      keys: ['Escape'],
      onUp: () => {
        if (OverlayType.SETTINGS.opened && OverlayType.SETTINGS.skippable) {
          this.overlayManager.close();
        } else if (
          !OverlayType.SETTINGS.opened &&
          (!this.overlayManager.current || !this.overlayManager.current.busy)
        ) {
          this.overlayManager.open(OverlayType.SETTINGS);
        }
      },
    });

    // Start background music
    this.soundManager.playMusic(MusicType.WAKALAKA);

    // Open title overlay
    this.overlayManager.open(OverlayType.TITLE);

    // Start game loop
    console.debug('Starting game loop');
    this.app.ticker.add(this.update, this, UPDATE_PRIORITY.HIGH);
  }

  checkGameOver() {
    // Check for death
    if (this.player.position.y > this.app.screen.height) {
      this.player.dead = true;
      this.overlayManager.open(OverlayType.GAME_OVER);
    }
  }

  increaseBoost(value) {
    this.boosts += value;
    this.hud.updateBoost();
  }

  increaseScore(value) {
    this.score += value;
    this.hud.updateScore();
  }

  update(dt) {
    this.overlayManager.update(dt);

    if (this.player.dead || this.paused) {
      return;
    }

    // Start performance measurement
    if (DEBUG) {
      this.app.stats.begin();
    }

    this.player.update(dt);
    this.map.update(dt);
    this.background.update(dt);

    let landing = false;
    this.map.checkCollision(
      // collectCoinCallback
      () => {
        this.soundManager.playSound(SoundType.COIN);
        this.increaseScore(10);
      },
      // collectCokeCallback
      () => {
        this.soundManager.playSound(SoundType.POWER_UP);
        this.increaseScore(50);
        this.increaseBoost(1);
      },
      // intersectFloorCallback
      (tileRectangle) => {
        // Fix position and cancel falling
        this.player.setVelocity(null, 0, true);
        this.player.setPosition(null, tileRectangle.y - this.player.height, true);

        // Check for landing
        if (this.player.airborne) {
          console.debug('Landed');
          landing = true;
        }
      },
      // finishCallback
      (intersecting, touching) => {
        this.player.airborne = !intersecting && !touching;

        // Start jumping if just landed but still holding key
        if (landing && this.inputManager.isActive('jump')) {
          console.debug('Early jump');
          this.player.startJump();
        }
      }
    );
    this.checkGameOver();

    // End performance measurement
    if (DEBUG) {
      this.app.stats.end();
    }
  }

  reset() {
    // Properties
    this.started = true;
    this.score = 0;
    this.boosts = 0;

    // Objects
    this.background.reset();
    this.map.reset();
    this.player.reset();
    this.hud.reset();

    // Managers
    this.inputManager.reset();
    this.overlayManager.reset();
    this.soundManager.reset();
  }
}
