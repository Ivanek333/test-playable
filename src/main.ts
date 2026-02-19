import * as Pixi from 'pixi.js';
import Matter from 'matter-js';
import * as TWEEN from '@tweenjs/tween.js';
import { GameManager } from './GameManager';


declare global {
  interface Window {
    GAME_CONFIG: {
      maxDragDistance: number;
      maxLaunchForce: number;
    };
  }
}

async function init() {
  const app = new Pixi.Application();
  await app.init({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x87CEEB,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    antialias: true
  });
  document.body.appendChild(app.canvas);

  const game = new GameManager(app);

  window.addEventListener('resize', () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
  });
}

document.addEventListener('DOMContentLoaded', init);