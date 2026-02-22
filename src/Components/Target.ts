import Matter from 'matter-js';
import * as Pixi from 'pixi.js';
import { GameObject } from './GameObject';
import { createFallbackTexture, getTextureFromConfigPath } from '../utils/AssetManager';

export class Target extends GameObject {
  constructor(app: Pixi.Application, container: Pixi.Container, world: Matter.World) {
    super(app, container, world);

    const pos = {
      x: window.conf.positions.castle.x + window.conf.positions.targetLocal.x,
      y: window.conf.positions.castle.y - window.conf.positions.targetLocal.y
    }
    const textureConfig = window.conf.textures.target;
    const radius = Math.sqrt(textureConfig.w * textureConfig.h)/2;
    const texture = getTextureFromConfigPath(textureConfig.path) 
        || createFallbackTexture(app, (g) => g.circle(0, 0, radius).fill(0xbb00bb));

    const sprite = new Pixi.Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.width = textureConfig.w;
    sprite.height = textureConfig.h;
    this.view.addChild(sprite);
    this.view.position.set(pos.x, pos.y);

    this.body = Matter.Bodies.rectangle(pos.x, pos.y, textureConfig.w, textureConfig.h, { label: 'target' });
    Matter.World.add(this.world, this.body);
  }
}