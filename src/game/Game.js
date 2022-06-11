import { Container, Loader, UPDATE_PRIORITY } from 'pixi.js';

import Background from './Background';
import Player from './Player';
import Map from './Map';
import HUD from './HUD';
import InputManager from './InputManager';

import GameOverOverlay from './overlays/GameOverOverlay';
import TitleOverlay from './overlays/TitleOverlay';

export default class Game {
  app;
  container = new Container();
  inputManager;
  backgroundMusic;

  // Properties
  paused = true;
  score = 0;
  boosts = 0;

  // Objects
  background;
  map;
  player;
  hud;

  // Overlays
  gameOverOverlay;
  titleOverlay;

  constructor(app) {
    this.app = app;
    this.inputManager = new InputManager(this);
    this.backgroundMusic = Loader.shared.resources.backgroundMusic.sound;
    this.backgroundMusic.loop = true;
    this.backgroundMusic.volume = 0.03;
    this.backgroundMusic.play();

    this.background = new Background(this);
    this.map = new Map(this);
    this.player = new Player(this);
    this.hud = new HUD(this);

    this.gameOverOverlay = new GameOverOverlay(this);
    this.titleOverlay = new TitleOverlay(this);

    this.reset();

    // Compose stage
    this.container.addChild(this.background.container);
    this.container.addChild(this.map.container);
    this.container.addChild(this.player.container);
    this.container.addChild(this.hud.container);
    this.app.stage.addChild(this.container);

    this.titleOverlay.show();

    // Register event listeners
    this.inputManager.on(
      'jump',
      ['s', 'pointer'],
      () => {
        if (this.paused) {
          this.paused = false;
          this.reset();
        } else if (this.player.dead) {
          this.reset();
        } else if (!this.player.airborne) {
          this.player.startJump();
        }
      },
      () => {
        this.player.endJump();
      }
    );
    this.inputManager.on('boost', ['d', 'swipeup'], () => {
      if (this.boosts > 0) {
        this.increaseScore(50);
        this.increaseBoost(-1);
        this.player.startBoost();
      }
    });

    // Start game loop
    console.debug('Starting game loop');
    this.app.ticker.add(this.update, this, UPDATE_PRIORITY.HIGH);
  }

  checkGameOver() {
    // Check for death
    if (this.player.position.y > this.app.screen.height) {
      this.player.dead = true;
      this.gameOverOverlay.show();
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
    if (this.player.dead) {
      return;
    }

    // Start performance measurement
    if (process.env.NODE_ENV !== 'production') {
      this.app.stats.begin();
    }

    this.player.update(dt);
    this.background.update(dt);
    this.map.update(dt);

    let landing = false;
    this.map.checkCollision(
      // collectCoinCallback
      (tileRectangle) => {
        this.increaseScore(10);
      },
      // collectCokeCallback
      (tileRectangle) => {
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
      (intersecting) => {
        this.player.airborne = !intersecting;

        // Start jumping if just landed but still holding key
        if (landing && this.inputManager.pressed['jump']) {
          console.debug('Early jump');
          this.player.startJump();
        }
      }
    );

    this.checkGameOver();

    this.gameOverOverlay.update(dt);
    this.titleOverlay.update(dt);

    // End performance measurement
    if (process.env.NODE_ENV !== 'production') {
      this.app.stats.end();
    }
  }

  reset() {
    this.inputManager.reset();

    // Properties
    this.score = 0;
    this.boosts = 0;

    // Objects
    this.background.reset();
    this.map.reset();
    this.player.reset();
    this.hud.reset();

    // Overlays
    this.gameOverOverlay.hide();
    this.titleOverlay.hide();
  }
}
