import { Container, Rectangle, filters, BitmapText, UPDATE_PRIORITY } from 'pixi.js';

import Background from './Background';
import Player from './Player';
import Map from './Map';
import HUD from './HUD';
import GameOverOverlay from './overlays/GameOverOverlay';

export default class Game {
  app;
  container = new Container();

  // Properties
  score = 0;
  boosts = 0;

  // Objects
  background;
  map;
  player;
  hud;

  // Overlays
  gameOverOverlay;

  primaryActionPressed = false;
  secondaryActionPressed = false;

  constructor(app) {
    this.app = app;

    this.background = new Background(this);
    this.map = new Map(this);
    this.player = new Player(this);
    this.hud = new HUD(this);
    this.gameOverOverlay = new GameOverOverlay(this);

    this.reset();

    // Compose stage
    this.container.addChild(this.background.container);
    this.container.addChild(this.map.container);
    this.container.addChild(this.player.container);
    this.container.addChild(this.hud.container);

    // Register event listeners
    window.addEventListener('keydown', (event) => {
      if (event.code === 'KeyW') {
        event.preventDefault();
        event.stopPropagation();
        this.startPrimaryAction();
      }
      if (event.code === 'KeyD') {
        event.preventDefault();
        event.stopPropagation();
        this.startSecondaryAction();
      }
    });
    window.addEventListener('keyup', (event) => {
      if (event.code === 'KeyW') {
        event.preventDefault();
        event.stopPropagation();
        this.endPrimaryAction();
      }
      if (event.code === 'KeyD') {
        event.preventDefault();
        event.stopPropagation();
        this.endSecondaryAction();
      }
    });
    app.stage.on('pointerdown', (event) => {
      event.stopPropagation();
      this.startPrimaryAction();
    });
    app.stage.on('pointerup', (event) => {
      event.stopPropagation();
      this.endPrimaryAction();
    });

    // Start game loop
    console.debug('Starting game loop');
    this.app.ticker.add(this.update, this, UPDATE_PRIORITY.HIGH);
  }

  startPrimaryAction() {
    if (this.primaryActionPressed) {
      return;
    }
    this.primaryActionPressed = true;

    if (this.player.dead) {
      this.reset();
    } else if (!this.player.airborne) {
      this.player.startJump();
    }
  }

  endPrimaryAction() {
    if (!this.primaryActionPressed) {
      return;
    }
    this.primaryActionPressed = false;
    this.player.endJump();
  }

  startSecondaryAction() {
    if (this.secondaryActionPressed) {
      return;
    }
    this.secondaryActionPressed = true;

    if (this.boosts > 0) {
      this.increaseBoost(-1);
      this.player.startBoost();
    }
  }

  endSecondaryAction() {
    if (!this.secondaryActionPressed) {
      return;
    }
    this.secondaryActionPressed = false;
  }

  checkGameOver() {
    // Check for death
    if (this.player.position.y > this.app.screen.height) {
      this.player.dead = true;
      this.map.itemEffects.forEach((itemEffect) => itemEffect.destroy());
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
    this.app.stats.begin();


    this.player.update(dt);

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
        if (landing && this.primaryActionPressed) {
          console.debug('Early jump');
          this.player.startJump();
        }
      }
    );

    this.background.update(dt);
    this.map.update(dt);

    this.checkGameOver();

    // End performance measurement
    this.app.stats.end();
  }

  reset() {
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

    // Temp
    this.primaryActionPressed = false;
    this.secondaryActionPressed = false;
  }
}
