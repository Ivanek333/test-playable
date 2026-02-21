import Matter from 'matter-js';
import * as Pixi from 'pixi.js';
import { GameObject } from './GameObject';
import { createFallbackTexture, getTextureFromConfigPath } from '../utils/AssetManager';

export class Projectile extends GameObject {
  constructor(app: Pixi.Application, container: Pixi.Container, world: Matter.World, x: number, y: number) {
    super(app, container, world);

    // const texture = Pixi.Assets.get('assets/ball.png');
    const textureConfig = window.GAME_CONFIG.textures.projectile
    const radius = Math.sqrt(textureConfig.w * textureConfig.h)/2;
    const texture = getTextureFromConfigPath(textureConfig.path) 
        || createFallbackTexture(app, (g) => g.circle(0,0,12).fill(0x333333), 24, 24);

    const sprite = new Pixi.Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.width = textureConfig.w;
    sprite.height = textureConfig.h;
    this.sprite.addChild(sprite);
    this.sprite.position.set(x, y);

    this.body = Matter.Bodies.circle(x, y, radius, {
      restitution: 0.5,
      friction: 0.1,
      density: 0.002,
      label: 'projectile'
    });

    Matter.World.add(this.world, this.body);
  }

  public fire(forceX: number, forceY: number): void {
    if (this.body) {
      Matter.Body.applyForce(this.body, this.body.position, { x: forceX, y: forceY });
    }
  }
}