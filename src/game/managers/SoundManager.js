import { Loader } from 'pixi.js';

export let MusicType = {
  WAKALAKA: undefined,
};

export let EffectType = {
  BOOST: undefined,
  COIN: undefined,
  JUMP: undefined,
  POWER_UP: undefined,
};

export let VoiceType = {
  BOOST: undefined,
};

export default class SoundManager {
  CONSTANT = 0.025;

  game;

  #currentMusic = null;

  constructor(game) {
    this.game = game;

    // Music
    MusicType.WAKALAKA = Loader.shared.resources.bgMusic.sound;
    this.setMusicVolume(game.DEFAULT_MUSIC_VOLUME);

    // Effect
    EffectType.BOOST = Loader.shared.resources.boostSound.sound;
    EffectType.COIN = Loader.shared.resources.coinSound.sound;
    EffectType.JUMP = Loader.shared.resources.jumpSound.sound;
    EffectType.POWER_UP = Loader.shared.resources.powerupSound.sound;
    this.setEffectVolume(game.DEFAULT_EFFECTS_VOLUME);

    // Voice
    VoiceType.BOOST = Loader.shared.resources.boostSound.sound;
    this.setEffectVolume(game.DEFAULT_VOICE_VOLUME);
  }

  percentageToVolume(value) {
    return value !== 0 ? Math.pow(10, this.CONSTANT * (value - 100)) : 0;
  }

  volumeToPercentage(value) {
    return value !== 0 ? Math.log(value) / Math.log(10) / this.CONSTANT + 100 : 0;
  }

  //
  // Music
  //

  playMusic(value = null) {
    if (value === this.#currentMusic) {
      return;
    } else if (this.#currentMusic) {
      this.#currentMusic.loop = false;
      this.#currentMusic.stop();
    }
    if (value) {
      value.loop = true;
      value.play();
    }
    this.#currentMusic = value;
  }

  getMusicVolume() {
    return this.volumeToPercentage(MusicType.WAKALAKA.volume);
  }

  setMusicVolume(value) {
    MusicType.WAKALAKA.volume = this.percentageToVolume(value);
  }

  //
  // Effect
  //

  playEffect(value) {
    if (value) {
      value.play();
    }
  }

  getEffectVolume() {
    return this.volumeToPercentage(EffectType.POWER_UP.volume);
  }

  setEffectVolume(value) {
    EffectType.BOOST.volume = this.percentageToVolume(value);
    EffectType.COIN.volume = EffectType.BOOST.volume;
    EffectType.JUMP.volume = EffectType.BOOST.volume;
    EffectType.POWER_UP.volume = EffectType.BOOST.volume;
  }

  //
  // Voice
  //

  playVoice(value) {
    if (value) {
      value.play();
    }
  }

  getVoiceVolume() {
    return this.volumeToPercentage(VoiceType.BOOST.volume);
  }

  setVoiceVolume(value) {
    VoiceType.BOOST.volume = this.percentageToVolume(value);
  }
}
