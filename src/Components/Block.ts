import Matter from 'matter-js';
import * as Pixi from 'pixi.js';
import { GameObject } from './GameObject';
import { createFallbackTexture, getTextureFromConfigPath } from '../utils/AssetManager';
import { BlockData, ConfigTexture } from '../utils/Types';

export class Block extends GameObject {

  private damage: number;
  private textures: Array<ConfigTexture>;
  private sprite: Pixi.Sprite;
  private creationTime: number;

  constructor(app: Pixi.Application, container: Pixi.Container, world: Matter.World, type: number, x: number, y: number, r: number, damage: number) {
    super(app, container, world);

    this.damage = damage;
    switch (type) {
      case 0:
        this.textures = [window.conf.textures.block_short_damage0, window.conf.textures.block_short_damage1];
        break;
      case 1: 
        this.textures = [window.conf.textures.block_long_damage0, window.conf.textures.block_long_damage1];
        break;
      default:
        this.textures = []
        break;
    }
    this.sprite = new Pixi.Sprite();
    this.sprite.anchor.set(0.5);
    this.view.addChild(this.sprite);
    this.view.position.set(x, y);
    this.updateTexture();

    this.body = Matter.Bodies.rectangle(x, y, this.textures[0].w, this.textures[0].h, {
      restitution: 0.2,
      friction: 0.5,
      density: 0.002,
      label: 'block'
    });
    Matter.Body.setAngle(this.body, r / 180 * Math.PI);
    Matter.World.add(this.world, this.body);
    this.creationTime = app.ticker.lastTime;
  }

  public dealDamage(value: number): void {
    if (this.app.ticker.lastTime - this.creationTime < window.conf.immunityTime) return;
    this.damage += value;
    if (this.damage >= this.textures.length) {
      this.destroy();
    } else {
      this.updateTexture();
    }
  }

  private updateTexture(): void {
    const textureConfig = this.textures[this.damage];
    const texture = getTextureFromConfigPath(textureConfig.path) 
        || createFallbackTexture(this.app, (g) => g.rect(0, 0, textureConfig.w, textureConfig.h).fill(0xbb00bb));
    
    this.sprite.texture = texture;
    this.sprite.width = textureConfig.w;
    this.sprite.height = textureConfig.h;
  }
}