import Matter from 'matter-js';
import * as Pixi from 'pixi.js';

export abstract class GameObject {
  public sprite: Pixi.Container;
  public body?: Matter.Body;
  protected world: Matter.World;

  constructor(protected app: Pixi.Application, world: Matter.World) {
    this.sprite = new Pixi.Container();
    this.world = world;
  }

  public update(_deltaTime: number): void {
    if (this.body) {
      this.sprite.position.set(this.body.position.x, this.body.position.y);
      this.sprite.rotation = this.body.angle;
    }
  }
  
  public destroy(): void {
    if (this.body && this.world) {
      Matter.World.remove(this.world, this.body);
    }
    this.sprite.destroy({ children: true });
  }
}