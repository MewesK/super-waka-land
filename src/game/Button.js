import { Sprite, Texture } from 'pixi.js';

export default class Button {
  game;
  container = new Container();

  text;

  startSprite;
  middleSprites = [];
  endSprite;

  startActiveTexture;
  middleActiveTexture;
  endActiveTexture;

  constructor(game, text, x, y, tilesWidth = 2) {
    if (tilesWidth < 2) {
      throw new Error('Must be bigger or equal to 2.');
    }

    this.game = game;

    // Text
    this.text = new BitmapText(text, {
      fontName: 'Stop Bullying',
      fontSize: 20,
    });
    this.text.x = (tilesWidth * this.startSprite.width) / 2 - this.text.width / 2;
    this.text.y = this.startSprite.height / 2 - this.text.height / 2;

    // Sprites
    this.startSprite = Sprite.from('banner1');
    this.container.addChild(this.startSprite);
    for (let index = 0; index < tilesWidth - 2; index++) {
      const middleSprite =  Sprite.from('banner2');
      this.middleSprites.push(middleSprite);
      this.container.addChild(middleSprite);
    }
    this.endSprite = Sprite.from('banner3');
    this.container.addChild(this.endActiveSprite);
    this.container.addChild(this.titleText);

    // Textures
    this.startActiveTexture = Texture.from('banner_active1');
    this.middleActiveTexture = Texture.from('banner_active2');
    this.endActiveTexture = Texture.from('banner_active3');
  }
}
