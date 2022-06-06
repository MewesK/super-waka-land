import { Container, Rectangle, filters, BitmapText, UPDATE_PRIORITY } from 'pixi.js';

import Background from './Background';
import Player from './Player';
import Map from './Map';

export default class Game {
  app;
  container = new Container();
  levelContainer = new Container();

  background;
  map;
  player;

  // Properties
  score = 0;
  scoreText;

  boosts = 0;
  boostText;

  // Game over
  gameOver = new Container();
  gameOverText1;
  gameOverText2;

  primaryActionPressed = false;
  secondaryActionPressed = false;

  constructor(app) {
    this.app = app;

    this.background = new Background(this);
    this.map = new Map(this);
    this.player = new Player(this);

    // Score text
    this.scoreText = new BitmapText('Score: 0', {
      fontName: 'Edit Undo',
      fontSize: 16,
      tint: 0x935e53,
    });
    this.scoreText.x = 2;

    // Boost text
    this.boostText = new BitmapText('Boost: ', {
      fontName: 'Edit Undo',
      fontSize: 16,
      tint: 0x935e53,
    });
    this.boostText.x = 2;
    this.boostText.y = 10;

    this.createSprites();
    this.reset();

    // Compose stage
    this.levelContainer.addChild(this.background.container);
    this.levelContainer.addChild(this.map.container);
    this.levelContainer.addChild(this.player.container);
    this.levelContainer.addChild(this.scoreText);
    this.levelContainer.addChild(this.boostText);
    this.container.addChild(this.levelContainer);

    this.app.stage.interactive = true;
    this.app.stage.addChild(this.container);
    this.app.renderer.render(this.app.stage);

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

      const filter1 = new filters.ColorMatrixFilter();
      filter1.desaturate();
      const filter2 = new filters.ColorMatrixFilter();
      filter2.brightness(0.5, false);
      this.levelContainer.filterArea = new Rectangle(
        0,
        0,
        this.levelContainer.width,
        this.levelContainer.height
      );
      this.levelContainer.filters = [filter1, filter2];

      this.gameOverText2.text = 'Final Score: ' + this.score;
      this.gameOverText2.x = this.app.screen.width / 2 - this.gameOverText2.width / 2;

      this.container.addChild(this.gameOver);
    }
  }

  createSprites() {
    // Game over screen
    this.gameOverText1 = new BitmapText('Game Over', {
      fontName: 'Edit Undo',
      fontSize: 30,
    });
    this.gameOver.addChild(this.gameOverText1);
    this.gameOverText1.x = this.app.screen.width / 2 - this.gameOverText1.width / 2;

    this.gameOverText2 = new BitmapText('Final Score: 0', {
      fontName: 'Edit Undo',
      fontSize: 16,
    });
    this.gameOver.addChild(this.gameOverText2);
    this.gameOverText2.x = this.app.screen.width / 2 - this.gameOverText2.width / 2;
    this.gameOverText2.y = 30;

    this.gameOver.y = this.app.screen.height / 2 - this.gameOver.height / 2;
  }

  increaseScore(value) {
    this.score += value;
    this.scoreText.text = 'Score: ' + this.score;
  }

  increaseBoost(value) {
    this.boosts += value;
    this.boostText.text = 'Boost: ' + this.boosts;
  }

  update(dt) {
    if (this.player.dead) {
      return;
    }

    // Start performance measurement
    this.app.stats.begin();

    this.map.generateMap();

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
    this.background.reset();
    this.map.reset();
    this.player.reset();

    // Properties
    this.score = 0;
    this.increaseScore(0);
    this.boosts = 0;
    this.increaseBoost(0);

    // Game over
    this.container.removeChild(this.gameOver);
    this.levelContainer.filters = null;

    // Temp
    this.primaryActionPressed = false;
    this.secondaryActionPressed = false;
  }
}
