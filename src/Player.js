import { AnimatedSprite, Point, Sprite, Rectangle, Container } from "pixi.js";

export default class Player {
  container = new Container();

  // Properties
  force = new Point(0, 0);
  velocity = new Point(0, 0);
  position = new Point(0, 0);
  power;
  mass;

  // State
  dead = false;
  #airborne = true;

  // Sprites
  spriteWidth = 16;
  spriteHight = 32;
  ratIdleSprite;
  ratWalkSprite;
  ratRunSprite;
  ratJumpSprite;

  constructor(power, mass) {
    this.power = power;
    this.mass = mass;

    this.createSprites();

    // Compose stage
    this.container.addChild(this.ratRunSprite);
  }

  get containerRectangle() {
    return new Rectangle(
      this.container.position.x,
      this.container.position.y,
      16,
      32
    );
  }

  get airborne() {
    return this.#airborne;
  }

  set airborne(value) {
    if (this.#airborne != value) {
      this.#airborne = value;

      if (value) {
        this.container.removeChildren();
        this.container.addChild(this.ratJumpSprite);
      } else {
        if (this.velocity.x === 0) {
          this.container.removeChildren();
          this.container.addChild(this.ratIdleSprite);
        } else if (this.velocity.x < 3) {
          this.container.removeChildren();
          this.container.addChild(this.ratWalkSprite);
        } else {
          this.container.removeChildren();
          this.container.addChild(this.ratRunSprite);
        }
      }
    }
  }

  createSprites() {
    this.ratIdleSprite = Sprite.from("rat_jump.png");
    this.ratIdleSprite.x = this.position.x;
    this.ratIdleSprite.y = this.position.y;

    this.ratWalkSprite = AnimatedSprite.fromFrames([
      "rat_idle.png",
      "rat_walk.png",
    ]);
    this.ratWalkSprite.animationSpeed = 0.1;
    this.ratWalkSprite.x = this.position.x;
    this.ratWalkSprite.y = this.position.y;
    this.ratWalkSprite.play();

    this.ratRunSprite = AnimatedSprite.fromFrames([
      "rat_idle.png",
      "rat_run.png",
    ]);
    this.ratRunSprite.animationSpeed = 0.15;
    this.ratRunSprite.x = this.position.x;
    this.ratRunSprite.y = this.position.y;
    this.ratRunSprite.play();

    this.ratJumpSprite = Sprite.from("rat_jump.png");
    this.ratJumpSprite.x = this.position.x;
    this.ratJumpSprite.y = this.position.y;
  }

  move(dt) {
    if (this.dead) {
      return;
    }

    // Calculate velocity
    this.velocity.x += (this.force.x / this.mass) * dt;
    // Cap horizontal velocity
    if (this.velocity.x > 10) {
      this.velocity.x = 10;
    }
    // Calculate gravity only when airborne
    if (this.#airborne) {
      this.velocity.y += (this.force.y / this.mass) * dt;
    }

    // Calculate position
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.container.position.set(this.container.position.x, this.position.y);
  }

  jump(actionTimer = 0) {
    if (this.dead || this.#airborne) {
      return;
    }

    this.velocity.y = this.power;
    this.airborne = true;
  }
}
