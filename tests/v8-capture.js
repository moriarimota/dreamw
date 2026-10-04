// Loaded only by the isolated UI fixture, before app.js creates Phaser.
const TestGameBase = Phaser.Game;
Phaser.Game = class extends TestGameBase {
  constructor(config) { super(config); window.__testGame = this; }
};
