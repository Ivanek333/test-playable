import * as Pixi from 'pixi.js';
import Matter from 'matter-js';
import * as TWEEN from '@tweenjs/tween.js';
import { GameManager } from './Components/GameManager';
import { OrientationManager } from './utils/OrientationHandler';
import { loadAllTextures } from './utils/AssetManager';

type ConfigTexture = { path: string, w: number, h: number}

declare global {
  interface Window {
    GAME_CONFIG: {
      dragDistance: { min: number, max: number };
      maxLaunchForce: number;
      maxLaunchForceDistance: number;
      barrelDefaultRotationDeg: number;
      textures: {
        projectile: ConfigTexture;
      };
    };
  }
}

const design_width = 800;
const design_height = 600;

async function init() {
  await OrientationManager.getInstance().enforceLandscape();
  await loadAllTextures();
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

  const gameContainer = new Pixi.Container();
  app.stage.addChild(gameContainer);

  function updateViewport() {
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const scale = Math.min(screenW / design_width, screenH / design_height);
    gameContainer.scale.set(scale);
    gameContainer.x = (screenW - design_width * scale) / 2;
    gameContainer.y = (screenH - design_height * scale) / 2;
  }
  updateViewport();

  const game = new GameManager(app, gameContainer, design_width, design_height);

  window.addEventListener('resize', () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
    updateViewport();
    game.onResize?.();
  });

  (window as any).game = game;
}

document.addEventListener('DOMContentLoaded', init);