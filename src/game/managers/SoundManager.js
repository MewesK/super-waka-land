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
  RAT1: undefined,
  RAT2: undefined,
  ORANGE1: undefined,
  ORANGE2: undefined,
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
    EffectType.BOOST = Loader.shared.resources.boostEffect.sound;
    EffectType.COIN = Loader.shared.resources.coinEffect.sound;
    EffectType.JUMP = Loader.shared.resources.jumpEffect.sound;
    EffectType.POWER_UP = Loader.shared.resources.powerupEffect.sound;
    this.setEffectVolume(game.DEFAULT_EFFECTS_VOLUME);

    // Voice
    VoiceType.ORANGE1 = Loader.shared.resources.orange1Voice.sound;
    VoiceType.ORANGE2 = Loader.shared.resources.orange2Voice.sound;
    VoiceType.RAT1 = Loader.shared.resources.rat1Voice.sound;
    VoiceType.RAT2 = Loader.shared.resources.rat2Voice.sound;
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
    return this.volumeToPercentage(VoiceType.ORANGE1.volume);
  }

  setVoiceVolume(value) {
    VoiceType.ORANGE1.volume = this.percentageToVolume(value);
    VoiceType.ORANGE2.volume = VoiceType.ORANGE1.volume;
    VoiceType.RAT1.volume = VoiceType.ORANGE1.volume;
    VoiceType.RAT2.volume = VoiceType.ORANGE1.volume;
  }
}
