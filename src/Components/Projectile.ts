import Matter from 'matter-js';
import * as Pixi from 'pixi.js';
import { GameObject } from './GameObject';
import { createFallbackTexture, getTextureFromConfigPath } from '../utils/AssetManager';

export class Projectile extends GameObject {
  constructor(app: Pixi.Application, container: Pixi.Container, world: Matter.World, x: number, y: number) {
    super(app, container, world);

    const textureConfig = window.conf.textures.projectile
    const radius = Math.sqrt(textureConfig.w * textureConfig.h)/2;
    const texture = getTextureFromConfigPath(textureConfig.path) 
        || createFallbackTexture(app, (g) => g.circle(0, 0, radius).fill(0xbb00bb));

    const sprite = new Pixi.Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.width = textureConfig.w;
    sprite.height = textureConfig.h;
    this.view.addChild(sprite);
    this.view.position.set(x, y);

    this.body = Matter.Bodies.circle(x, y, radius, {
      restitution: 0.1,
      friction: 0.1,
      density: window.conf.projectileDensity,
      frictionAir: 0,
      label: 'projectile'
    });

    Matter.World.add(this.world, this.body);
  }

  public fire(force: Matter.Vector): void {
    if (this.body) {
      Matter.Body.applyForce(this.body, this.body.position, force);
    }
  }

  public isAtRest(): boolean {
    if (!this.body) return true;
    const speedSq = this.body.velocity.x ** 2 + this.body.velocity.y ** 2;
    const angularSpeed = Math.abs(this.body.angularVelocity);
    return speedSq < 0.01 && angularSpeed < 0.01;
  }
}