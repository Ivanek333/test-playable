import Matter from 'matter-js';
import * as Pixi from 'pixi.js';
import { GameObject } from './GameObject';

export class Projectile extends GameObject {
  constructor(app: Pixi.Application, world: Matter.World, x: number, y: number, radius: number) {
    super(app, world);

    const graphics = new Pixi.Graphics()
      .circle(0, 0, radius)
      .fill({ color: 0x333333 });
    this.sprite.addChild(graphics);
    this.sprite.position.set(x, y);

    this.body = Matter.Bodies.circle(x, y, radius, {
      restitution: 0.5,
      friction: 0.1,
      density: 0.002,
      label: 'projectile'
    });

    Matter.World.add(this.world, this.body);
    app.stage.addChild(this.sprite);
  }

  public fire(forceX: number, forceY: number): void {
    if (this.body) {
      Matter.Body.applyForce(this.body, this.body.position, { x: forceX, y: forceY });
    }
  }
}