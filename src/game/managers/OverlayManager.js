import TitleOverlay from '../overlays/TitleOverlay';
import CharacterOverlay from '../overlays/CharacterOverlay';
import GameOverOverlay from '../overlays/GameOverOverlay';
import LeaderboardOverlay from '../overlays/LeaderboardOverlay';
import SettingsOverlay from '../overlays/SettingsOverlay';

export let OverlayType = {
  CHARACTER_SELECT: undefined,
  GAME_OVER: undefined,
  LEADERBOARD: undefined,
  SETTINGS: undefined,
  TITLE: undefined,
};

export default class OverlayManager {
  game;
  current = null;
  previous = null;

  constructor(game) {
    this.game = game;

    OverlayType.CHARACTER_SELECT = new CharacterOverlay(game);
    OverlayType.GAME_OVER = new GameOverOverlay(game);
    OverlayType.LEADERBOARD = new LeaderboardOverlay(game);
    OverlayType.SETTINGS = new SettingsOverlay(game);
    OverlayType.TITLE = new TitleOverlay(game);
  }

  async open(overlay, fade = true) {
    if (overlay.opened || (this.current && (!this.current.skippable || this.current.busy))) {
      return;
    }
    if (overlay.beforeOpen()) {
      if (this.previous) {
        this.forceClose();
      }
      if (this.current) {
        this.previous = this.current;
        this.previous.hide();
      }
      this.current = overlay;

      await this.current.open(fade && !this.previous);
      this.current.afterOpen();
      this.game.hide();
    }
  }

  async close(fade = true) {
    if (!this.current || !this.current.opened || !this.current.skippable) {
      return;
    }
    if (this.current.beforeClose()) {
      await this.current.close(fade && !this.previous);

      const current = this.current;

      if (this.previous) {
        this.current = this.previous;
        this.previous.show();
        this.previous = null;
      } else {
        this.current = null;
        this.previous = null;
      }

      const next = current.afterClose();
      if (next) {
        this.open(next);
      } else {
        this.game.show();
      }
    }
  }

  async forceClose() {
    if (!this.current) {
      return;
    }
    await this.current.close(false);
    this.current = null;
    this.previous = null;
    this.game.show();
  }

  update(dt) {
    if (this.current) {
      this.current.update(dt);
    }
  }

  reset() {
    this.forceClose();
  }
}
