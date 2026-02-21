import Matter from 'matter-js';
import * as Pixi from 'pixi.js';
import { GameObject } from './GameObject';

export class Block extends GameObject {
  constructor(app: Pixi.Application, container: Pixi.Container, world: Matter.World, x: number, y: number, width: number, height: number) {
    super(app, container, world);

    const graphics = new Pixi.Graphics()
      .rect(0, 0, width, height)
      .fill({ color: 0x8B4513 });
    this.sprite.addChild(graphics);
    this.sprite.pivot.set(width / 2, height / 2);
    this.sprite.position.set(x, y);

    this.body = Matter.Bodies.rectangle(x, y, width, height, {
      restitution: 0.3,
      friction: 0.5,
      density: 0.001,
      label: 'block'
    });

    Matter.World.add(this.world, this.body);
  }
}